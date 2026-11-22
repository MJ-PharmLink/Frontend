/**
 * AI 챗봇 화면 로직 — 오류 문구, 대화 맥락(history), 조회 유형 표시값.
 * 화면 컴포넌트와 분리해 두어 회귀 테스트 스크립트와 같은 규칙을 공유한다.
 */

import { ApiError, AiTimeoutError } from "../api"
import type {
  AiCapabilities,
  AiChatHistoryItem,
  AiChatResponse,
  AiIntent,
  AiQueryContext,
} from "../types/api"

/** 서버 @Size(max = 1000) 와 같은 값 */
export const AI_MESSAGE_MAX_LENGTH = 1000
/** 서버로 보내는 직전 대화 수 (API Spec v0.1: history ≤ 10) */
export const AI_HISTORY_LIMIT = 10

/* ────────────────────────────── 대화 상태 ────────────────────────────── */

export type ChatStatus = "pending" | "done" | "error" | "canceled"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  /** user: 질문, assistant: 답변 본문 */
  content: string
  status: ChatStatus
  response?: AiChatResponse
  error?: ChatErrorView
  /** 클라이언트가 받은 시각. generated_at이 없을 때 표시용 */
  received_at?: string
  /** 오류 메시지에서 다시 보낼 원래 질문 */
  question?: string
}

let seq = 0
export function newMessageId(): string {
  seq += 1
  return `m${Date.now().toString(36)}${seq}`
}

/**
 * 서버로 보낼 history. 정상 완료된 질문·답변만 골라 최근 10개를 보낸다.
 * 오류·취소된 턴은 모델이 엉뚱한 맥락을 잇지 않도록 뺀다.
 */
export function buildHistory(messages: ChatMessage[], limit = AI_HISTORY_LIMIT): AiChatHistoryItem[] {
  const turns: AiChatHistoryItem[] = []
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (m.role !== "user") continue
    const reply = messages[i + 1]
    if (!reply || reply.role !== "assistant" || reply.status !== "done") continue
    turns.push({ role: "user", content: m.content })
    turns.push({ role: "assistant", content: reply.content })
  }
  return turns.slice(-limit)
}

/* ────────────────────────────── 오류 문구 ────────────────────────────── */

export type ChatErrorKind =
  | "timeout"
  | "canceled"
  | "network"
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "ai_unavailable"
  | "rate_limited"
  | "query_failed"
  | "unknown"

export interface ChatErrorView {
  kind: ChatErrorKind
  title: string
  message: string
  /** 같은 질문으로 다시 시도할 만한가 */
  retryable: boolean
  /** 디버깅·QA 기록용 (HTTP 상태와 서버 code) */
  code?: string
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  )
}

/**
 * 오류를 사용자 문구로 바꾼다. 기준은 백엔드 ErrorCode
 * (feat/ai-chatbot-backend f4b6b9f) 이며, 서버에 아직 없는 경우(429 등)는 가정이다.
 */
export function toChatError(err: unknown): ChatErrorView {
  if (err instanceof AiTimeoutError) {
    return {
      kind: "timeout",
      title: "응답 시간이 초과되었어요",
      message: "질문을 조금 더 구체적으로(상품명, 창고 번호 등) 바꿔서 다시 시도해 주세요.",
      retryable: true,
      code: "CLIENT_TIMEOUT",
    }
  }
  if (isAbortError(err)) {
    return {
      kind: "canceled",
      title: "질문을 취소했어요",
      message: "필요하면 같은 질문을 다시 보낼 수 있어요.",
      retryable: true,
      code: "CLIENT_CANCELED",
    }
  }
  if (!(err instanceof ApiError)) {
    return {
      kind: "unknown",
      title: "알 수 없는 오류가 발생했어요",
      message: "잠시 후 다시 시도해 주세요. 계속되면 담당자에게 알려 주세요.",
      retryable: true,
    }
  }

  const code = `${err.status} ${err.code}`

  if (err.status === 0) {
    return {
      kind: "network",
      title: "서버에 연결할 수 없어요",
      message: "네트워크 상태나 서버 실행 여부를 확인한 뒤 다시 시도해 주세요.",
      retryable: true,
      code: "NETWORK",
    }
  }
  if (err.status === 401) {
    return {
      kind: "unauthorized",
      title: "로그인이 필요해요",
      message: "로그인 시간이 만료되었어요. 다시 로그인한 뒤 질문해 주세요.",
      retryable: false,
      code,
    }
  }
  if (err.status === 403) {
    return {
      kind: "forbidden",
      title: err.code === "ACCOUNT_DISABLED" ? "비활성화된 계정이에요" : "조회 권한이 없어요",
      message:
        err.code === "ACCOUNT_DISABLED"
          ? "관리자에게 계정 상태를 확인해 달라고 요청해 주세요."
          : "이 정보는 현재 역할로 조회할 수 없어요. 필요하면 관리자에게 권한을 요청해 주세요.",
      retryable: false,
      code,
    }
  }
  if (err.status === 400 || err.status === 422) {
    const fieldIssue = err.details.find((d) => d.field === "message")
    return {
      kind: "validation",
      title: "질문을 확인해 주세요",
      message:
        fieldIssue?.issue === "size"
          ? `질문은 ${AI_MESSAGE_MAX_LENGTH}자 이내로 입력해 주세요.`
          : fieldIssue?.issue === "not_blank"
            ? "질문을 입력해 주세요."
            : err.message,
      retryable: false,
      code,
    }
  }
  if (err.status === 429) {
    return {
      kind: "rate_limited",
      title: "요청이 너무 많아요",
      message: "잠시 기다렸다가 다시 질문해 주세요.",
      retryable: true,
      code,
    }
  }
  if (err.code === "AI_SERVICE_UNAVAILABLE" || err.status === 503) {
    return {
      kind: "ai_unavailable",
      title: "AI 서비스가 잠시 응답하지 않아요",
      message: "잠시 후 다시 시도해 주세요. 재고 수치는 재고 관리 화면에서 바로 확인할 수 있어요.",
      retryable: true,
      code,
    }
  }
  if (err.code === "INVENTORY_QUERY_FAILED" || err.status >= 500) {
    return {
      kind: "query_failed",
      title: "데이터를 조회하지 못했어요",
      message: "서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      retryable: true,
      code,
    }
  }
  return {
    kind: "unknown",
    title: "요청을 처리하지 못했어요",
    message: err.message,
    retryable: true,
    code,
  }
}

/* ────────────────────────────── 조회 유형 ────────────────────────────── */

export interface IntentView {
  label: string
  color: string
  bg: string
  /** 근거 데이터를 더 볼 수 있는 화면 */
  route?: "inventory" | "dashboard"
}

const INTENT_VIEWS: Record<string, IntentView> = {
  GENERAL: { label: "일반 안내", color: "#475569", bg: "#F1F5F9" },
  LOW_STOCK: { label: "부족 재고", color: "#B45309", bg: "#FEF3C7", route: "dashboard" },
  INVENTORY: { label: "재고 조회", color: "#1D4ED8", bg: "#DBEAFE", route: "inventory" },
  EXPIRY: { label: "유통기한", color: "#B91C1C", bg: "#FEE2E2", route: "inventory" },
  EXPIRING: { label: "유통기한", color: "#B91C1C", bg: "#FEE2E2", route: "inventory" },
  EXPIRING_SOON: { label: "유통기한 임박", color: "#B91C1C", bg: "#FEE2E2", route: "inventory" },
  EXPIRED: { label: "유통기한 만료", color: "#B91C1C", bg: "#FEE2E2", route: "inventory" },
}

export function intentView(intent: AiIntent | undefined): IntentView {
  if (intent && INTENT_VIEWS[intent]) return INTENT_VIEWS[intent]
  return { label: intent ? intent : "답변", color: "#475569", bg: "#F1F5F9" }
}

/** 데이터 조회형 답변인데 결과가 0건이거나 본문이 비었는지 */
export function isEmptyResult(res: AiChatResponse): boolean {
  if (!res.answer || !res.answer.trim()) return true
  const total = res.query_context?.total_count
  return typeof total === "number" && total === 0
}

/** query_context를 칩 형태로 보여 줄 문구 목록 */
export function queryContextChips(ctx: AiQueryContext | null | undefined): string[] {
  if (!ctx) return []
  const chips: string[] = []
  if (ctx.keyword) chips.push(`검색어 “${ctx.keyword}”`)
  if (typeof ctx.warehouse_id === "number") chips.push(`창고 #${ctx.warehouse_id}`)
  else if (ctx.function_name) chips.push("전체 창고")
  if (typeof ctx.days === "number") chips.push(`${ctx.days}일 이내`)
  if (typeof ctx.total_count === "number") chips.push(`결과 ${ctx.total_count.toLocaleString("ko-KR")}건`)
  if (typeof ctx.page === "number") {
    chips.push(
      typeof ctx.total_pages === "number" && ctx.total_pages > 0
        ? `${ctx.page} / ${ctx.total_pages} 페이지`
        : `${ctx.page} 페이지`,
    )
  }
  return chips
}

/** 근거 표의 열 이름. 서버 snake_case 키를 그대로 받아 한글로만 바꾼다 */
export const SOURCE_COLUMN_LABELS: Record<string, string> = {
  item_code: "상품코드",
  item_name: "상품명",
  warehouse_id: "창고",
  warehouse_name: "창고",
  quantity: "현재 재고",
  available_quantity: "가용 재고",
  safety_stock: "안전재고",
  shortage_quantity: "부족 수량",
  stock_status: "상태",
  lot_number: "LOT",
  expiry_date: "유통기한",
  days_until_expiry: "남은 일수",
  expiry_status: "유통기한 상태",
}

/** 표에서 숨길 내부 식별자 */
export const HIDDEN_SOURCE_COLUMNS = new Set(["inventory_id", "item_id", "lot_id", "category_id"])

/* ────────────────────────────── 추천 질문 ────────────────────────────── */

/** /ai/capabilities 가 아직 없을 때 쓰는 기본값. 현재 서버 기능 기준 */
export const DEFAULT_CAPABILITIES: AiCapabilities = {
  read_only: true,
  capabilities: [
    {
      intent: "LOW_STOCK",
      label: "부족 재고",
      description: "안전재고보다 적은 상품을 찾아요",
      examples: ["지금 재고가 부족한 상품 알려줘", "1번 창고에서 부족한 재고만 보여줘"],
    },
    {
      intent: "INVENTORY",
      label: "상품 재고 검색",
      description: "상품명이나 상품코드로 재고를 찾아요",
      examples: ["타이레놀 재고 얼마나 있어?", "2번 창고 재고 목록 보여줘"],
    },
    {
      intent: "GENERAL",
      label: "사용 방법",
      description: "ERP 기능 사용법을 안내해요",
      examples: ["재고 조정은 어떻게 해?"],
    },
  ],
}

/** 유통기한 조회가 서버에 추가되면 capabilities 응답으로 자연스럽게 노출된다 */
export function suggestionList(caps: AiCapabilities, max = 5): string[] {
  const out: string[] = []
  for (const c of caps.capabilities) {
    for (const ex of c.examples ?? []) {
      if (!out.includes(ex)) out.push(ex)
    }
  }
  return out.slice(0, max)
}
