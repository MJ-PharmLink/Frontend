import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { AuthUser, AdminRoute } from "../App"

interface Props {
  user: AuthUser
  onNavigate: (r: AdminRoute) => void
}

const monthlyData = [
  { month: "4월", sales: 182000000, purchase: 128000000, margin: 54000000 },
  { month: "5월", sales: 196000000, purchase: 137000000, margin: 59000000 },
  { month: "6월", sales: 175000000, purchase: 124000000, margin: 51000000 },
  { month: "7월", sales: 210000000, purchase: 145000000, margin: 65000000 },
  { month: "8월", sales: 228000000, purchase: 158000000, margin: 70000000 },
  { month: "9월", sales: 243000000, purchase: 162000000, margin: 81000000 },
]

const lowStockItems = [
  { name: "지르텍정",              stock: 32, min: 60,  unit: "박스" },
  { name: "오트리빈멘톨 0.1% 분무제", stock: 14, min: 40, unit: "개"   },
  { name: "겔포스엠현탁액",        stock: 22, min: 50,  unit: "박스" },
  { name: "치센캡슐",              stock: 11, min: 40,  unit: "박스" },
  { name: "보나링에이정",          stock: 19, min: 40,  unit: "박스" },
  { name: "마그비맥스연질캡슐",    stock: 27, min: 50,  unit: "병"   },
  { name: "마이보라정",            stock: 8,  min: 30,  unit: "박스" },
  { name: "라미실크림 1%",         stock: 43, min: 50,  unit: "개"   },
  { name: "비판텐연고",            stock: 16, min: 60,  unit: "개"   },
]

const recentOrders = [
  { id: "ORD-20260911-001", partner: "한강약국",     product: "화이투벤큐연질캡슐",  qty: 500,  status: "납품완료", date: "2026.09.11" },
  { id: "ORD-20260911-002", partner: "서울성모병원", product: "타이레놀정 500mg",    qty: 1200, status: "출고완료", date: "2026.09.11" },
  { id: "ORD-20260910-003", partner: "메디팜도매",   product: "베아제정",            qty: 800,  status: "대기",     date: "2026.09.10" },
  { id: "ORD-20260910-004", partner: "강남약국",     product: "아로나민골드정",      qty: 300,  status: "납품완료", date: "2026.09.10" },
]

const statusColors: Record<string, { bg: string; color: string }> = {
  "대기": { bg: "#FEF9C3", color: "#92400E" },
  "출고완료": { bg: "#DBEAFE", color: "#1D4ED8" },
  "납품완료": { bg: "#DCFCE7", color: "#166534" },
}

function fmt(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`
  return n.toLocaleString()
}

export default function DashboardPage({ user, onNavigate }: Props) {
  const latest = monthlyData[monthlyData.length - 1]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-semibold text-xl" style={{ color: "#1a1a1a" }}>
          안녕하세요, {user.name}님 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>2026년 9월 11일 기준 팜링크 ERP 현황입니다.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "이번달 매출", value: fmt(latest.sales), sub: "전월 대비 +6.6%", color: "#0B3D91", icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /> },
          { label: "이번달 매입", value: fmt(latest.purchase), sub: "전월 대비 +2.5%", color: "#1677FF", icon: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></> },
          { label: "이번달 마진", value: fmt(latest.margin), sub: `마진율 ${((latest.margin / latest.sales) * 100).toFixed(1)}%`, color: "#059669", icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
          { label: "안전재고 미달", value: "4건", sub: "즉시 확인 필요", color: "#DC2626", icon: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
        ].map((card) => (
          <div key={card.label} className="bg-white p-5" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm" style={{ color: "#888" }}>{card.label}</p>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="1.8" strokeLinecap="round">
                {card.icon}
              </svg>
            </div>
            <p className="font-bold text-2xl mb-1" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{card.value}</p>
            <p className="text-xs" style={{ color: card.color === "#DC2626" ? "#DC2626" : "#888" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>매출 / 마진 추이</p>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>최근 6개월</p>
            </div>
            <button
              onClick={() => onNavigate("margin")}
              className="text-xs font-medium"
              style={{ color: "#0B3D91" }}
            >
              상세보기 →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B3D91" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0B3D91" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `₩ ${value.toLocaleString()}`,
                  name === "sales" ? "매출" : name === "margin" ? "마진" : "매입",
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5EAF0" }}
              />
              <Area type="monotone" dataKey="sales" stroke="#0B3D91" strokeWidth={2} fill="url(#salesGrad)" name="sales" />
              <Area type="monotone" dataKey="margin" stroke="#059669" strokeWidth={2} fill="url(#marginGrad)" name="margin" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: "#666" }}>
              <span className="inline-block w-8 h-0.5 rounded" style={{ background: "#0B3D91" }} /> 매출
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#666" }}>
              <span className="inline-block w-8 h-0.5 rounded" style={{ background: "#059669" }} /> 마진
            </div>
          </div>
        </div>

        {/* Low stock alert */}
        <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>안전재고 미달 품목</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              {lowStockItems.length}건
            </span>
          </div>
          <div className="space-y-4">
            {lowStockItems.map((item) => {
              const pct = Math.round((item.stock / item.min) * 100)
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-medium truncate" style={{ color: "#333", maxWidth: 150 }}>{item.name}</p>
                    <p className="text-xs shrink-0 ml-2" style={{ color: "#DC2626" }}>
                      {item.stock}/{item.min} {item.unit}
                    </p>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "#F3F4F6" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%`, background: pct < 30 ? "#DC2626" : pct < 60 ? "#F59E0B" : "#10B981" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => onNavigate("inventory")}
            className="mt-6 w-full py-2 text-xs font-medium transition-colors duration-150"
            style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#0B3D91" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F9FC")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            재고 관리 바로가기 →
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #E5EAF0" }}>
          <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>최근 주문 / 납품 현황</p>
          <button
            onClick={() => onNavigate("orders")}
            className="text-xs font-medium"
            style={{ color: "#0B3D91" }}
          >
            전체보기 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F9FC" }}>
                {["주문번호", "거래처", "품목", "수량", "상태", "날짜"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr
                  key={o.id}
                  style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td className="px-6 py-4" style={{ color: "#666", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>{o.id}</td>
                  <td className="px-6 py-4 font-medium text-sm" style={{ color: "#333" }}>{o.partner}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#555" }}>{o.product}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{o.qty.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ ...statusColors[o.status] }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
