import { useState } from "react"
import type { AuthUser } from "../App"
import { CUSTOMERS, DELIVERIES, ITEMS, ORDERS, TODAY, itemOf } from "../data/sample"
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TONES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "../lib/domain"
import { ORDER_STATUSES } from "../types/api"
import type { OrderDetail, OrderItem, OrderStatus } from "../types/api"

/**
 * 8. 주문 — 관리자·영업 전용.
 *
 * 주문 상태는 PENDING → APPROVED / CANCELLED 세 가지뿐이다. 출고·납품 진행은
 * 별도 리소스(9. 납품)이므로 여기서는 연결된 납품 상태를 읽기만 한다.
 * 재고는 등록이 아니라 승인(8.4) 시점에 FEFO로 차감된다.
 */

interface Props {
  user: AuthUser
}

interface DraftLine {
  item_id: number
  quantity: number
}

export default function OrderPage({ user }: Props) {
  const [orders, setOrders] = useState<OrderDetail[]>(ORDERS)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "전체">("전체")
  const [partnerFilter, setPartnerFilter] = useState<number | "전체">("전체")
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<OrderDetail | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  const [draftPartner, setDraftPartner] = useState<number>(CUSTOMERS[0]?.partner_id ?? 0)
  const [draftLines, setDraftLines] = useState<DraftLine[]>([{ item_id: ITEMS[0].item_id, quantity: 1 }])

  // 8장 전체가 관리자·영업 권한이다
  const canManage = user.role === "ADMIN" || user.role === "SALES"

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "전체" || o.status === statusFilter
    const matchPartner = partnerFilter === "전체" || o.partner_id === partnerFilter
    return matchStatus && matchPartner
  })

  const counts = {
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    APPROVED: orders.filter((o) => o.status === "APPROVED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  }

  const deliveryOf = (orderId: number) => DELIVERIES.find((d) => d.order_id === orderId)

  /** 8.4 주문 승인 — 재고 차감 후 납품(WAITING)이 생성된다 */
  const approve = (order: OrderDetail) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === order.order_id
          ? { ...o, status: "APPROVED", approved_at: new Date().toISOString(), delivery_id: o.order_id }
          : o,
      ),
    )
    setDetail(null)
  }

  /** 8.5 주문 취소 — PENDING 상태에서만 가능하다 */
  const cancel = () => {
    if (!cancelTarget) return
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === cancelTarget.order_id
          ? {
              ...o,
              status: "CANCELLED",
              cancel_reason: cancelReason.trim() || null,
              cancelled_at: new Date().toISOString(),
              cancelled_by: user.user_id,
            }
          : o,
      ),
    )
    setCancelTarget(null)
    setCancelReason("")
    setDetail(null)
  }

  /** 8.2 주문 등록 — 판매단가는 서버가 상품 마스터에서 조회해 스냅샷으로 저장한다 */
  const createOrder = () => {
    const lines = draftLines.filter((l) => l.quantity > 0)
    if (lines.length === 0) return

    let itemSeq = Date.now()
    const items: OrderItem[] = lines.map((line) => {
      const item = itemOf(line.item_id)
      return {
        order_item_id: ++itemSeq,
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        quantity: line.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        line_amount: line.quantity * item.unit_price,
      }
    })

    const nextId = Math.max(0, ...orders.map((o) => o.order_id)) + 1
    const partner = CUSTOMERS.find((p) => p.partner_id === draftPartner)

    setOrders((prev) => [
      {
        order_id: nextId,
        order_number: `ORD-${TODAY.replace(/-/g, "")}-${String(nextId).padStart(4, "0")}`,
        partner_id: draftPartner,
        partner_name: partner?.name ?? "-",
        status: "PENDING",
        items,
        total_amount: items.reduce((sum, i) => sum + i.line_amount, 0),
        delivery_id: null,
        cancel_reason: null,
        approved_at: null,
        cancelled_at: null,
        cancelled_by: null,
        created_by: user.user_id,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ])
    setShowCreate(false)
    setDraftLines([{ item_id: ITEMS[0].item_id, quantity: 1 }])
  }

  const draftTotal = draftLines.reduce((sum, l) => {
    const item = ITEMS.find((i) => i.item_id === l.item_id)
    return sum + (item ? item.unit_price * l.quantity : 0)
  }, 0)

  const chipStyle = (active: boolean) => ({
    background: active ? "#0B3D91" : "#F0F2F5",
    color: active ? "white" : "#666",
  })

  return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>주문 관리</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              고객사 주문 등록 · 승인 · 취소 — 재고는 승인 시점에 차감됩니다
            </p>
          </div>
          {canManage && (
              <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                  style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                주문 등록
              </button>
          )}
        </div>

        {/* 상태 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {ORDER_STATUSES.map((s) => (
              <div key={s} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="text-xs" style={{ color: "#999" }}>{ORDER_STATUS_LABELS[s]}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: ORDER_STATUS_TONES[s].color, fontFamily: "'Inter', sans-serif" }}>
                  {counts[s]}
                </p>
              </div>
          ))}
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStatusFilter("전체")} className="px-3 py-1 text-xs font-medium rounded-full" style={chipStyle(statusFilter === "전체")}>
            전체 ({orders.length})
          </button>
          {ORDER_STATUSES.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1 text-xs font-medium rounded-full" style={chipStyle(statusFilter === s)}>
                {ORDER_STATUS_LABELS[s]} ({counts[s]})
              </button>
          ))}
          <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value === "전체" ? "전체" : Number(e.target.value))}
              className="ml-auto px-3 py-1.5 text-xs outline-none cursor-pointer"
              style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }}
          >
            <option value="전체">전체 고객사</option>
            {CUSTOMERS.map((p) => (
                <option key={p.partner_id} value={p.partner_id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* 목록 */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["주문번호", "고객사", "품목 수", "주문 금액", "주문 상태", "납품 상태", "등록일", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {filtered.map((o, i) => {
                const delivery = deliveryOf(o.order_id)
                const tone = ORDER_STATUS_TONES[o.status]
                return (
                    <tr
                        key={o.order_id}
                        style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: "#666" }}>{o.order_number}</td>
                      <td className="px-5 py-4 font-medium" style={{ color: "#1a1a1a" }}>{o.partner_name}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#555" }}>{o.items.length}개</td>
                      <td className="px-5 py-4 font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(o.total_amount)}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={tone}>
                          {ORDER_STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {delivery ? (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={DELIVERY_STATUS_TONES[delivery.status]}>
                              {DELIVERY_STATUS_LABELS[delivery.status]}
                            </span>
                        ) : (
                            <span className="text-xs" style={{ color: "#bbb" }}>-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDate(o.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => setDetail(o)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>상세</button>
                          {canManage && o.status === "PENDING" && (
                              <>
                                <button onClick={() => approve(o)} className="text-xs font-medium" style={{ color: "#059669" }}>승인</button>
                                <button onClick={() => { setCancelTarget(o); setCancelReason("") }} className="text-xs font-medium" style={{ color: "#DC2626" }}>취소</button>
                              </>
                          )}
                        </div>
                      </td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
              <div className="py-14 text-center text-sm" style={{ color: "#999" }}>조건에 맞는 주문이 없습니다.</div>
          )}
        </div>

        {/* 8.3 주문 상세 */}
        {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetail(null)}>
              <div className="bg-white w-full max-w-2xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setDetail(null)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>{detail.order_number}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={ORDER_STATUS_TONES[detail.status]}>
                    {ORDER_STATUS_LABELS[detail.status]}
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: "#888" }}>{detail.partner_name}</p>

                <table className="w-full text-sm mb-5">
                  <thead>
                  <tr style={{ background: "#F7F9FC" }}>
                    {["상품", "수량", "판매단가", "원가", "금액"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#888", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody>
                  {detail.items.map((item, i) => (
                      <tr key={item.order_item_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-3 py-2">
                          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{item.item_name}</p>
                          <p className="font-mono text-xs" style={{ color: "#aaa" }}>{item.item_code}</p>
                        </td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatNumber(item.quantity)}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.unit_price)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{item.unit_cost ? formatMoney(item.unit_cost) : "-"}</td>
                        <td className="px-3 py-2 text-sm font-medium" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.line_amount)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                <p className="text-xs mb-6" style={{ color: "#aaa" }}>
                  단가는 주문 등록 시점의 스냅샷입니다. 이후 상품 마스터 단가가 바뀌어도 이 주문의 금액은 변하지 않습니다.
                </p>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm pt-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                  {[
                    { label: "주문 금액", value: formatMoney(detail.total_amount) },
                    { label: "등록일시", value: formatDateTime(detail.created_at) },
                    { label: "승인일시", value: formatDateTime(detail.approved_at) },
                    { label: "납품", value: detail.delivery_id ? `#${detail.delivery_id} · ${DELIVERY_STATUS_LABELS[deliveryOf(detail.order_id)?.status ?? "WAITING"]}` : "미생성" },
                    ...(detail.status === "CANCELLED"
                        ? [
                            { label: "취소일시", value: formatDateTime(detail.cancelled_at) },
                            { label: "취소 사유", value: detail.cancel_reason ?? "-" },
                          ]
                        : []),
                  ].map((row) => (
                      <div key={row.label}>
                        <p className="text-xs" style={{ color: "#999" }}>{row.label}</p>
                        <p className="mt-0.5" style={{ color: "#333" }}>{row.value}</p>
                      </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-7 justify-end">
                  {canManage && detail.status === "PENDING" && (
                      <>
                        <button
                            onClick={() => { setCancelTarget(detail); setCancelReason("") }}
                            className="px-5 py-2 text-sm font-medium"
                            style={{ border: "1px solid #FECACA", borderRadius: 7, color: "#DC2626", background: "white" }}
                        >
                          주문 취소
                        </button>
                        <button
                            onClick={() => approve(detail)}
                            className="px-5 py-2 text-sm font-medium"
                            style={{ background: "#059669", color: "white", borderRadius: 7 }}
                        >
                          승인 (재고 차감)
                        </button>
                      </>
                  )}
                  <button onClick={() => setDetail(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                </div>
              </div>
            </div>
        )}

        {/* 8.5 주문 취소 */}
        {cancelTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setCancelTarget(null)}>
              <div className="bg-white w-full max-w-md p-7" style={{ borderRadius: 12 }} onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold text-base mb-1" style={{ color: "#1a1a1a" }}>주문 취소</h3>
                <p className="text-sm mb-5" style={{ color: "#888" }}>
                  {cancelTarget.order_number} · {cancelTarget.partner_name}
                </p>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>취소 사유 (선택, 최대 200자)</label>
                <input
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value.slice(0, 200))}
                    placeholder="거래처 요청으로 주문 철회"
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                />
                <div className="flex gap-3 mt-6 justify-end">
                  <button onClick={() => setCancelTarget(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                  <button onClick={cancel} className="px-5 py-2 text-sm font-medium" style={{ background: "#DC2626", color: "white", borderRadius: 7 }}>취소 처리</button>
                </div>
              </div>
            </div>
        )}

        {/* 8.2 주문 등록 */}
        {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setShowCreate(false)}>
              <div className="bg-white w-full max-w-2xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowCreate(false)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg mb-1" style={{ color: "#1a1a1a" }}>주문 등록</h3>
                <p className="text-sm mb-6" style={{ color: "#888" }}>
                  등록 직후 상태는 승인 대기입니다. 판매단가는 상품 마스터에서 자동으로 적용됩니다.
                </p>

                <div className="mb-5">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>고객사</label>
                  <select
                      value={draftPartner}
                      onChange={(e) => setDraftPartner(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                      style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white", color: "#333" }}
                  >
                    {CUSTOMERS.filter((p) => p.is_active).map((p) => (
                        <option key={p.partner_id} value={p.partner_id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>주문 품목</label>
                <div className="space-y-2">
                  {draftLines.map((line, idx) => {
                    const item = ITEMS.find((i) => i.item_id === line.item_id)
                    return (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                              value={line.item_id}
                              onChange={(e) =>
                                setDraftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, item_id: Number(e.target.value) } : l)))
                              }
                              className="flex-1 px-3 py-2 text-sm outline-none cursor-pointer"
                              style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white", color: "#333" }}
                          >
                            {ITEMS.filter((i) => i.is_active).map((i) => (
                                <option key={i.item_id} value={i.item_id}>{i.item_code} · {i.item_name}</option>
                            ))}
                          </select>
                          <input
                              value={line.quantity}
                              onChange={(e) =>
                                setDraftLines((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "") || 1)) } : l)),
                                )
                              }
                              inputMode="numeric"
                              className="w-20 px-3 py-2 text-sm outline-none text-right"
                              style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                          />
                          <span className="w-24 text-right text-sm" style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>
                            {formatMoney((item?.unit_price ?? 0) * line.quantity)}
                          </span>
                          <button
                              onClick={() => setDraftLines((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={draftLines.length === 1}
                              aria-label="품목 삭제"
                              className="px-2 py-2 text-sm"
                              style={{ color: draftLines.length === 1 ? "#ddd" : "#DC2626" }}
                          >
                            ✕
                          </button>
                        </div>
                    )
                  })}
                </div>

                <button
                    onClick={() => setDraftLines((prev) => [...prev, { item_id: ITEMS[0].item_id, quantity: 1 }])}
                    className="mt-3 px-3 py-1.5 text-xs font-medium"
                    style={{ border: "1px dashed #CBD5E1", borderRadius: 6, color: "#0B3D91" }}
                >
                  + 품목 추가
                </button>

                <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <span className="text-sm" style={{ color: "#666" }}>주문 금액</span>
                  <span className="text-lg font-bold" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>{formatMoney(draftTotal)}</span>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                  <button onClick={() => setShowCreate(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                  <button onClick={createOrder} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>등록</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
