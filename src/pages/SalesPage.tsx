import { useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CUSTOMERS, SALES } from "../data/sample"
import { formatDate, formatMoney, formatNumber, formatRate } from "../lib/domain"
import type { SaleDetail } from "../types/api"

/**
 * 11.1 ~ 11.2 매출 — 관리자·영업 전용.
 *
 * 매출은 납품 완료(9.4) 시점에만 자동으로 생성되며 직접 등록·수정하는 API는
 * 없다. 매출·원가·마진은 모두 주문 시점 스냅샷 단가로 계산되므로 이후 상품
 * 마스터 단가가 바뀌어도 변하지 않는다.
 */

export default function SalesPage() {
  const [partnerFilter, setPartnerFilter] = useState<number | "전체">("전체")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [detail, setDetail] = useState<SaleDetail | null>(null)

  const filtered = SALES.filter((s) => {
    const matchPartner = partnerFilter === "전체" || s.partner_id === partnerFilter
    const matchStart = startDate === "" || s.sale_date >= startDate
    const matchEnd = endDate === "" || s.sale_date <= endDate
    return matchPartner && matchStart && matchEnd
  }).sort((a, b) => b.sale_date.localeCompare(a.sale_date) || b.sale_id - a.sale_id)

  const totals = filtered.reduce(
    (acc, s) => ({
      sales: acc.sales + s.sales_amount,
      cost: acc.cost + s.cost_amount,
      margin: acc.margin + s.margin_amount,
    }),
    { sales: 0, cost: 0, margin: 0 },
  )
  // 집계 마진율은 합계 기준으로 다시 계산한다 (건별 마진율의 평균이 아니다)
  const totalRate = totals.sales === 0 ? 0 : (totals.margin / totals.sales) * 100

  /** 일자별 매출·마진 추이 */
  const byDate = Object.values(
    filtered.reduce<Record<string, { date: string; sales: number; margin: number }>>((acc, s) => {
      acc[s.sale_date] ??= { date: s.sale_date.slice(5).replace("-", "/"), sales: 0, margin: 0 }
      acc[s.sale_date].sales += s.sales_amount
      acc[s.sale_date].margin += s.margin_amount
      return acc
    }, {}),
  ).reverse()

  const compact = (n: number) =>
    n >= 100_000_000 ? `${(n / 100_000_000).toFixed(1)}억` : n >= 10_000 ? `${Math.round(n / 10_000)}만` : `${n}`

  return (
      <div className="space-y-5">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>매출 관리</h2>
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>
            납품 완료된 주문에서 자동 생성된 매출 기록입니다 · 직접 등록·수정할 수 없습니다
          </p>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "매출액", value: formatMoney(totals.sales), color: "#0B3D91" },
            { label: "매출원가", value: formatMoney(totals.cost), color: "#1677FF" },
            { label: "마진", value: formatMoney(totals.margin), color: "#059669" },
            { label: "마진율", value: formatRate(totalRate), color: "#C2410C" },
          ].map((s) => (
              <div key={s.label} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
              </div>
          ))}
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value === "전체" ? "전체" : Number(e.target.value))}
              className="px-3 py-1.5 text-xs outline-none cursor-pointer"
              style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }}
          >
            <option value="전체">전체 거래처</option>
            {CUSTOMERS.map((p) => (
                <option key={p.partner_id} value={p.partner_id}>{p.name}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 text-xs outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }} />
          <span className="text-xs" style={{ color: "#999" }}>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 text-xs outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }} />
          {(startDate || endDate || partnerFilter !== "전체") && (
              <button onClick={() => { setStartDate(""); setEndDate(""); setPartnerFilter("전체") }} className="px-3 py-1.5 text-xs" style={{ color: "#0B3D91" }}>
                초기화
              </button>
          )}
          <span className="ml-auto text-xs" style={{ color: "#999" }}>{filtered.length}건</span>
        </div>

        {/* 일자별 추이 */}
        {byDate.length > 0 && (
            <div className="bg-white p-6" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>일자별 매출 / 마진</p>
              <p className="text-xs mb-5" style={{ color: "#999" }}>매출일(sale_date) 기준</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byDate} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => compact(Number(v))} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                  <Tooltip
                      formatter={(value, name) => [formatMoney(Number(value ?? 0)), name === "sales" ? "매출" : "마진"]}
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5EAF0" }}
                  />
                  <Bar dataKey="sales" name="sales" fill="#0B3D91" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="margin" name="margin" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        )}

        {/* 목록 */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["매출번호", "주문번호", "거래처", "매출액", "매출원가", "마진", "마진율", "매출일", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {filtered.map((s, i) => (
                  <tr
                      key={s.sale_id}
                      style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: "#666" }}>#{s.sale_id}</td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: "#666" }}>{s.order_number}</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#1a1a1a" }}>{s.partner_name}</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(s.sales_amount)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>{formatMoney(s.cost_amount)}</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#059669", fontFamily: "'Inter', sans-serif" }}>{formatMoney(s.margin_amount)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#047857" }}>
                        {formatRate(s.margin_rate)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDate(s.sale_date)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setDetail(s)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>상세</button>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
              <div className="py-14 text-center text-sm" style={{ color: "#999" }}>조건에 맞는 매출 기록이 없습니다.</div>
          )}
        </div>

        {/* 11.2 매출 상세 및 거래 건별 마진 */}
        {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetail(null)}>
              <div className="bg-white w-full max-w-3xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setDetail(null)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>매출 #{detail.sale_id}</h3>
                <p className="text-sm mt-1 mb-6" style={{ color: "#888" }}>
                  {detail.partner_name} · {detail.order_number} · 납품 #{detail.delivery_id} · {formatDate(detail.sale_date)}
                </p>

                <table className="w-full text-sm mb-5">
                  <thead>
                  <tr style={{ background: "#F7F9FC" }}>
                    {["상품", "수량", "판매단가", "원가", "매출", "원가합", "마진"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#888", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody>
                  {detail.items.map((item, i) => (
                      <tr key={item.item_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-3 py-2">
                          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{item.item_name}</p>
                          <p className="font-mono text-xs" style={{ color: "#aaa" }}>{item.item_code}</p>
                        </td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatNumber(item.quantity)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.unit_price)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.unit_cost)}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.sales_amount)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.cost_amount)}</td>
                        <td className="px-3 py-2 text-sm font-medium" style={{ color: "#059669", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.margin_amount)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-4 gap-3 pt-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                  {[
                    { label: "매출액", value: formatMoney(detail.sales_amount), color: "#0B3D91" },
                    { label: "매출원가", value: formatMoney(detail.cost_amount), color: "#777" },
                    { label: "마진", value: formatMoney(detail.margin_amount), color: "#059669" },
                    { label: "마진율", value: formatRate(detail.margin_rate), color: "#C2410C" },
                  ].map((s) => (
                      <div key={s.label} className="px-4 py-3" style={{ background: "#F7F9FC", borderRadius: 8 }}>
                        <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                        <p className="text-base font-bold mt-0.5" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
                      </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button onClick={() => setDetail(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
