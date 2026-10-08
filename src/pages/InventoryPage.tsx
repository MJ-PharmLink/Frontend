import { useState } from "react"
import {
  CATEGORIES,
  EXPIRING_LOTS,
  EXPIRING_SOON_DAYS,
  INVENTORY_DETAILS,
  ITEMS,
  TRANSACTIONS,
  WAREHOUSES,
  daysUntil,
} from "../data/sample"
import {
  ADJUSTMENT_REASON_LABELS,
  ADJUSTMENT_TYPE_LABELS,
  EXPIRY_STATUS_LABELS,
  EXPIRY_STATUS_TONES,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_TONES,
  TRANSACTION_TYPE_LABELS,
  categoryTone,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../lib/domain"
import { ADJUSTMENT_REASONS, ADJUSTMENT_TYPES, EXPIRY_STATUSES, STOCK_STATUSES } from "../types/api"
import type {
  AdjustmentReason,
  AdjustmentType,
  ExpiryStatus,
  InventoryDetail,
  StockStatus,
} from "../types/api"

/**
 * 7. 재고 관리.
 *
 * 입고는 매입 등록(10.2), 출고는 주문 승인(8.4)에서 내부적으로 처리된다.
 * 공개된 입고/출고 엔드포인트는 없고, 그 외 수량 변동은 재고 조정(7.4)으로만
 * 가능하다. 그래서 이 화면의 쓰기 동작은 재고 조정 하나뿐이다.
 */

/** 재고 응답(7.1)에는 category_id가 없어 상품 목록에서 미리 뽑아둔다 */
const ITEM_CATEGORY = new Map<number, number>(ITEMS.map((i) => [i.item_id, i.category_id]))

type TabKey = "stock" | "expiry" | "history"

const TABS: { key: TabKey; label: string }[] = [
  { key: "stock", label: "재고 현황" },
  { key: "expiry", label: "유통기한 임박·만료" },
  { key: "history", label: "재고 이력" },
]

const EMPTY_ADJUSTMENT = {
  warehouse_id: WAREHOUSES[0].warehouse_id,
  item_id: INVENTORY_DETAILS[0]?.item_id ?? 0,
  lot_id: INVENTORY_DETAILS[0]?.lots[0]?.lot_id ?? 0,
  lot_number: "",
  expiry_date: "",
  adjustment_type: "DECREASE" as AdjustmentType,
  quantity: 1,
  reason: "COUNT_CORRECTION" as AdjustmentReason,
  memo: "",
}

export default function InventoryPage() {
  const [inventories, setInventories] = useState<InventoryDetail[]>(INVENTORY_DETAILS)
  const [tab, setTab] = useState<TabKey>("stock")
  const [keyword, setKeyword] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<number | "전체">("전체")
  const [stockFilter, setStockFilter] = useState<StockStatus | "전체">("전체")
  const [expiryFilter, setExpiryFilter] = useState<ExpiryStatus | "전체">("전체")
  const [detail, setDetail] = useState<InventoryDetail | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [form, setForm] = useState(EMPTY_ADJUSTMENT)
  const [historyType, setHistoryType] = useState<"전체" | "IN" | "OUT" | "ADJUST">("전체")

  // 7.1 필터 — keyword(상품명·코드), 카테고리, 재고 상태, 유통기한 상태
  const filtered = inventories.filter((inv) => {
    const matchKeyword =
      keyword === "" || inv.item_name.includes(keyword) || inv.item_code.includes(keyword)
    const matchCategory = categoryFilter === "전체" || ITEM_CATEGORY.get(inv.item_id) === categoryFilter
    const matchStock = stockFilter === "전체" || inv.stock_status === stockFilter
    const matchExpiry = expiryFilter === "전체" || inv.expiry_status === expiryFilter
    return matchKeyword && matchCategory && matchStock && matchExpiry
  })

  const lowStock = inventories.filter(
    (inv) => inv.item_status === "ACTIVE" && inv.safety_stock > 0 && inv.quantity <= inv.safety_stock,
  )

  const summary = {
    total_item_count: inventories.length,
    total_quantity: inventories.reduce((sum, i) => sum + i.quantity, 0),
    low_stock: inventories.filter((i) => i.stock_status === "LOW_STOCK").length,
    out_of_stock: inventories.filter((i) => i.stock_status === "OUT_OF_STOCK").length,
    expiring_soon: inventories.filter((i) => i.expiry_status === "EXPIRING_SOON").length,
    expired: inventories.filter((i) => i.expiry_status === "EXPIRED").length,
  }

  const transactions = TRANSACTIONS.filter((t) => {
    if (historyType === "전체") return true
    if (historyType === "ADJUST") return t.type === "ADJUST_IN" || t.type === "ADJUST_OUT"
    return t.type === historyType
  })

  const selectedInventory = inventories.find((i) => i.item_id === form.item_id)

  const openAdjust = (inv?: InventoryDetail) => {
    const target = inv ?? inventories[0]
    setForm({
      ...EMPTY_ADJUSTMENT,
      item_id: target.item_id,
      lot_id: target.lots[0]?.lot_id ?? 0,
    })
    setShowAdjust(true)
  }

  /** 7.4 재고 조정 — INCREASE/DECREASE 모두 로트 단위로 수량을 바꾼다 */
  const applyAdjustment = () => {
    setInventories((prev) =>
      prev.map((inv) => {
        if (inv.item_id !== form.item_id) return inv
        const delta = form.adjustment_type === "INCREASE" ? form.quantity : -form.quantity
        const lots = inv.lots.map((lot) =>
          lot.lot_id === form.lot_id ? { ...lot, quantity: Math.max(0, lot.quantity + delta) } : lot,
        )
        const quantity = lots.reduce((sum, l) => sum + l.quantity, 0)
        const available = lots
          .filter((l) => l.expiry_status !== "EXPIRED")
          .reduce((sum, l) => sum + l.quantity, 0)
        const stock_status: StockStatus =
          quantity === 0 ? "OUT_OF_STOCK" : quantity <= inv.safety_stock ? "LOW_STOCK" : "NORMAL"
        return { ...inv, lots, quantity, available_quantity: available, stock_status }
      }),
    )
    setShowAdjust(false)
  }

  const chipStyle = (active: boolean) => ({
    background: active ? "#0B3D91" : "#F0F2F5",
    color: active ? "white" : "#666",
  })

  return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>재고 관리</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              {WAREHOUSES[0].name} · {summary.total_item_count}개 품목 · 총 {formatNumber(summary.total_quantity)}
            </p>
          </div>
          <button
              onClick={() => openAdjust()}
              className="px-4 py-2 text-sm font-medium"
              style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
          >
            재고 조정
          </button>
        </div>

        {/* 6.9 창고 재고 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "전체 품목", value: summary.total_item_count, color: "#0B3D91" },
            { label: "재고 부족", value: summary.low_stock, color: "#B45309" },
            { label: "품절", value: summary.out_of_stock, color: "#B91C1C" },
            { label: "유통기한 임박", value: summary.expiring_soon, color: "#B45309" },
            { label: "유통기한 만료", value: summary.expired, color: "#B91C1C" },
          ].map((s) => (
              <div key={s.label} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
              </div>
          ))}
        </div>

        {/* 안전재고 미달 경고 */}
        {lowStock.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "#DC2626" }}>안전재고 미달 {lowStock.length}건:</p>
              <div className="flex flex-wrap gap-2">
                {lowStock.map((inv) => (
                    <span key={inv.inventory_id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      {inv.item_name} ({inv.quantity}/{inv.safety_stock})
                    </span>
                ))}
              </div>
            </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#F0F2F5" }}>
          {TABS.map((t) => (
              <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                  style={{
                    background: tab === t.key ? "white" : "transparent",
                    color: tab === t.key ? "#0B3D91" : "#888",
                    boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
              >
                {t.label}
              </button>
          ))}
        </div>

        {/* ── 재고 현황 (7.1) ── */}
        {tab === "stock" && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="상품명, 상품코드 검색..."
                    className="px-3 py-1.5 text-sm outline-none"
                    style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white", minWidth: 220 }}
                />
                <button onClick={() => setCategoryFilter("전체")} className="px-3 py-1 text-xs font-medium rounded-full transition-all" style={chipStyle(categoryFilter === "전체")}>
                  전체 ({inventories.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = inventories.filter((i) => ITEM_CATEGORY.get(i.item_id) === cat.category_id).length
                  if (count === 0) return null
                  return (
                      <button
                          key={cat.category_id}
                          onClick={() => setCategoryFilter(cat.category_id)}
                          className="px-3 py-1 text-xs font-medium rounded-full transition-all"
                          style={chipStyle(categoryFilter === cat.category_id)}
                      >
                        {cat.category_name} ({count})
                      </button>
                  )
                })}

                <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as StockStatus | "전체")}
                    className="ml-auto px-3 py-1.5 text-xs outline-none cursor-pointer"
                    style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }}
                >
                  <option value="전체">재고 상태 전체</option>
                  {STOCK_STATUSES.map((s) => (
                      <option key={s} value={s}>{STOCK_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <select
                    value={expiryFilter}
                    onChange={(e) => setExpiryFilter(e.target.value as ExpiryStatus | "전체")}
                    className="px-3 py-1.5 text-xs outline-none cursor-pointer"
                    style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }}
                >
                  <option value="전체">유통기한 전체</option>
                  {EXPIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>{EXPIRY_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                    <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                      {["상품코드", "상품명", "카테고리", "전체 수량", "가용 수량", "안전재고", "재고 상태", "로트", "최단 유통기한", "유통기한", ""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((inv, i) => {
                      const catName = CATEGORIES.find((c) => c.category_id === ITEM_CATEGORY.get(inv.item_id))?.category_name ?? "기타"
                      const catStyle = categoryTone(catName)
                      const stockTone = STOCK_STATUS_TONES[inv.stock_status]
                      const expiryTone = EXPIRY_STATUS_TONES[inv.expiry_status]
                      const nearest = inv.lots.find((l) => l.quantity > 0 && l.expiry_status !== "EXPIRED")
                      return (
                          <tr
                              key={inv.inventory_id}
                              style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none", opacity: inv.item_status === "ACTIVE" ? 1 : 0.55 }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                          >
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: "#666" }}>{inv.item_code}</td>
                            <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a" }}>{inv.item_name}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: catStyle.bg, color: catStyle.color }}>
                                {catName}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{formatNumber(inv.quantity)}</td>
                            <td className="px-4 py-3" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatNumber(inv.available_quantity)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatNumber(inv.safety_stock)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={stockTone}>
                                {STOCK_STATUS_LABELS[inv.stock_status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#999" }}>{inv.lots.filter((l) => l.quantity > 0).length}개</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{nearest ? formatDate(nearest.expiry_date) : "-"}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={expiryTone}>
                                {EXPIRY_STATUS_LABELS[inv.expiry_status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => setDetail(inv)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>로트 보기</button>
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                    <div className="py-14 text-center text-sm" style={{ color: "#999" }}>조건에 맞는 재고가 없습니다.</div>
                )}
              </div>
            </>
        )}

        {/* ── 유통기한 임박/만료 (7.3) ── */}
        {tab === "expiry" && (
            <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
              <div className="px-5 py-4 text-xs" style={{ color: "#888", borderBottom: "1px solid #E5EAF0" }}>
                오늘부터 {EXPIRING_SOON_DAYS}일 이내 만료되거나 이미 만료된, 수량이 1 이상인 로트입니다. 폐기는 재고 조정의 만료 폐기로 처리합니다.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                    {["상품코드", "상품명", "로트번호", "유통기한", "남은 일수", "수량", "상태"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody>
                  {EXPIRING_LOTS.map((lot, i) => {
                    const tone = EXPIRY_STATUS_TONES[lot.expiry_status]
                    return (
                        <tr key={lot.lot_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "#666" }}>{lot.item_code}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a" }}>{lot.item_name}</td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "#555" }}>{lot.lot_number}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatDate(lot.expiry_date)}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: lot.days_until_expiry < 0 ? "#B91C1C" : "#B45309", fontFamily: "'Inter', sans-serif" }}>
                            {lot.days_until_expiry < 0 ? `${Math.abs(lot.days_until_expiry)}일 경과` : `${lot.days_until_expiry}일`}
                          </td>
                          <td className="px-4 py-3" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatNumber(lot.quantity)}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={tone}>
                              {EXPIRY_STATUS_LABELS[lot.expiry_status]}
                            </span>
                          </td>
                        </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>
              {EXPIRING_LOTS.length === 0 && (
                  <div className="py-14 text-center text-sm" style={{ color: "#999" }}>임박하거나 만료된 로트가 없습니다.</div>
              )}
            </div>
        )}

        {/* ── 재고 이력 (7.5) ── */}
        {tab === "history" && (
            <>
              <div className="flex gap-2">
                {([["전체", "전체"], ["IN", "입고"], ["OUT", "출고"], ["ADJUST", "조정"]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setHistoryType(key)}
                        className="px-3 py-1 text-xs font-medium rounded-full transition-all"
                        style={chipStyle(historyType === key)}
                    >
                      {label}
                    </button>
                ))}
              </div>
              <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                    <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                      {["일시", "유형", "참조", "상품", "로트번호", "수량", "반영 후", "사유", "비고"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {transactions.map((t, i) => {
                      const isIn = t.type === "IN" || t.type === "ADJUST_IN"
                      return (
                          <tr key={t.transaction_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                            <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDateTime(t.created_at)}</td>
                            <td className="px-4 py-3">
                              <span
                                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={isIn ? { background: "#DCFCE7", color: "#166534" } : { background: "#FEE2E2", color: "#B91C1C" }}
                              >
                                {TRANSACTION_TYPE_LABELS[t.type]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#777" }}>
                              {t.reference_type === "ADJUSTMENT" ? "조정" : `${t.reference_type} #${t.reference_id}`}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{t.item_name}</p>
                              <p className="font-mono text-xs" style={{ color: "#aaa" }}>{t.item_code}</p>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: "#666" }}>{t.lot_number}</td>
                            <td className="px-4 py-3 font-medium" style={{ color: isIn ? "#166534" : "#B91C1C", fontFamily: "'Inter', sans-serif" }}>
                              {isIn ? "+" : "−"}{formatNumber(t.quantity)}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>{formatNumber(t.quantity_after)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#777" }}>{t.reason ? ADJUSTMENT_REASON_LABELS[t.reason] : "-"}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#999" }}>{t.memo ?? "-"}</td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}

        {/* 7.2 재고 상세 — 로트는 FEFO 순 */}
        {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetail(null)}>
              <div className="bg-white w-full max-w-2xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setDetail(null)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>{detail.item_name}</h3>
                <p className="font-mono text-xs mt-1 mb-5" style={{ color: "#999" }}>{detail.item_code} · {detail.warehouse_name}</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "전체 수량", value: formatNumber(detail.quantity) },
                    { label: "가용 수량", value: formatNumber(detail.available_quantity) },
                    { label: "안전재고", value: formatNumber(detail.safety_stock) },
                  ].map((s) => (
                      <div key={s.label} className="px-4 py-3" style={{ background: "#F7F9FC", borderRadius: 8 }}>
                        <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
                      </div>
                  ))}
                </div>

                <p className="text-sm font-medium mb-3" style={{ color: "#444" }}>로트 (유통기한 빠른 순)</p>
                <table className="w-full text-sm">
                  <thead>
                  <tr style={{ background: "#F7F9FC" }}>
                    {["로트번호", "유통기한", "남은 일수", "수량", "상태", "입고일"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#888", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody>
                  {detail.lots.filter((l) => l.quantity > 0).map((lot, i) => (
                      <tr key={lot.lot_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-3 py-2 font-mono text-xs" style={{ color: "#555" }}>{lot.lot_number}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatDate(lot.expiry_date)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: daysUntil(lot.expiry_date) < 0 ? "#B91C1C" : "#777" }}>
                          {daysUntil(lot.expiry_date)}일
                        </td>
                        <td className="px-3 py-2 text-xs font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatNumber(lot.quantity)}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={EXPIRY_STATUS_TONES[lot.expiry_status]}>
                            {EXPIRY_STATUS_LABELS[lot.expiry_status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#999" }}>{formatDate(lot.received_at)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                <div className="flex justify-end gap-3 mt-7">
                  <button onClick={() => setDetail(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                  <button
                      onClick={() => { openAdjust(detail); setDetail(null) }}
                      className="px-5 py-2 text-sm font-medium"
                      style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
                  >
                    재고 조정
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 7.4 재고 조정 */}
        {showAdjust && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setShowAdjust(false)}>
              <div className="bg-white w-full max-w-lg p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowAdjust(false)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg mb-1" style={{ color: "#1a1a1a" }}>재고 조정</h3>
                <p className="text-sm mb-6" style={{ color: "#888" }}>
                  파손·만료 폐기·실사 보정·반품 입고 등 매입/주문과 무관한 재고 변동을 기록합니다.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>상품</label>
                    <select
                        value={form.item_id}
                        onChange={(e) => {
                          const itemId = Number(e.target.value)
                          const inv = inventories.find((i) => i.item_id === itemId)
                          setForm((prev) => ({ ...prev, item_id: itemId, lot_id: inv?.lots[0]?.lot_id ?? 0 }))
                        }}
                        className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white", color: "#333" }}
                    >
                      {inventories.map((inv) => (
                          <option key={inv.inventory_id} value={inv.item_id}>{inv.item_code} · {inv.item_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>로트</label>
                    <select
                        value={form.lot_id}
                        onChange={(e) => setForm((prev) => ({ ...prev, lot_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white", color: "#333" }}
                    >
                      {(selectedInventory?.lots ?? []).map((lot) => (
                          <option key={lot.lot_id} value={lot.lot_id}>
                            {lot.lot_number} · {formatDate(lot.expiry_date)} · 잔여 {lot.quantity}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>구분</label>
                      <select
                          value={form.adjustment_type}
                          onChange={(e) => setForm((prev) => ({ ...prev, adjustment_type: e.target.value as AdjustmentType }))}
                          className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                          style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white", color: "#333" }}
                      >
                        {ADJUSTMENT_TYPES.map((t) => (
                            <option key={t} value={t}>{ADJUSTMENT_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>수량</label>
                      <input
                          value={form.quantity}
                          onChange={(e) => setForm((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "") || 1)) }))}
                          inputMode="numeric"
                          className="w-full px-3 py-2 text-sm outline-none"
                          style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>사유</label>
                    <select
                        value={form.reason}
                        onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value as AdjustmentReason }))}
                        className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white", color: "#333" }}
                    >
                      {ADJUSTMENT_REASONS.map((r) => (
                          <option key={r} value={r}>{ADJUSTMENT_REASON_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>비고</label>
                    <input
                        value={form.memo}
                        onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                        placeholder="최대 200자"
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-7 justify-end">
                  <button onClick={() => setShowAdjust(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                  <button onClick={applyAdjustment} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>조정 반영</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
