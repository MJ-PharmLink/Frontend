import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { errorMessage, salesApi } from "../api"
// 상품 목록 API(6.1)가 생기기 전까지 안내 문구의 등록 상품 수는 샘플 상품 수를 쓴다
import { ITEMS } from "../data/sample"
import { firstDayOfMonthKst, formatDate, formatMoney, formatRate, todayKst } from "../lib/domain"
import { MARGIN_GROUP_BY } from "../types/api"
import type { MarginAmounts, MarginGroupBy, MarginItemGroup, MarginPartnerGroup } from "../types/api"

/**
 * 11.3 마진 집계 — 관리자·영업 전용.
 *
 * start_date / end_date 는 필수이고, group_by 를 주면 거래처별 또는 상품별로
 * 묶어서 돌려준다. 집계 마진율은 건별 마진율의 평균이 아니라
 * SUM(margin) / SUM(sales) × 100 으로 계산한다(3.16).
 */

const EMPTY_AMOUNTS: MarginAmounts = { sales_amount: 0, cost_amount: 0, margin_amount: 0, margin_rate: 0 }

const BAR_COLORS = ["#0B3D91", "#1677FF", "#059669", "#7C3AED", "#C2410C", "#0891B2", "#BE185D"]

export default function MarginPage() {
  const [startDate, setStartDate] = useState(firstDayOfMonthKst())
  const [endDate, setEndDate] = useState(todayKst())
  const [groupBy, setGroupBy] = useState<MarginGroupBy>("PARTNER")

  const invalidRange = startDate > endDate

  const [fetchedSummary, setSummary] = useState<MarginAmounts>(EMPTY_AMOUNTS)
  const [fetchedGroups, setGroups] = useState<(MarginPartnerGroup | MarginItemGroup)[]>([])
  const [fetchedSaleCount, setSaleCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * 11.3 마진 집계 (summary + group_by별 groups, 서버가 마진 큰 순으로 정렬) 와
   * 같은 기간의 매출 건수(11.1 목록의 total_count)를 함께 받는다
   */
  useEffect(() => {
    if (invalidRange) return
    let cancelled = false
    setError(null)
    // 새 조건의 응답이 오기 전에 이전 집계가 남아 보이지 않도록 비운다
    setSummary(EMPTY_AMOUNTS)
    setGroups([])
    setSaleCount(0)
    Promise.all([
      salesApi.margins({ start_date: startDate, end_date: endDate, group_by: groupBy }),
      salesApi.list({ start_date: startDate, end_date: endDate, page: 1, page_size: 1 }),
    ])
      .then(([margins, sales]) => {
        if (cancelled) return
        setSummary(margins.summary)
        setGroups(margins.groups ?? [])
        setSaleCount(sales.pagination.total_count)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "마진 집계를 불러오지 못했습니다."))
      })
    return () => {
      cancelled = true
    }
  }, [startDate, endDate, groupBy, invalidRange])

  // 기간이 잘못되면 서버에 묻지 않고 빈 집계를 보여 준다
  const summary = invalidRange ? EMPTY_AMOUNTS : fetchedSummary
  const groups = invalidRange ? [] : fetchedGroups
  const saleCount = invalidRange ? 0 : fetchedSaleCount

  const labelOf = (g: MarginPartnerGroup | MarginItemGroup) =>
    "partner_name" in g ? g.partner_name : g.item_name

  const chartData = groups.slice(0, 8).map((g) => ({
    name: labelOf(g).length > 8 ? `${labelOf(g).slice(0, 8)}…` : labelOf(g),
    full: labelOf(g),
    sales: g.sales_amount,
    margin: g.margin_amount,
    rate: g.margin_rate,
  }))

  const compact = (n: number) =>
    n >= 100_000_000 ? `${(n / 100_000_000).toFixed(1)}억` : n >= 10_000 ? `${Math.round(n / 10_000)}만` : `${n}`

  return (
      <div className="space-y-5">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>마진 분석</h2>
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>
            기간별 전체 마진과 거래처별·상품별 마진 집계 · 매출일(sale_date) 기준
          </p>
        </div>

        {/* 기간 · 집계 기준 */}
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 text-xs outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }} />
          <span className="text-xs" style={{ color: "#999" }}>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 text-xs outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }} />

          <div className="ml-4 flex gap-1 p-1 rounded-lg" style={{ background: "#F0F2F5" }}>
            {MARGIN_GROUP_BY.map((g) => (
                <button
                    key={g}
                    onClick={() => setGroupBy(g)}
                    className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                    style={{
                      background: groupBy === g ? "white" : "transparent",
                      color: groupBy === g ? "#0B3D91" : "#888",
                      boxShadow: groupBy === g ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                >
                  {g === "PARTNER" ? "거래처별" : "상품별"}
                </button>
            ))}
          </div>

          <span className="ml-auto text-xs" style={{ color: "#999" }}>
            {formatDate(startDate)} ~ {formatDate(endDate)} · 매출 {saleCount}건
          </span>
        </div>

        {error && !invalidRange && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              {error}
            </p>
        )}

        {invalidRange && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              시작일이 종료일보다 늦습니다. 기간을 다시 선택해 주세요.
            </p>
        )}

        {/* 전체 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "매출액", value: formatMoney(summary.sales_amount), color: "#0B3D91" },
            { label: "매출원가", value: formatMoney(summary.cost_amount), color: "#1677FF" },
            { label: "마진", value: formatMoney(summary.margin_amount), color: "#059669" },
            { label: "마진율", value: formatRate(summary.margin_rate), color: "#C2410C" },
          ].map((s) => (
              <div key={s.label} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
              </div>
          ))}
        </div>

        {/* 집계 차트 */}
        {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>
                  {groupBy === "PARTNER" ? "거래처별" : "상품별"} 매출 / 마진
                </p>
                <p className="text-xs mb-5" style={{ color: "#999" }}>마진 상위 {chartData.length}개</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(v) => compact(Number(v))} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                    <Tooltip
                        formatter={(value, name) => [formatMoney(Number(value ?? 0)), name === "sales" ? "매출" : "마진"]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                        contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5EAF0" }}
                    />
                    <Bar dataKey="sales" name="sales" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="margin" name="margin" fill="#0B3D91" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>마진율 비교</p>
                <p className="text-xs mb-5" style={{ color: "#999" }}>SUM(마진) ÷ SUM(매출) × 100</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#666" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                        formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, "마진율"]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                        contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5EAF0" }}
                    />
                    <Bar dataKey="rate" radius={[0, 3, 3, 0]}>
                      {chartData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        )}

        {/* 집계 표 */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {[groupBy === "PARTNER" ? "거래처" : "상품", "매출액", "매출원가", "마진", "마진율", "비중"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {groups.map((g, i) => {
                const share = summary.margin_amount === 0 ? 0 : (g.margin_amount / summary.margin_amount) * 100
                const key = "partner_id" in g ? `p${g.partner_id}` : `i${g.item_id}`
                return (
                    <tr key={key} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-5 py-4">
                        <p className="font-medium" style={{ color: "#1a1a1a" }}>{labelOf(g)}</p>
                        {"item_code" in g && <p className="font-mono text-xs" style={{ color: "#aaa" }}>{g.item_code}</p>}
                      </td>
                      <td className="px-5 py-4" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(g.sales_amount)}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>{formatMoney(g.cost_amount)}</td>
                      <td className="px-5 py-4 font-medium" style={{ color: "#059669", fontFamily: "'Inter', sans-serif" }}>{formatMoney(g.margin_amount)}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#047857" }}>
                          {formatRate(g.margin_rate)}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ minWidth: 140 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "#F3F4F6" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(share, 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                          </div>
                          <span className="text-xs shrink-0" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
          {groups.length === 0 && (
              <div className="py-14 text-center text-sm" style={{ color: "#999" }}>
                해당 기간에 집계할 매출이 없습니다. 매출은 납품 완료 시 생성됩니다.
              </div>
          )}
        </div>

        <p className="text-xs" style={{ color: "#aaa" }}>
          상품별 집계는 매출에 연결된 주문 라인의 스냅샷 단가로 계산합니다. 등록된 상품 {ITEMS.length}개 중 해당 기간에 판매된 품목만 표시됩니다.
        </p>
      </div>
  )
}
