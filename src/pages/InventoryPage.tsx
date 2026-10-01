import React from 'react';
import { useState } from "react"
import { PRODUCTS, CATEGORIES, CATEGORY_COLORS } from "../data/products"

interface InventoryLog {
  id: string
  date: string
  type: "입고" | "출고"
  productCode: string
  productName: string
  qty: number
  partner: string
  manager: string
  note: string
}

const LOGS: InventoryLog[] = [
  { id: "LOG-001", date: "2026.09.11 14:22", type: "입고",  productCode: "INF-001", productName: "화이투벤큐연질캡슐",      qty: 200, partner: "동아제약",        manager: "박창고", note: "정기 발주" },
  { id: "LOG-002", date: "2026.09.11 11:05", type: "출고", productCode: "NEU-001", productName: "타이레놀정 500mg",         qty: 60,  partner: "서울성모병원",  manager: "박창고", note: "주문 ORD-002 연동" },
  { id: "LOG-003", date: "2026.09.11 09:40", type: "입고",  productCode: "HOR-001", productName: "아로나민골드정",           qty: 300, partner: "일동제약",        manager: "박창고", note: "정기 발주" },
  { id: "LOG-004", date: "2026.09.10 16:30", type: "출고", productCode: "DIG-001", productName: "베아제정",                 qty: 80,  partner: "강남약국",      manager: "박창고", note: "" },
  { id: "LOG-005", date: "2026.09.10 14:00", type: "입고",  productCode: "INF-002", productName: "지르텍정",                 qty: 50,  partner: "한국UCB제약",   manager: "박창고", note: "긴급 발주" },
  { id: "LOG-006", date: "2026.09.10 09:15", type: "출고", productCode: "ETC-001", productName: "후시딘연고",               qty: 100, partner: "경동제약도매",  manager: "박창고", note: "" },
  { id: "LOG-007", date: "2026.09.09 15:45", type: "출고", productCode: "NEU-002", productName: "이지엔6이브연질캡슐",      qty: 40,  partner: "메디팜도매",    manager: "박창고", note: "" },
  { id: "LOG-008", date: "2026.09.09 10:00", type: "입고",  productCode: "DIG-003", productName: "스멕타현탁액 20mL",       qty: 120, partner: "한국입센",      manager: "박창고", note: "정기 발주" },
  { id: "LOG-009", date: "2026.09.08 16:20", type: "출고", productCode: "INF-003", productName: "뮤테란캡슐 200mg",         qty: 30,  partner: "이화약국",      manager: "박창고", note: "" },
  { id: "LOG-010", date: "2026.09.08 11:30", type: "입고",  productCode: "HOR-002", productName: "마그비맥스연질캡슐",       qty: 50,  partner: "광동제약",      manager: "박창고", note: "정기 발주" },
  { id: "LOG-011", date: "2026.09.07 15:00", type: "출고", productCode: "ETC-005", productName: "신신파스아렉스",            qty: 90,  partner: "글로벌메디도매", manager: "박창고", note: "" },
  { id: "LOG-012", date: "2026.09.07 10:45", type: "입고",  productCode: "INF-005", productName: "스트렙실 허니앤레몬트로키", qty: 100, partner: "레킷벤키저코리아", manager: "박창고", note: "정기 발주" },
]

export default function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "log">("stock")
  const [logType, setLogType] = useState<"전체" | "입고" | "출고">("전체")
  const [catFilter, setCatFilter] = useState("전체")
  const [showInModal, setShowInModal] = useState(false)
  const [showOutModal, setShowOutModal] = useState(false)

  const filteredInventory = PRODUCTS.filter(
    (p) => catFilter === "전체" || p.category === catFilter
  )
  const lowStock = PRODUCTS.filter((p) => p.stock < p.safetyStock)
  const filteredLogs = LOGS.filter((l) => logType === "전체" || l.type === logType)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>재고 관리</h2>
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>5개 카테고리 · 25개 품목 실시간 재고 현황</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInModal(true)} className="px-4 py-2 text-sm font-medium" style={{ background: "#059669", color: "white", borderRadius: 7 }}>
            입고 처리
          </button>
          <button onClick={() => setShowOutModal(true)} className="px-4 py-2 text-sm font-medium" style={{ background: "#DC2626", color: "white", borderRadius: 7 }}>
            출고 처리
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "#DC2626" }}>
            안전재고 미달 {lowStock.length}건:
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.code} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                {p.name} ({p.stock}/{p.safetyStock})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#F0F2F5" }}>
        {[{ key: "stock" as const, label: "재고 현황" }, { key: "log" as const, label: "입출고 이력" }].map((t) => (
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

      {/* ── STOCK TAB ── */}
      {tab === "stock" && (
        <>
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter("전체")}
              className="px-3 py-1 text-xs font-medium rounded-full transition-all"
              style={{ background: catFilter === "전체" ? "#0B3D91" : "#F0F2F5", color: catFilter === "전체" ? "white" : "#666" }}
            >
              전체 ({PRODUCTS.length})
            </button>
            {CATEGORIES.map((cat) => {
              const c = CATEGORY_COLORS[cat]
              const cnt = PRODUCTS.filter((p) => p.category === cat).length
              const active = catFilter === cat
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className="px-3 py-1 text-xs font-medium rounded-full transition-all"
                  style={{ background: active ? c.color : c.bg, color: active ? "white" : c.color, border: `1px solid ${active ? c.color : c.border}` }}
                >
                  {cat} ({cnt})
                </button>
              )
            })}
          </div>

          {/* Grouped inventory table */}
          {(catFilter === "전체" ? CATEGORIES : [catFilter as typeof CATEGORIES[number]]).map((cat) => {
            const items = filteredInventory.filter((p) => p.category === cat)
            if (items.length === 0) return null
            const c = CATEGORY_COLORS[cat]
            const catLow = items.filter((p) => p.stock < p.safetyStock).length

            return (
              <div key={cat} className="bg-white overflow-hidden" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                {/* Category header row */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-wide" style={{ color: c.color }}>{cat}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.color + "22", color: c.color }}>{items.length}품목</span>
                  </div>
                  {catLow > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      ⚠ 미달 {catLow}건
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                        {["코드", "제품명", "대표 용도", "현재고", "안전재고", "단위", "재고 상태", "재고 현황"].map((h) => (
                          <th key={h} className="px-5 py-2.5 text-left font-medium" style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => {
                        const pct = Math.min(Math.round((item.stock / (item.safetyStock * 3)) * 100), 100)
                        const isLow = item.stock < item.safetyStock
                        return (
                          <tr
                            key={item.code}
                            style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none", background: isLow ? "#FFFBFB" : "white" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = isLow ? "#FFF5F5" : "#FAFAFA")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = isLow ? "#FFFBFB" : "white")}
                          >
                            <td className="px-5 py-3 text-xs" style={{ color: "#ccc", fontFamily: "'Inter', sans-serif" }}>{item.code}</td>
                            <td className="px-5 py-3 font-semibold text-sm" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>{item.name}</td>
                            <td className="px-5 py-3 text-xs" style={{ color: "#888" }}>{item.indication}</td>
                            <td className="px-5 py-3 font-bold" style={{ color: isLow ? "#DC2626" : "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>
                              {item.stock.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#aaa", fontFamily: "'Inter', sans-serif" }}>{item.safetyStock}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#888" }}>{item.unit}</td>
                            <td className="px-5 py-3">
                              <span
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={isLow ? { background: "#FEE2E2", color: "#DC2626" } : { background: "#DCFCE7", color: "#166534" }}
                              >
                                {isLow ? "⚠ 미달" : "정상"}
                              </span>
                            </td>
                            <td className="px-5 py-3" style={{ minWidth: 140 }}>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#F3F4F6" }}>
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%`, background: isLow ? "#DC2626" : pct > 60 ? "#10B981" : "#F59E0B" }}
                                  />
                                </div>
                                <span className="text-xs shrink-0" style={{ color: "#bbb", fontFamily: "'Inter', sans-serif" }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── LOG TAB ── */}
      {tab === "log" && (
        <>
          <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#F0F2F5" }}>
            {(["전체", "입고", "출고"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLogType(t)}
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                style={{
                  background: logType === t ? "white" : "transparent",
                  color: logType === t ? "#0B3D91" : "#888",
                  boxShadow: logType === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                    {["로그ID", "일시", "구분", "제품명", "카테고리", "수량", "거래처", "담당자", "비고"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => {
                    const prod = PRODUCTS.find((p) => p.code === log.productCode)
                    const c = prod ? CATEGORY_COLORS[prod.category] : CATEGORY_COLORS["기타"]
                    return (
                      <tr
                        key={log.id}
                        style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
                        <td className="px-5 py-4 text-xs" style={{ color: "#bbb", fontFamily: "'Inter', sans-serif" }}>{log.id}</td>
                        <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{log.date}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={log.type === "입고" ? { background: "#DCFCE7", color: "#166534" } : { background: "#FEE2E2", color: "#DC2626" }}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-sm" style={{ color: "#1a1a1a" }}>{log.productName}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{prod?.category ?? "-"}</span>
                        </td>
                        <td className="px-5 py-4 font-medium" style={{ fontFamily: "'Inter', sans-serif", color: "#333" }}>{log.qty.toLocaleString()}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#555" }}>{log.partner}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#777" }}>{log.manager}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#999" }}>{log.note || "-"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* In/Out Modals */}
      {(showInModal || showOutModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => { setShowInModal(false); setShowOutModal(false) }}
        >
          <div className="bg-white w-full max-w-md p-8 relative" style={{ borderRadius: 12 }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowInModal(false); setShowOutModal(false) }} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>{showInModal ? "입고 처리" : "출고 처리"}</h3>
            <div className="space-y-4">
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
              {[
                { label: showInModal ? "공급처" : "거래처", type: "text" },
                { label: "수량", type: "number" },
                { label: "비고", type: "text" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>{f.label}</label>
                  <input type={f.type} className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowInModal(false); setShowOutModal(false) }} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
              <button onClick={() => { setShowInModal(false); setShowOutModal(false) }} className="px-5 py-2 text-sm font-medium" style={{ background: showInModal ? "#059669" : "#DC2626", color: "white", borderRadius: 7 }}>처리 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
