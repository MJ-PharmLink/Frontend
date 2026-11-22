import { useState } from "react"
import {
  EXPIRY_STATUS_LABELS,
  EXPIRY_STATUS_TONES,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_TONES,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../../lib/domain"
import {
  HIDDEN_SOURCE_COLUMNS,
  SOURCE_COLUMN_LABELS,
  intentView,
  isEmptyResult,
  queryContextChips,
} from "../../lib/chatbot"
import type { ChatMessage } from "../../lib/chatbot"
import type { AiSource, ExpiryStatus, StockStatus } from "../../types/api"
import MarkdownLite from "./MarkdownLite"

interface Props {
  message: ChatMessage
  onNavigate?: (route: "inventory" | "dashboard") => void
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ color, background: bg }}>
      {text}
    </span>
  )
}

function renderCell(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (key === "stock_status" && typeof value === "string" && value in STOCK_STATUS_LABELS) {
    const s = value as StockStatus
    return <Badge text={STOCK_STATUS_LABELS[s]} {...STOCK_STATUS_TONES[s]} />
  }
  if (key === "expiry_status" && typeof value === "string" && value in EXPIRY_STATUS_LABELS) {
    const s = value as ExpiryStatus
    return <Badge text={EXPIRY_STATUS_LABELS[s]} {...EXPIRY_STATUS_TONES[s]} />
  }
  if (key === "expiry_date" && typeof value === "string") return formatDate(value)
  if (key === "days_until_expiry" && typeof value === "number") {
    return value < 0 ? `${Math.abs(value)}일 지남` : `D-${value}`
  }
  if (key === "warehouse_id" && typeof value === "number") return `#${value}`
  if (typeof value === "number") return formatNumber(value)
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function SourceTable({ source }: { source: AiSource }) {
  const rows = source.rows ?? []
  if (rows.length === 0) return null
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((k) => !HIDDEN_SOURCE_COLUMNS.has(k))
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left font-medium">
                {SOURCE_COLUMN_LABELS[c] ?? c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {columns.map((c) => (
                <td
                  key={c}
                  className="whitespace-nowrap px-2 py-1.5 tabular-nums"
                  style={c === "shortage_quantity" ? { color: "#B91C1C", fontWeight: 600 } : undefined}
                >
                  {renderCell(c, r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 답변 카드 — 조회 유형, 본문, 조회 조건, 근거 데이터, 생성 시각 */
export default function ChatAnswerCard({ message, onNavigate }: Props) {
  const [showSources, setShowSources] = useState(false)
  const [copied, setCopied] = useState(false)
  const res = message.response
  if (!res) return null

  const view = intentView(res.intent)
  const chips = queryContextChips(res.query_context)
  const sources = (res.sources ?? []).filter((s) => (s.rows?.length ?? 0) > 0 || s.title)
  const sourceRowCount = sources.reduce((n, s) => n + (s.rows?.length ?? 0), 0)
  const empty = isEmptyResult(res)
  const at = res.generated_at ?? message.received_at

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(res.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 권한이 없으면 조용히 넘어간다 */
    }
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white shadow-sm" data-testid="ai-answer-card" data-intent={res.intent}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge text={view.label} color={view.color} bg={view.bg} />
          {empty && <Badge text="결과 없음" color="#64748B" bg="#F1F5F9" />}
        </div>
        <span className="text-[11px] text-slate-400" title={res.generated_at ? "서버 생성 시각" : "응답 수신 시각"}>
          {formatDateTime(at)}
        </span>
      </div>

      <div className="px-3 py-2.5">
        {res.answer?.trim() ? (
          <MarkdownLite text={res.answer} />
        ) : (
          <p className="text-[13.5px] text-slate-500">조건에 맞는 결과를 찾지 못했어요. 상품명이나 창고 번호를 바꿔서 다시 질문해 보세요.</p>
        )}

        {chips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1" aria-label="조회 조건">
            {chips.map((c) => (
              <span key={c} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                {c}
              </span>
            ))}
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowSources((v) => !v)}
              className="text-[12px] font-medium text-[#1677FF] hover:underline"
              aria-expanded={showSources}
            >
              {showSources ? "근거 데이터 접기" : `근거 데이터 보기${sourceRowCount ? ` (${sourceRowCount}건)` : ""}`}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {sources.map((s, i) => (
                  <div key={i} className="space-y-1">
                    {s.title && <p className="text-[11.5px] font-medium text-slate-500">{s.title}</p>}
                    <SourceTable source={s} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-1.5">
        <span className="truncate text-[11px] text-slate-400">조회 전용 · 실제 ERP 데이터 기준</span>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          {view.route && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(view.route!)}
              className="text-[11.5px] font-medium text-slate-500 hover:text-[#0B3D91]"
            >
              {view.route === "dashboard" ? "대시보드에서 보기" : "재고 관리에서 보기"}
            </button>
          )}
          <button type="button" onClick={copy} className="text-[11.5px] font-medium text-slate-500 hover:text-[#0B3D91]">
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
      </div>
    </div>
  )
}
