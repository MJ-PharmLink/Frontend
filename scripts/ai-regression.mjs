#!/usr/bin/env node
/**
 * AI 챗봇 질문 유형별 회귀 테스트.
 *
 * 실제 백엔드(Docker)에 로그인해 docs/chatbot/ai-test-cases.json 의 질문을 차례로 보내고,
 * HTTP 상태 · intent · 답변 키워드 · 실제 ERP 조회값(ground truth)을 대조한 결과를
 * docs/chatbot/reports/ 에 마크다운과 JSON으로 남긴다. 외부 패키지 없이 Node 18+ 로 돈다.
 *
 * 사용법
 *   AI_TEST_USERNAME=admin AI_TEST_PASSWORD=... node scripts/ai-regression.mjs
 *   옵션: --base http://localhost:8080/api/v1   (기본값 VITE_API_BASE_URL 또는 이 주소)
 *         --only LS,INV                         (케이스 id 접두사로 거르기)
 *         --delay 1500                          (질문 사이 대기 ms, Gemini 호출 한도 보호)
 *   WAREHOUSE 역할 케이스(AUTH-03)는 AI_TEST_WAREHOUSE_USERNAME / _PASSWORD 가 있을 때만 돈다.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}

const BASE = opt("base", process.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/$/, "")
const ONLY = opt("only", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
const DELAY = Number(opt("delay", "1500"))
const TIMEOUT_MS = 95_000

const { cases } = JSON.parse(readFileSync(join(ROOT, "docs/chatbot/ai-test-cases.json"), "utf8"))

/* ───────────── HTTP ───────────── */

async function call(path, { method = "GET", body, token } = {}) {
  const headers = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`
  const started = Date.now()
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    let json = null
    try {
      json = await res.json()
    } catch {
      /* 본문 없음 */
    }
    return { status: res.status, json, ms: Date.now() - started }
  } catch (e) {
    return { status: e?.name === "TimeoutError" ? -1 : 0, json: null, ms: Date.now() - started, error: String(e) }
  }
}

async function login(username, password) {
  const r = await call("/auth/login", { method: "POST", body: { username, password } })
  if (r.status !== 200) throw new Error(`로그인 실패 (${username}): HTTP ${r.status} ${JSON.stringify(r.json?.error ?? r.error)}`)
  return r.json.data.access_token
}

/* ───────────── 실제 데이터(정답지) ───────────── */

async function loadTruth(token) {
  const truth = { vars: {}, lowStock: [], lowStockTotal: null, warehouse: [] }
  const inv = await call("/inventories?page=1&page_size=20", { token })
  const firstInv = inv.json?.data?.[0]
  if (firstInv) {
    truth.vars.item_name = firstInv.item_name
    truth.vars.item_code = firstInv.item_code
    truth.vars.warehouse_id = String(firstInv.warehouse_id)
  }
  const low = await call("/dashboard/low-stock-items?page=1&page_size=10", { token })
  truth.lowStock = low.json?.data ?? []
  truth.lowStockTotal = low.json?.pagination?.total_count ?? truth.lowStock.length
  if (truth.lowStock[0]) truth.vars.low_item_name = truth.lowStock[0].item_name

  if (truth.vars.warehouse_id) {
    const wh = await call(`/inventories?warehouse_id=${truth.vars.warehouse_id}&page=1&page_size=10`, { token })
    truth.warehouse = wh.json?.data ?? []
    const lowWh = await call(`/dashboard/low-stock-items?warehouse_id=${truth.vars.warehouse_id}&page=1&page_size=10`, { token })
    truth.lowStockWh = lowWh.json?.data ?? []
  }
  const exp = await call("/inventories/expiring?page=1&page_size=10", { token })
  const firstExp = exp.json?.data?.[0]
  truth.vars.expiring_item_name = firstExp?.item_name ?? truth.vars.item_name
  return truth
}

function fill(text, vars) {
  return text
    .replace(/\{\{repeat:(.):(\d+)\}\}/g, (_, ch, n) => ch.repeat(Number(n)))
    .replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

/* ───────────── 판정 ───────────── */

const EMPTY_HINTS = ["없습니다", "없어요", "찾을 수 없", "결과가 없", "0건", "조회되지 않"]

function judge(tc, r, truth) {
  const fails = []
  const warns = []
  const e = tc.expect
  const statuses = Array.isArray(e.status) ? e.status : [e.status]
  const data = r.json?.data
  const answer = typeof data?.answer === "string" ? data.answer : ""

  if (!statuses.includes(r.status)) fails.push(`HTTP ${r.status} (기대 ${statuses.join("/")})`)
  if (r.status === 200 && r.json?.success !== true) fails.push("Envelope success != true")

  if (e.error_code && r.status >= 400) {
    const code = r.json?.error?.code
    if (!e.error_code.includes(code)) fails.push(`error.code ${code} (기대 ${e.error_code.join("/")})`)
  }

  if (r.status === 200 && data) {
    if (e.intent && !e.intent.includes(data.intent)) {
      ;(tc.expect.pending_backend ? warns : fails).push(`intent ${data.intent} (기대 ${e.intent.join("/")})`)
    }
    if (!answer.trim()) fails.push("answer 비어 있음")
    for (const k of e.answer_includes ?? []) if (!answer.includes(k)) fails.push(`답변에 “${k}” 없음`)
    for (const k of e.answer_excludes ?? []) if (answer.includes(k)) fails.push(`답변에 금지어 “${k}” 포함`)
    for (const v of e.answer_includes_var ?? []) {
      const val = truth.vars[v]
      if (val && !answer.includes(val)) warns.push(`답변에 실제 값 “${val}”(${v}) 없음`)
    }
    if (e.empty && !EMPTY_HINTS.some((h) => answer.includes(h))) warns.push("결과 없음 안내 문구를 찾지 못함 (환각 여부 직접 확인)")

    // 정답지 대조 — 답변에 실제 상위 항목명이 나오는지
    const expectNames = (rows) => rows.slice(0, 3).map((x) => x.item_name).filter(Boolean)
    const checkNames = (rows, label) => {
      if (rows.length === 0) {
        if (!EMPTY_HINTS.some((h) => answer.includes(h))) warns.push(`${label}: 실제 0건인데 결과 없음 문구 없음`)
        return
      }
      const missing = expectNames(rows).filter((n) => !answer.includes(n))
      if (missing.length) warns.push(`${label}: 실제 상위 항목 누락 ${missing.join(", ")}`)
    }
    if (e.truth === "low_stock") checkNames(truth.lowStock, "부족 재고 대조")
    if (e.truth === "low_stock_wh") checkNames(truth.lowStockWh ?? [], "창고별 부족 재고 대조")
    if (e.truth === "warehouse") checkNames(truth.warehouse, "창고 재고 대조")

  }
  // 응답 스펙(v0.1) 필드 — 판정에는 넣지 않고 보고서 머리말에 한 번 모아 적는다
  const specMissing =
    r.status === 200 && data ? ["sources", "query_context", "generated_at"].filter((f) => !(f in data)) : []
  if (r.ms > 30_000) warns.push(`응답 ${Math.round(r.ms / 1000)}초 (30초 초과)`)

  const verdict = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS"
  return { verdict, fails, warns, answer, specMissing }
}

/* ───────────── 실행 ───────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const user = process.env.AI_TEST_USERNAME
  const pass = process.env.AI_TEST_PASSWORD
  if (!user || !pass) {
    console.error("AI_TEST_USERNAME / AI_TEST_PASSWORD 환경 변수가 필요합니다.")
    process.exit(2)
  }
  console.log(`▶ ${BASE} 에 로그인 (${user})`)
  const token = await login(user, pass)
  let whToken = null
  if (process.env.AI_TEST_WAREHOUSE_USERNAME) {
    whToken = await login(process.env.AI_TEST_WAREHOUSE_USERNAME, process.env.AI_TEST_WAREHOUSE_PASSWORD ?? "")
  }

  const truth = await loadTruth(token)
  console.log("▶ 실제 데이터 변수:", truth.vars)

  const selected = cases.filter((c) => !ONLY.length || ONLY.some((p) => c.id.startsWith(p)))
  const results = []

  for (const tc of selected) {
    const question = fill(tc.question, truth.vars)
    let auth = token
    if (tc.auth === "none") auth = null
    if (tc.auth === "invalid") auth = "invalid.token.value"
    if (tc.auth === "role:WAREHOUSE") {
      if (!whToken) {
        results.push({ ...tc, question, verdict: "SKIP", fails: [], warns: ["WAREHOUSE 계정 미지정"], ms: 0 })
        console.log(`- ${tc.id} SKIP`)
        continue
      }
      auth = whToken
    }

    const r = await call("/ai/chat", { method: "POST", body: { message: question, history: [] }, token: auth })
    const j = judge(tc, r, truth)
    results.push({
      id: tc.id,
      category: tc.category,
      question: question.length > 80 ? `${question.slice(0, 40)}…(${question.length}자)` : question,
      expected_answer: fill(tc.expected_answer, truth.vars),
      status: r.status,
      intent: r.json?.data?.intent ?? r.json?.error?.code ?? null,
      ms: r.ms,
      ...j,
    })
    console.log(`- ${tc.id} ${j.verdict} (HTTP ${r.status}, ${r.ms}ms) ${[...j.fails, ...j.warns].join(" | ")}`)
    await sleep(DELAY)
  }

  const count = (v) => results.filter((r) => r.verdict === v).length
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const dir = join(ROOT, "docs/chatbot/reports")
  mkdirSync(dir, { recursive: true })

  const specMissing = [...new Set(results.flatMap((r) => r.specMissing ?? []))]
  const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")
  const md = [
    `# AI 챗봇 회귀 테스트 결과 (${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})`,
    "",
    `- 대상: \`${BASE}\``,
    `- 결과: PASS ${count("PASS")} · WARN ${count("WARN")} · FAIL ${count("FAIL")} · SKIP ${count("SKIP")} / ${results.length}`,
    `- API Spec v0.1 대비 응답에 없는 필드: ${specMissing.length ? specMissing.join(", ") : "없음"}`,
    `- 실제 데이터 변수: ${Object.entries(truth.vars).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    "",
    "| ID | 유형 | 질문 | 판정 | HTTP | intent/code | 시간 | 비고 |",
    "|---|---|---|---|---|---|---|---|",
    ...results.map(
      (r) =>
        `| ${r.id} | ${r.category} | ${esc(r.question)} | ${r.verdict} | ${r.status ?? ""} | ${r.intent ?? ""} | ${r.ms ? `${(r.ms / 1000).toFixed(1)}s` : ""} | ${esc([...r.fails, ...r.warns].join("; "))} |`,
    ),
    "",
    "## 답변 원문",
    "",
    ...results.flatMap((r) => [`### ${r.id} ${r.question ? esc(r.question) : ""}`, "", `- 기대: ${r.expected_answer ?? ""}`, "", "```", r.answer ?? "", "```", ""]),
  ].join("\n")

  writeFileSync(join(dir, `ai-regression-${stamp}.md`), md)
  writeFileSync(join(dir, `ai-regression-${stamp}.json`), JSON.stringify({ base: BASE, truth: truth.vars, results }, null, 2))
  console.log(`\n✔ 보고서: docs/chatbot/reports/ai-regression-${stamp}.md`)
  console.log(`  PASS ${count("PASS")} · WARN ${count("WARN")} · FAIL ${count("FAIL")} · SKIP ${count("SKIP")}`)
  process.exit(count("FAIL") ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
