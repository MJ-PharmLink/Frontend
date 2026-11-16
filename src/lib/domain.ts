/**
 * 화면에서 공통으로 쓰는 도메인 표기 규칙.
 *
 * 서버가 돌려주는 enum 값(ADMIN, PENDING, LOW_STOCK …)을 그대로 들고 다니고,
 * 사람이 읽는 문구는 여기서만 붙인다. 각 페이지가 제각각 한글을 박아두면
 * 명세가 바뀔 때 고쳐야 할 곳이 흩어지기 때문이다.
 */

import type {
  AdjustmentReason,
  AdjustmentType,
  DeliveryStatus,
  ExpiryStatus,
  ItemStatus,
  OrderStatus,
  PartnerTransactionType,
  PartnerType,
  StockStatus,
  TransactionType,
  UserRole,
} from "../types/api"

export interface Tone {
  bg: string
  color: string
}

/* ────────────────────────────── 역할 ────────────────────────────── */

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "관리자",
  SALES: "영업담당",
  WAREHOUSE: "창고담당",
}

export const ROLE_TONES: Record<UserRole, Tone> = {
  ADMIN: { bg: "#EFF6FF", color: "#1D4ED8" },
  SALES: { bg: "#F0FDF4", color: "#166534" },
  WAREHOUSE: { bg: "#FFF7ED", color: "#9A3412" },
}

/* ────────────────────────────── 거래처 ────────────────────────────── */

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  CUSTOMER: "고객사",
  SUPPLIER: "공급처",
}

export const PARTNER_TYPE_TONES: Record<PartnerType, Tone> = {
  CUSTOMER: { bg: "#EFF6FF", color: "#1D4ED8" },
  SUPPLIER: { bg: "#F0FDF4", color: "#166534" },
}

export const PARTNER_TRANSACTION_LABELS: Record<PartnerTransactionType, string> = {
  ORDER: "주문",
  SALE: "매출",
  PURCHASE: "매입",
}

/* ────────────────────────────── 주문 · 납품 ────────────────────────────── */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "승인 대기",
  APPROVED: "승인 완료",
  CANCELLED: "취소",
}

export const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  PENDING: { bg: "#FFF7ED", color: "#C2410C" },
  APPROVED: { bg: "#DCFCE7", color: "#166534" },
  CANCELLED: { bg: "#F3F4F6", color: "#6B7280" },
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  WAITING: "출고 대기",
  SHIPPED: "출고 완료",
  DELIVERED: "납품 완료",
}

export const DELIVERY_STATUS_TONES: Record<DeliveryStatus, Tone> = {
  WAITING: { bg: "#FFF7ED", color: "#C2410C" },
  SHIPPED: { bg: "#EFF6FF", color: "#1D4ED8" },
  DELIVERED: { bg: "#DCFCE7", color: "#166534" },
}

/* ────────────────────────────── 재고 ────────────────────────────── */

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  NORMAL: "정상",
  LOW_STOCK: "부족",
  OUT_OF_STOCK: "품절",
}

export const STOCK_STATUS_TONES: Record<StockStatus, Tone> = {
  NORMAL: { bg: "#DCFCE7", color: "#166534" },
  LOW_STOCK: { bg: "#FEF3C7", color: "#B45309" },
  OUT_OF_STOCK: { bg: "#FEE2E2", color: "#B91C1C" },
}

export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  NORMAL: "정상",
  EXPIRING_SOON: "임박",
  EXPIRED: "만료",
}

export const EXPIRY_STATUS_TONES: Record<ExpiryStatus, Tone> = {
  NORMAL: { bg: "#DCFCE7", color: "#166534" },
  EXPIRING_SOON: { bg: "#FEF3C7", color: "#B45309" },
  EXPIRED: { bg: "#FEE2E2", color: "#B91C1C" },
}

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  ACTIVE: "판매중",
  DISCONTINUED: "단종",
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  IN: "입고",
  OUT: "출고",
  ADJUST_IN: "조정 증가",
  ADJUST_OUT: "조정 감소",
}

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  INCREASE: "증가",
  DECREASE: "감소",
}

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  DAMAGED: "파손",
  EXPIRED_DISPOSAL: "만료 폐기",
  COUNT_CORRECTION: "실사 보정",
  RETURN: "반품 입고",
  OTHER: "기타",
}

/* ────────────────────────────── 상품 코드 ────────────────────────────── */

/**
 * 상품 코드는 IT-MED-{CC}-NNNN 형식이고 CC는 등록 시점 카테고리의 2자리 코드다.
 * 초기 데이터 5종만 고정 매핑이고, 관리자가 추가한 카테고리는 OT를 쓴다
 * (DB 설계서 7. 채번 규칙).
 */
export const CATEGORY_CODES: Record<string, string> = {
  "감염성질환 및 호흡기계": "RI",
  "소화기계 및 순환기계": "GC",
  "신경계 및 정신/행동장애": "NP",
  "호르몬 및 대사성 의약품": "EM",
  기타: "OT",
}

export const ITEM_CODE_FALLBACK = "OT"

/** 카테고리 배지 색. 초기 데이터 5종 외에는 기타 색을 쓴다 */
export const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "감염성질환 및 호흡기계": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  "소화기계 및 순환기계": { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
  "신경계 및 정신/행동장애": { bg: "#FDF4FF", color: "#7C3AED", border: "#E9D5FF" },
  "호르몬 및 대사성 의약품": { bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA" },
  기타: { bg: "#F9FAFB", color: "#374151", border: "#E5E7EB" },
}

export function categoryTone(categoryName: string) {
  return CATEGORY_COLORS[categoryName] ?? CATEGORY_COLORS["기타"]
}

export function categoryCode(categoryName: string): string {
  return CATEGORY_CODES[categoryName] ?? ITEM_CODE_FALLBACK
}

/** 실제 채번은 서버가 한다. 등록 화면에서 미리 보여줄 접두어를 만들 때만 쓴다 */
export function itemCodePrefix(categoryName: string): string {
  return `IT-MED-${categoryCode(categoryName)}-`
}

/** 상품 단위 — 명세 6.3 예시(정, 캡슐, 포, 병, 개 등). 자유 입력이므로 제안값이다 */
export const ITEM_UNITS = ["정", "캡슐", "포", "병", "개", "박스", "앰플", "바이알", "튜브"] as const

/* ────────────────────────────── 표시 형식 ────────────────────────────── */

/** 금액은 원(KRW) 단위 정수 */
export function formatMoney(amount: number): string {
  return `₩ ${amount.toLocaleString("ko-KR")}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR")
}

/** 마진율은 소수점 2자리 */
export function formatRate(rate: number): string {
  return `${rate.toFixed(2)}%`
}

/** 서버는 UTC ISO 8601로 주고, 화면 표시용 KST 변환은 클라이언트 담당(1.5) */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  // yyyy-MM-dd 는 이미 KST 업무 날짜이므로 시간대 변환 없이 그대로 쓴다
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, ".")
  return new Date(value).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
}

/** 오늘 날짜(KST, yyyy-MM-dd) — 기간 필터 기본값 등에 쓴다 */
export function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
}

/** 이번 달 1일(KST, yyyy-MM-dd) */
export function firstDayOfMonthKst(): string {
  return `${todayKst().slice(0, 7)}-01`
}
