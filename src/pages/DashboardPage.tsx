import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { AdminRoute, AuthUser } from "../App"
import { dashboardApi, errorMessage, fetchAllPages, purchasesApi } from "../api"
// 상품 목록 API(6.1)가 생기기 전까지 재고 부족 품목의 단위는 샘플 상품에서 찾는다
import { ITEMS } from "../data/sample"
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TONES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  firstDayOfMonthKst,
  formatDate,
  formatMoney,
  todayKst,
} from "../lib/domain"
import type { DashboardSummary, LowStockItem, RecentOrder } from "../types/api"

/**
 * 12. 대시보드.
 *
 * 집계 정의는 12.1을 따른다. 매출·마진의 기간 기준은 sales.sale_date, 매입은
 * purchases.purchase_date 이고, 주문·납품·재고 경고 건수는 기간과 무관한
 * 현재 시점 값이다.
 */

interface Props {
  user: AuthUser
  onNavigate: (r: AdminRoute) => void
}

/** 최근 6개월(이번 달 포함) 각 달의 [1일, 말일(이번 달은 오늘)] — 추이 차트는 달마다 12.1 요약을 받아 그린다 */
function lastSixMonths(today: string) {
  const [year, month] = today.split("-").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (5 - i), 1))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const start = `${y}-${pad(m)}-01`
    const end = i === 5 ? today : `${y}-${pad(m)}-${pad(lastDay)}`
    return { month: `${m}월`, start, end }
  })
}

const EMPTY_SUMMARY: DashboardSummary = {
  period: { start_date: firstDayOfMonthKst(), end_date: todayKst() },
  total_sales: 0,
  total_purchases: 0,
  total_margin: 0,
  margin_rate: 0,
  pending_order_count: 0,
  waiting_delivery_count: 0,
  shipped_delivery_count: 0,
  low_stock_count: 0,
  expiring_soon_count: 0,
  expired_count: 0,
}

function compact(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`
  return n.toLocaleString()
}

export default function DashboardPage({ user, onNavigate }: Props) {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY)
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [trend, setTrend] = useState<{ month: string; sales: number; purchase: number; margin: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  // 기간 매입 건수(10.1 목록의 total_count). 매입 조회 권한이 없는 영업 계정은 "-"
  const [purchaseCount, setPurchaseCount] = useState<number | null>(null)
  const today = todayKst()

  /**
   * 12.2 재고 부족 전체, 12.3 최근 주문 5건, 최근 6개월 추이(달마다 12.1 요약)를 함께 받는다.
   * 요약 카드는 추이의 이번 달(1일 ~ 오늘) 요약을 쓴다
   */
  useEffect(() => {
    Promise.all([
      fetchAllPages((page, page_size) => dashboardApi.lowStockItems({ page, page_size })).then(setLowStock),
      dashboardApi.recentOrders(5).then(setOrders),
      // 마지막 달(이번 달 1일 ~ 오늘)은 기간 미지정 요약과 같은 기간이라 요약 카드에도 그대로 쓴다
      Promise.all(
        lastSixMonths(today).map((m) => dashboardApi.summary({ start_date: m.start, end_date: m.end })),
      ).then((months) => {
        setSummary(months[months.length - 1])
        setTrend(
          months.map((s, i) => ({
            month: lastSixMonths(today)[i].month,
            sales: s.total_sales,
            purchase: s.total_purchases,
            margin: s.total_margin,
          })),
        )
      }),
    ]).catch((err) => setError(errorMessage(err, "대시보드 정보를 불러오지 못했습니다.")))
    if (user.role !== "SALES") {
      purchasesApi
        .list({ start_date: firstDayOfMonthKst(), end_date: today, page: 1, page_size: 1 })
        .then((page) => setPurchaseCount(page.pagination.total_count))
        .catch(() => setPurchaseCount(null))
    }
  }, [today, user.role])

  const cards = [
    {
      label: "기간 매출",
      value: compact(summary.total_sales),
      sub: `${formatDate(summary.period.start_date)} ~ ${formatDate(summary.period.end_date)}`,
      color: "#0B3D91",
      icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
    },
    {
      label: "기간 매입",
      value: compact(summary.total_purchases),
      sub: `매입 ${purchaseCount ?? "-"}건`,
      color: "#1677FF",
      icon: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></>,
    },
    {
      label: "기간 마진",
      value: compact(summary.total_margin),
      sub: `마진율 ${summary.margin_rate.toFixed(2)}%`,
      color: "#059669",
      icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    },
    {
      label: "재고 경고",
      value: `${summary.low_stock_count}건`,
      sub: `임박 ${summary.expiring_soon_count} · 만료 ${summary.expired_count}`,
      color: "#DC2626",
      icon: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    },
  ]

  const workload = [
    { label: "승인 대기 주문", value: summary.pending_order_count, route: "orders" as AdminRoute, color: "#C2410C" },
    { label: "출고 대기 납품", value: summary.waiting_delivery_count, route: "delivery" as AdminRoute, color: "#1D4ED8" },
    { label: "출고 완료 납품", value: summary.shipped_delivery_count, route: "delivery" as AdminRoute, color: "#166534" },
  ]

  return (
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-semibold text-xl" style={{ color: "#1a1a1a" }}>
            안녕하세요, {user.name}님 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
            {formatDate(today)} 기준 팜링크 ERP 현황입니다.
          </p>
        </div>

        {error && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              {error}
            </p>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
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

        {/* 업무 현황 — 기간과 무관한 현재 시점 값 */}
        <div className="grid grid-cols-3 gap-4">
          {workload.map((w) => (
              <button
                  key={w.label}
                  onClick={() => onNavigate(w.route)}
                  className="bg-white px-5 py-4 text-left transition-colors"
                  style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F9FC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <p className="text-xs" style={{ color: "#999" }}>{w.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: w.color, fontFamily: "'Inter', sans-serif" }}>
                  {w.value}건
                </p>
              </button>
          ))}
        </div>

        {/* Chart + Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>매출 / 마진 추이</p>
                <p className="text-xs mt-0.5" style={{ color: "#999" }}>최근 6개월 · 매출일(sale_date) 기준</p>
              </div>
              <button onClick={() => onNavigate("margin")} className="text-xs font-medium" style={{ color: "#0B3D91" }}>
                상세보기 →
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                <YAxis tickFormatter={(v) => compact(Number(v))} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <Tooltip
                    formatter={(value, name) => [
                      formatMoney(Number(value ?? 0)),
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

          {/* 12.2 재고 부족 품목 */}
          <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>안전재고 미달 품목</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                {lowStock.length}건
              </span>
            </div>
            <div className="max-h-56 space-y-4 overflow-y-auto pr-2">
              {lowStock.map((row) => {
                const pct = row.safety_stock === 0 ? 0 : Math.round((row.quantity / row.safety_stock) * 100)
                const unit = ITEMS.find((i) => i.item_id === row.item_id)?.unit ?? ""
                return (
                    <div key={row.inventory_id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="min-w-0 truncate text-xs font-medium" style={{ maxWidth: 170, color: "#333" }} title={row.item_code}>
                          {row.item_name}
                        </p>
                        <p className="text-xs shrink-0 ml-2" style={{ color: "#DC2626" }}>
                          {row.quantity}/{row.safety_stock} {unit}
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
              {lowStock.length === 0 && (
                  <p className="py-10 text-center text-xs" style={{ color: "#aaa" }}>안전재고 미달 품목이 없습니다.</p>
              )}
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

        {/* 12.3 최근 주문 / 납품 현황 */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #E5EAF0" }}>
            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>최근 주문 / 납품 현황</p>
            <button onClick={() => onNavigate("orders")} className="text-xs font-medium" style={{ color: "#0B3D91" }}>
              전체보기 →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC" }}>
                {["주문번호", "거래처", "주문 상태", "납품 상태", "금액", "등록일"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {orders.map((o, i) => {
                const orderTone = ORDER_STATUS_TONES[o.order_status]
                return (
                    <tr
                        key={o.order_id}
                        style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td className="px-6 py-4" style={{ color: "#666", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>{o.order_number}</td>
                      <td className="px-6 py-4 font-medium text-sm" style={{ color: "#333" }}>{o.partner_name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: orderTone.bg, color: orderTone.color }}>
                          {ORDER_STATUS_LABELS[o.order_status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {o.delivery_status ? (
                            <span
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={DELIVERY_STATUS_TONES[o.delivery_status]}
                            >
                              {DELIVERY_STATUS_LABELS[o.delivery_status]}
                            </span>
                        ) : (
                            <span className="text-xs" style={{ color: "#bbb" }}>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(o.total_amount)}</td>
                      <td className="px-6 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDate(o.created_at)}</td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  )
}
