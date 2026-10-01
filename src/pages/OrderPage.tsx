import { useState } from "react"
import { PRODUCTS, CATEGORIES } from "../data/products"
import type { AuthUser } from "../App"

interface Order {
  id: string
  date: string
  partner: string
  productCode: string
  productName: string
  category: string
  indication: string
  qty: number
  unitPrice: number
  status: "대기" | "출고완료" | "납품완료"
  manager: string
}

const ORDERS: Order[] = [
  { id: "ORD-20260911-001", date: "2026.09.11", partner: "한강약국",     productCode: "INF-001", productName: "화이투벤큐연질캡슐",    category: "감염성질환 및 호흡기계",  indication: "종합 감기 증상",       qty: 500,  unitPrice: 7500,  status: "납품완료", manager: "이영업" },
  { id: "ORD-20260911-002", date: "2026.09.11", partner: "서울성모병원", productCode: "NEU-001", productName: "타이레놀정 500mg",       category: "신경계 및 정신/행동장애", indication: "두통·발열·각종 통증",  qty: 1200, unitPrice: 3200,  status: "출고완료", manager: "이영업" },
  { id: "ORD-20260910-003", date: "2026.09.10", partner: "메디팜도매",   productCode: "DIG-001", productName: "베아제정",               category: "소화기계 및 순환기계",   indication: "소화불량·과식",        qty: 800,  unitPrice: 5900,  status: "대기",     manager: "이영업" },
  { id: "ORD-20260910-004", date: "2026.09.10", partner: "강남약국",     productCode: "HOR-001", productName: "아로나민골드정",         category: "호르몬 및 대사성 의약품", indication: "피로 시 비타민 B군 보급", qty: 300, unitPrice: 12500, status: "납품완료", manager: "이영업" },
  { id: "ORD-20260909-005", date: "2026.09.09", partner: "분당서울대병원", productCode: "NEU-002", productName: "이지엔6이브연질캡슐", category: "신경계 및 정신/행동장애", indication: "생리통·염증성 통증",  qty: 200,  unitPrice: 4500,  status: "납품완료", manager: "이영업" },
  { id: "ORD-20260909-006", date: "2026.09.09", partner: "경동제약도매", productCode: "ETC-001", productName: "후시딘연고",             category: "기타",                   indication: "세균성 피부감염",      qty: 400,  unitPrice: 6200,  status: "출고완료", manager: "이영업" },
  { id: "ORD-20260908-007", date: "2026.09.08", partner: "이화약국",     productCode: "INF-002", productName: "지르텍정",               category: "감염성질환 및 호흡기계",  indication: "알레르기성 비염",      qty: 150,  unitPrice: 9800,  status: "납품완료", manager: "이영업" },
  { id: "ORD-20260908-008", date: "2026.09.08", partner: "글로벌메디도매", productCode: "ETC-005", productName: "신신파스아렉스",       category: "기타",                   indication: "근육통·관절통·삠",    qty: 600,  unitPrice: 4200,  status: "납품완료", manager: "이영업" },
]

const STATUS_FLOW: Record<Order["status"], Order["status"] | null> = {
  "대기": "출고완료",
  "출고완료": "납품완료",
  "납품완료": null,
}

const statusColors: Record<string, { bg: string; color: string }> = {
  "대기":     { bg: "#FEF9C3", color: "#92400E" },
  "출고완료": { bg: "#DBEAFE", color: "#1D4ED8" },
  "납품완료": { bg: "#DCFCE7", color: "#166534" },
}

interface Props { user: AuthUser }

export default function OrderPage({ user }: Props) {
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [filterStatus, setFilterStatus] = useState("전체")
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)

  const canRegister = user.role === "admin" || user.role === "sales"
  const canApprove  = user.role === "admin" || user.role === "warehouse"

  const filtered = orders.filter((o) => filterStatus === "전체" || o.status === filterStatus)

  const advanceStatus = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const next = STATUS_FLOW[o.status]
        return next ? { ...o, status: next } : o
      })
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>주문 · 납품 관리</h2>
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>주문 등록 및 납품 상태 관리</p>
        </div>
        {canRegister && (
          <button
            onClick={() => { setSelected(null); setShowModal(true) }}
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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "대기",     count: orders.filter((o) => o.status === "대기").length,     color: "#92400E", bg: "#FEF9C3" },
          { label: "출고완료", count: orders.filter((o) => o.status === "출고완료").length, color: "#1D4ED8", bg: "#DBEAFE" },
          { label: "납품완료", count: orders.filter((o) => o.status === "납품완료").length, color: "#166534", bg: "#DCFCE7" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-5 cursor-pointer transition-all duration-150"
            style={{ background: "white", borderRadius: 8, border: filterStatus === s.label ? `2px solid ${s.color}` : "1px solid #E5EAF0" }}
            onClick={() => setFilterStatus(filterStatus === s.label ? "전체" : s.label)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium" style={{ color: "#666" }}>{s.label}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.count}건</span>
            </div>
            <p className="font-bold text-3xl" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#F0F2F5" }}>
        {["전체", "대기", "출고완료", "납품완료"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
            style={{
              background: filterStatus === s ? "white" : "transparent",
              color: filterStatus === s ? "#0B3D91" : "#888",
              boxShadow: filterStatus === s ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["주문번호", "날짜", "거래처", "제품명", "대표 용도", "수량", "단가", "총액", "상태", "액션"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const total = o.qty * o.unitPrice
                const nextStatus = STATUS_FLOW[o.status]
                return (
                  <tr
                    key={o.id}
                    style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: "#bbb", fontFamily: "'Inter', sans-serif" }}>{o.id}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#999" }}>{o.date}</td>
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a1a1a" }}>{o.partner}</td>
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>{o.productName}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#888" }}>{o.indication}</td>
                    <td className="px-4 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#555" }}>{o.qty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#555" }}>₩{o.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a1a" }}>₩{total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusColors[o.status]}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canApprove && nextStatus && (
                          <button
                            onClick={() => advanceStatus(o.id)}
                            className="text-xs font-medium px-2.5 py-1 transition-colors"
                            style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 5 }}
                          >
                            → {nextStatus}
                          </button>
                        )}
                        <button
                          onClick={() => { setSelected(o); setShowModal(true) }}
                          className="text-xs font-medium"
                          style={{ color: "#0B3D91" }}
                        >
                          납품서
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {selected ? (
              /* Delivery Slip */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "#1677FF" }}>PHARMLINK</p>
                    <h3 className="font-bold text-xl" style={{ color: "#0B3D91" }}>납품서</h3>
                  </div>
                  <div className="text-right text-xs" style={{ color: "#888" }}>
                    <p>발행일: {selected.date}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif" }}>{selected.id}</p>
                  </div>
                </div>
                <div className="py-4 mb-4 space-y-2" style={{ borderTop: "2px solid #0B3D91", borderBottom: "1px solid #E5EAF0" }}>
                  {[
                    { label: "거래처",   value: selected.partner },
                    { label: "카테고리", value: selected.category },
                    { label: "제품명",   value: selected.productName },
                    { label: "대표 용도", value: selected.indication },
                    { label: "상태",     value: selected.status },
                  ].map((r) => (
                    <div key={r.label} className="flex gap-3 text-sm">
                      <span className="font-medium w-20 shrink-0" style={{ color: "#666" }}>{r.label}</span>
                      <span style={{ color: "#333" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5EAF0" }}>
                      <th className="py-2 text-left text-xs font-medium" style={{ color: "#888" }}>품목</th>
                      <th className="py-2 text-right text-xs font-medium" style={{ color: "#888" }}>수량</th>
                      <th className="py-2 text-right text-xs font-medium" style={{ color: "#888" }}>단가</th>
                      <th className="py-2 text-right text-xs font-medium" style={{ color: "#888" }}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 text-sm">{selected.productName}</td>
                      <td className="py-3 text-right text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{selected.qty.toLocaleString()}</td>
                      <td className="py-3 text-right text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>₩{selected.unitPrice.toLocaleString()}</td>
                      <td className="py-3 text-right font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>₩{(selected.qty * selected.unitPrice).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-between items-center pt-4" style={{ borderTop: "2px solid #0B3D91" }}>
                  <span className="font-semibold text-sm">합계</span>
                  <span className="font-bold text-lg" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>
                    ₩{(selected.qty * selected.unitPrice).toLocaleString()}
                  </span>
                </div>
                <button onClick={() => window.print()} className="mt-6 w-full py-2.5 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>
                  PDF / 인쇄
                </button>
              </div>
            ) : (
              /* New Order Form */
              <div>
                <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>주문 등록</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>거래처</label>
                    <input className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6 }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>품목 선택</label>
                    <select className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}>
                      {CATEGORIES.map((cat) => (
                        <optgroup key={cat} label={cat}>
                          {PRODUCTS.filter((p) => p.category === cat).map((p) => (
                            <option key={p.code} value={p.code}>{p.name} — {p.indication}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  {[{ label: "수량", type: "number" }, { label: "단가 (₩)", type: "number" }, { label: "비고", type: "text" }].map((f) => (
                    <div key={f.label}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>{f.label}</label>
                      <input type={f.type} className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6 justify-end">
                  <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                  <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>등록</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
