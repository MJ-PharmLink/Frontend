import React from 'react';
import { useState } from "react"
import { PRODUCTS, CATEGORIES, CATEGORY_COLORS } from "../data/products"

export default function ProductPage() {
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("전체")
  const [showModal, setShowModal] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const selected = PRODUCTS.find((p) => p.code === selectedCode) ?? null

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = catFilter === "전체" || p.category === catFilter
    const matchSearch =
      p.name.includes(search) ||
      p.code.includes(search) ||
      p.manufacturer.includes(search) ||
      p.indication.includes(search)
    return matchCat && matchSearch
  })

  const marginPct = (costPrice: number, salePrice: number) =>
    (((salePrice - costPrice) / salePrice) * 100).toFixed(1)

  const drugTypeStyle: Record<string, { bg: string; color: string }> = {
    "전문의약품":   { bg: "#EFF6FF", color: "#1D4ED8" },
    "일반의약품":   { bg: "#F0FDF4", color: "#166534" },
    "건강기능식품": { bg: "#FFF7ED", color: "#9A3412" },
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>상품(의약품) 관리</h2>
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>카테고리 · 제품명 · 대표용도 기준 마스터 관리</p>
        </div>
        <button
          onClick={() => { setSelectedCode(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          의약품 등록
        </button>
      </div>

      {/* Category quick-nav chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFilter("전체")}
          className="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-150"
          style={{
            background: catFilter === "전체" ? "#0B3D91" : "#F0F2F5",
            color: catFilter === "전체" ? "white" : "#666",
          }}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => {
          const c = CATEGORY_COLORS[cat]
          const active = catFilter === cat
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-150"
              style={{
                background: active ? c.color : c.bg,
                color: active ? "white" : c.color,
                border: `1px solid ${active ? c.color : c.border}`,
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명, 코드, 대표용도, 제조사 검색..."
            className="pl-9 pr-4 py-2 text-sm outline-none"
            style={{ border: "1px solid #E5EAF0", borderRadius: 8, background: "white", color: "#333", minWidth: 300 }}
          />
        </div>
        <span className="text-sm" style={{ color: "#999" }}>{filtered.length}개 품목</span>
      </div>

      {/* Grouped table */}
      {(catFilter === "전체" ? CATEGORIES : [catFilter as typeof CATEGORIES[number]]).map((cat) => {
        const items = filtered.filter((p) => p.category === cat)
        if (items.length === 0) return null
        const c = CATEGORY_COLORS[cat]
        return (
          <div key={cat} className="bg-white overflow-hidden" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            {/* Category header */}
            <div className="px-5 py-3 flex items-center gap-3" style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: c.color }}>
                {cat}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: c.color + "22", color: c.color }}>
                {items.length}품목
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                    {["코드", "제품명", "대표 용도", "구분", "규격", "단위", "원가", "판매단가", "마진율", "재고", "제조사", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => {
                    const isLow = p.stock < p.safetyStock
                    return (
                      <tr
                        key={p.code}
                        style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
                        <td className="px-4 py-3 text-xs" style={{ color: "#bbb", fontFamily: "'Inter', sans-serif" }}>{p.code}</td>
                        <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>{p.name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#777" }}>{p.indication}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={drugTypeStyle[p.drugType]}>{p.drugType}</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#888" }}>{p.spec}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#888" }}>{p.unit}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>₩{p.costPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>₩{p.salePrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#059669" }}>{marginPct(p.costPrice, p.salePrice)}%</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: isLow ? "#DC2626" : "#333", fontFamily: "'Inter', sans-serif" }}>
                          {p.stock}
                          {isLow && <span className="ml-1 text-xs">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#777" }}>{p.manufacturer}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedCode(p.code); setShowModal(true) }}
                            className="text-xs font-medium transition-colors"
                            style={{ color: "#0B3D91" }}
                          >
                            수정
                          </button>
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

      {/* Edit/Register Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-2xl p-8 relative"
            style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>
              {selected ? "의약품 수정" : "의약품 등록"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "제품 코드",  value: selected?.code ?? "" },
                { label: "제품명",     value: selected?.name ?? "" },
                { label: "카테고리",   value: selected?.category ?? "" },
                { label: "대표 용도",  value: selected?.indication ?? "" },
                { label: "규격",       value: selected?.spec ?? "" },
                { label: "단위",       value: selected?.unit ?? "" },
                { label: "원가 (₩)",   value: selected ? String(selected.costPrice) : "" },
                { label: "판매단가 (₩)", value: selected ? String(selected.salePrice) : "" },
                { label: "안전재고",   value: selected ? String(selected.safetyStock) : "" },
                { label: "제조사",     value: selected?.manufacturer ?? "" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>{f.label}</label>
                  <input
                    defaultValue={f.value}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
