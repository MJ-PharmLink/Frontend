import React from 'react';
import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts"
import { PRODUCTS, CATEGORY_COLORS } from "../data/products"

const monthlyData = [
  { month: "4월", sales: 182000000, purchase: 128000000, margin: 54000000 },
  { month: "5월", sales: 196000000, purchase: 137000000, margin: 59000000 },
  { month: "6월", sales: 175000000, purchase: 124000000, margin: 51000000 },
  { month: "7월", sales: 210000000, purchase: 145000000, margin: 65000000 },
  { month: "8월", sales: 228000000, purchase: 158000000, margin: 70000000 },
  { month: "9월", sales: 243000000, purchase: 162000000, margin: 81000000 },
].map((d) => ({ ...d, marginRate: +((d.margin / d.sales) * 100).toFixed(1) }))

const byPartnerData = [
  { name: "서울성모병원",  sales: 85000000, purchase: 60000000, margin: 25000000 },
  { name: "분당서울대병원", sales: 78000000, purchase: 54000000, margin: 24000000 },
  { name: "메디팜도매",    sales: 72000000, purchase: 52000000, margin: 20000000 },
  { name: "경동제약도매",  sales: 55000000, purchase: 39000000, margin: 16000000 },
  { name: "한강약국",      sales: 41000000, purchase: 30000000, margin: 11000000 },
]

// 상품별 마진: 실제 PRODUCTS 데이터에서 계산
const byProductData = PRODUCTS.slice(0, 8).map((p) => {
  const sales    = p.salePrice * p.safetyStock * 3
  const purchase = p.costPrice * p.safetyStock * 3
  const margin   = sales - purchase
  const marginRate = +((margin / sales) * 100).toFixed(1)
  return { name: p.name, indication: p.indication, category: p.category, sales, purchase, margin, marginRate }
}).sort((a, b) => b.margin - a.margin)

const pieCategoryData = [
  { name: "감염성질환 및 호흡기계",  value: 28, color: CATEGORY_COLORS["감염성질환 및 호흡기계"].color },
  { name: "소화기계 및 순환기계",    value: 22, color: CATEGORY_COLORS["소화기계 및 순환기계"].color },
  { name: "신경계 및 정신/행동장애", value: 25, color: CATEGORY_COLORS["신경계 및 정신/행동장애"].color },
  { name: "호르몬 및 대사성 의약품", value: 18, color: CATEGORY_COLORS["호르몬 및 대사성 의약품"].color },
  { name: "기타",                    value: 7,  color: "#9CA3AF" },
]

// 거래 내역 (공통 제품 데이터 참조)
const TRANSACTIONS = [
  { id: "TRX-001", date: "2026.09.11", type: "매출", partner: "한강약국",      code: "INF-001", qty: 500,  unitCost: 4200, unitSale: 7500  },
  { id: "TRX-002", date: "2026.09.11", type: "매입", partner: "동아제약",       code: "INF-001", qty: 200,  unitCost: 4200, unitSale: 0     },
  { id: "TRX-003", date: "2026.09.10", type: "매출", partner: "서울성모병원",   code: "NEU-001", qty: 1200, unitCost: 1800, unitSale: 3200  },
  { id: "TRX-004", date: "2026.09.10", type: "매출", partner: "강남약국",       code: "HOR-001", qty: 300,  unitCost: 7200, unitSale: 12500 },
  { id: "TRX-005", date: "2026.09.09", type: "매입", partner: "대웅제약",       code: "NEU-002", qty: 300,  unitCost: 2600, unitSale: 0     },
  { id: "TRX-006", date: "2026.09.09", type: "매출", partner: "경동제약도매",   code: "ETC-001", qty: 400,  unitCost: 3600, unitSale: 6200  },
  { id: "TRX-007", date: "2026.09.08", type: "매출", partner: "이화약국",       code: "INF-002", qty: 150,  unitCost: 5800, unitSale: 9800  },
  { id: "TRX-008", date: "2026.09.08", type: "매입", partner: "레킷벤키저코리아", code: "INF-005", qty: 100, unitCost: 2800, unitSale: 0    },
].map((t) => {
  const prod = PRODUCTS.find((p) => p.code === t.code)
  return {
    ...t,
    productName: prod?.name ?? t.code,
    category: prod?.category ?? "-",
    indication: prod?.indication ?? "-",
    margin: t.type === "매출" ? (t.unitSale - t.unitCost) * t.qty : 0,
  }
})

function fmt(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`
  return n.toLocaleString()
}

type ViewTab = "overview" | "partner" | "product" | "transactions"

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white p-3 shadow-lg text-xs" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
      <p className="font-semibold mb-2" style={{ color: "#333" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ₩{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function MarginPage() {
  const [tab, setTab] = useState<ViewTab>("overview")
  const [period, setPeriod] = useState("6개월")

  const latest = monthlyData[monthlyData.length - 1]
  const prev   = monthlyData[monthlyData.length - 2]
  const marginGrowth = (((latest.margin - prev.margin) / prev.margin) * 100).toFixed(1)

  const tabs: { key: ViewTab; label: string }[] = [
    { key: "overview",      label: "전체 현황" },
    { key: "partner",       label: "거래처별" },
    { key: "product",       label: "상품별" },
    { key: "transactions",  label: "거래 내역" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>매입 · 매출 · 마진 관리</h2>
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>5개 카테고리 · 25개 품목 기준 마진 집계 및 분석</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F0F2F5" }}>
          {["3개월", "6개월", "1년"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
              style={{ background: period === p ? "white" : "transparent", color: period === p ? "#0B3D91" : "#888", boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "이번달 매출", value: `₩${fmt(latest.sales)}`,    delta: "+6.6%",            color: "#0B3D91" },
          { label: "이번달 매입", value: `₩${fmt(latest.purchase)}`, delta: "+2.5%",            color: "#1677FF" },
          { label: "이번달 마진", value: `₩${fmt(latest.margin)}`,   delta: `+${marginGrowth}%`, color: "#059669" },
          { label: "마진율",      value: `${latest.marginRate}%`,     delta: "+1.2%p",           color: "#7C3AED" },
        ].map((k) => (
          <div key={k.label} className="bg-white p-5" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#888" }}>{k.label}</p>
            <p className="font-bold text-2xl mb-2" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{k.value}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
              {k.delta} 전월比
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #E5EAF0" }}>
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="pb-3 text-sm font-medium transition-all duration-150"
              style={{ color: tab === t.key ? "#0B3D91" : "#888", borderBottom: tab === t.key ? "2px solid #0B3D91" : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>월별 매출 / 매입 / 마진</p>
            <p className="text-xs mb-6" style={{ color: "#999" }}>최근 6개월 집계</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="sales"    name="매출" fill="#0B3D91" radius={[3, 3, 0, 0]} />
                <Bar dataKey="purchase" name="매입" fill="#93C5FD" radius={[3, 3, 0, 0]} />
                <Bar dataKey="margin"   name="마진" fill="#059669" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>월별 마진율 추이 (%)</p>
              <p className="text-xs mb-4" style={{ color: "#999" }}>전 카테고리 합산</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[25, 40]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "마진율"]} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5EAF0" }} />
                  <Line type="monotone" dataKey="marginRate" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4, fill: "#7C3AED" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>카테고리별 마진 비중</p>
              <p className="text-xs mb-3" style={{ color: "#999" }}>5개 카테고리 기준</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieCategoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                      {pieCategoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E5EAF0" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 shrink-0 text-xs">
                  {pieCategoryData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                      <span style={{ color: "#555", maxWidth: 110 }}>{d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name}</span>
                      <span className="font-semibold ml-auto" style={{ color: "#333" }}>{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>누적 마진 추이</p>
            <p className="text-xs mb-5" style={{ color: "#999" }}>6개월 누적 합산</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData.map((d, i) => ({ month: d.month, cumMargin: monthlyData.slice(0, i + 1).reduce((s, x) => s + x.margin, 0) }))}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#059669" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`₩${v.toLocaleString()}`, "누적 마진"]} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5EAF0" }} />
                <Area type="monotone" dataKey="cumMargin" stroke="#059669" strokeWidth={2} fill="url(#cumGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── PARTNER TAB ── */}
      {tab === "partner" && (
        <div className="space-y-5">
          <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <p className="font-semibold text-sm mb-5" style={{ color: "#1a1a1a" }}>거래처별 매출 / 마진</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byPartnerData} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 90 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#555" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="sales"  name="매출" fill="#0B3D91" radius={[0, 3, 3, 0]} />
                <Bar dataKey="margin" name="마진" fill="#059669" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                    {["거래처", "매출", "매입", "마진", "마진율"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byPartnerData.map((p, i) => {
                    const mRate = ((p.margin / p.sales) * 100).toFixed(1)
                    return (
                      <tr key={p.name} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-6 py-4 font-medium" style={{ color: "#1a1a1a" }}>{p.name}</td>
                        <td className="px-6 py-4" style={{ fontFamily: "'Inter', sans-serif", color: "#0B3D91" }}>₩{p.sales.toLocaleString()}</td>
                        <td className="px-6 py-4" style={{ fontFamily: "'Inter', sans-serif", color: "#555" }}>₩{p.purchase.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: "#059669" }}>₩{p.margin.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm" style={{ color: "#7C3AED", fontFamily: "'Inter', sans-serif" }}>{mRate}%</span>
                            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "#F3F4F6", maxWidth: 80 }}>
                              <div className="h-full rounded-full" style={{ width: `${mRate}%`, background: "#7C3AED" }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT TAB ── */}
      {tab === "product" && (
        <div className="space-y-5">
          <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <p className="font-semibold text-sm mb-5" style={{ color: "#1a1a1a" }}>상품별 마진 비교 (TOP 8)</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byProductData} margin={{ top: 4, right: 4, bottom: 40, left: 0 }} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="sales"  name="매출" fill="#0B3D91" radius={[3, 3, 0, 0]} />
                <Bar dataKey="margin" name="마진" fill="#059669" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                    {["제품명", "카테고리", "대표 용도", "매출", "매입원가", "마진", "마진율"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byProductData.map((p, i) => {
                    const c = CATEGORY_COLORS[p.category]
                    return (
                      <tr key={p.name} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                        <td className="px-5 py-3 font-semibold text-sm" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>{p.name}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{p.category}</span>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#888" }}>{p.indication}</td>
                        <td className="px-5 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#0B3D91" }}>₩{p.sales.toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#555" }}>₩{p.purchase.toLocaleString()}</td>
                        <td className="px-5 py-3 font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#059669" }}>₩{p.margin.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm" style={{ color: "#7C3AED", fontFamily: "'Inter', sans-serif" }}>{p.marginRate}%</span>
                            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "#F3F4F6", maxWidth: 70 }}>
                              <div className="h-full rounded-full" style={{ width: `${p.marginRate}%`, background: "#7C3AED" }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {tab === "transactions" && (
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                  {["거래ID", "날짜", "구분", "거래처", "제품명", "카테고리", "대표 용도", "수량", "원가", "판매단가", "마진(건별)"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t, i) => {
                  const c = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS["기타"]
                  return (
                    <tr key={t.id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                      <td className="px-4 py-3 text-xs" style={{ color: "#bbb", fontFamily: "'Inter', sans-serif" }}>{t.id}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#999" }}>{t.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={t.type === "매출" ? { background: "#EFF6FF", color: "#1D4ED8" } : { background: "#FFF7ED", color: "#9A3412" }}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a1a1a" }}>{t.partner}</td>
                      <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>{t.productName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>
                          {t.category.length > 8 ? t.category.slice(0, 8) + "…" : t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#888" }}>{t.indication}</td>
                      <td className="px-4 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#555" }}>{t.qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#777" }}>₩{t.unitCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#0B3D91" }}>
                        {t.unitSale > 0 ? `₩${t.unitSale.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif", color: t.margin > 0 ? "#059669" : "#888" }}>
                        {t.margin > 0 ? `₩${t.margin.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
