import { useState } from "react"
import { CATEGORIES, CATEGORY_COLORS } from "../data/products"

interface SaleRecord {
    id: number
    saleId: string
    orderId: string
    customer: string
    customerType: "약국" | "병원" | "도매상"
    productName: string
    category: string
    qty: number
    unitPrice: number
    unitCost: number
    revenue: number
    cost: number
    margin: number
    marginRate: number
    date: string
}

const INITIAL_SALES: SaleRecord[] = [
    {
        id: 1,
        saleId: "SAL-0901",
        orderId: "ORD-0821",
        customer: "새봄약국",
        customerType: "약국",
        productName: "페인제로정 500mg",
        category: "신경계 및 정신/행동장애",
        qty: 200,
        unitPrice: 3200,
        unitCost: 2100,
        revenue: 640000,
        cost: 420000,
        margin: 220000,
        marginRate: 34.4,
        date: "2026-09-04",
    },
    {
        id: 2,
        saleId: "SAL-0902",
        orderId: "ORD-0822",
        customer: "한빛대학병원",
        customerType: "병원",
        productName: "이지케어이브연질캡슐",
        category: "신경계 및 정신/행동장애",
        qty: 150,
        unitPrice: 4500,
        unitCost: 3200,
        revenue: 675000,
        cost: 480000,
        margin: 195000,
        marginRate: 28.9,
        date: "2026-09-06",
    },
    {
        id: 3,
        saleId: "SAL-0903",
        orderId: "ORD-0828",
        customer: "다온메디유통",
        customerType: "도매상",
        productName: "다이제온정",
        category: "소화기계 및 순환기계",
        qty: 400,
        unitPrice: 5100,
        unitCost: 3600,
        revenue: 2040000,
        cost: 1440000,
        margin: 600000,
        marginRate: 29.4,
        date: "2026-09-08",
    },
    {
        id: 4,
        saleId: "SAL-0904",
        orderId: "ORD-0829",
        customer: "푸른길약국",
        customerType: "약국",
        productName: "에너지밸런스정",
        category: "호르몬 및 대사성 의약품",
        qty: 80,
        unitPrice: 8500,
        unitCost: 5800,
        revenue: 680000,
        cost: 464000,
        margin: 216000,
        marginRate: 31.8,
        date: "2026-09-09",
    },
    {
        id: 5,
        saleId: "SAL-0905",
        orderId: "ORD-0830",
        customer: "라온종합병원",
        customerType: "병원",
        productName: "위편한겔현탁액",
        category: "소화기계 및 순환기계",
        qty: 500,
        unitPrice: 2800,
        unitCost: 1800,
        revenue: 1400000,
        cost: 900000,
        margin: 500000,
        marginRate: 35.7,
        date: "2026-09-10",
    },
    {
        id: 6,
        saleId: "SAL-0906",
        orderId: "ORD-0831",
        customer: "다온메디유통",
        customerType: "도매상",
        productName: "알러쉴드정",
        category: "감염성질환 및 호흡기계",
        qty: 300,
        unitPrice: 3800,
        unitCost: 2600,
        revenue: 1140000,
        cost: 780000,
        margin: 360000,
        marginRate: 31.6,
        date: "2026-09-12",
    },
    {
        id: 7,
        saleId: "SAL-0907",
        orderId: "ORD-0832",
        customer: "별하약국",
        customerType: "약국",
        productName: "마그온맥스연질캡슐",
        category: "호르몬 및 대사성 의약품",
        qty: 60,
        unitPrice: 10200,
        unitCost: 7200,
        revenue: 612000,
        cost: 432000,
        margin: 180000,
        marginRate: 29.4,
        date: "2026-09-14",
    },
    {
        id: 8,
        saleId: "SAL-0908",
        orderId: "ORD-0833",
        customer: "수원온병원",
        customerType: "병원",
        productName: "스킨가드연고",
        category: "기타",
        qty: 120,
        unitPrice: 6200,
        unitCost: 4400,
        revenue: 744000,
        cost: 528000,
        margin: 216000,
        marginRate: 29.0,
        date: "2026-09-16",
    },
    {
        id: 9,
        saleId: "SAL-0909",
        orderId: "ORD-0834",
        customer: "새봄약국",
        customerType: "약국",
        productName: "노즈프리쿨스프레이",
        category: "감염성질환 및 호흡기계",
        qty: 100,
        unitPrice: 3900,
        unitCost: 2900,
        revenue: 390000,
        cost: 290000,
        margin: 100000,
        marginRate: 25.6,
        date: "2026-09-18",
    },
    {
        id: 10,
        saleId: "SAL-0910",
        orderId: "ORD-0835",
        customer: "다온메디유통",
        customerType: "도매상",
        productName: "브레스뮤코캡슐 200mg",
        category: "감염성질환 및 호흡기계",
        qty: 250,
        unitPrice: 2900,
        unitCost: 1950,
        revenue: 725000,
        cost: 487500,
        margin: 237500,
        marginRate: 32.8,
        date: "2026-09-20",
    },
]

export default function SalesPage() {
    const [sales, _setSales] = useState<SaleRecord[]>(INITIAL_SALES)
    const [catFilter, setCatFilter] = useState("전체")
    const [search, setSearch] = useState("")
    const [detailItem, setDetailItem] = useState<SaleRecord | null>(null)
    const [sortKey, setSortKey] =
        useState<"date" | "revenue" | "margin" | "marginRate">("date")

    const filtered = sales
        .filter((s) => {
            const matchCat = catFilter === "전체" || s.category === catFilter
            const matchSearch =
                s.customer.includes(search) ||
                s.productName.includes(search) ||
                s.saleId.includes(search)
            return matchCat && matchSearch
        })
        .sort((a, b) => {
            if (sortKey === "date") return b.date.localeCompare(a.date)
            return b[sortKey] - a[sortKey]
        })

    const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0)
    const totalMargin = filtered.reduce((s, r) => s + r.margin, 0)
    const avgMarginRate = filtered.length
        ? filtered.reduce((s, r) => s + r.marginRate, 0) / filtered.length
        : 0

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
                    매출 관리
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#888" }}>
                    거래건별 매출 현황 및 마진 조회
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    {
                        label: "총 매출건수",
                        value: `${filtered.length}건`,
                        color: "#0B3D91",
                    },
                    {
                        label: "매출 합계",
                        value: `₩${(totalRevenue / 10000).toFixed(0)}만`,
                        color: "#1D4ED8",
                    },
                    {
                        label: "마진 합계",
                        value: `₩${(totalMargin / 10000).toFixed(0)}만`,
                        color: "#059669",
                    },
                    {
                        label: "평균 마진율",
                        value: `${avgMarginRate.toFixed(1)}%`,
                        color: "#9A3412",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="bg-white px-4 py-4"
                        style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}
                    >
                        <p className="text-xs" style={{ color: "#999" }}>
                            {s.label}
                        </p>
                        <p
                            className="text-xl font-bold mt-1"
                            style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}
                        >
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCatFilter("전체")}
                        className="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
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
                                className="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
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
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#aaa"
                        strokeWidth="2"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="거래처, 의약품명, 매출번호 검색..."
                        className="pl-8 pr-3 py-1.5 text-sm outline-none"
                        style={{
                            border: "1px solid #E5EAF0",
                            borderRadius: 7,
                            background: "white",
                            minWidth: 240,
                        }}
                    />
                </div>
                {/* Sort */}
                <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                    className="text-xs px-2.5 py-1.5 outline-none"
                    style={{
                        border: "1px solid #E5EAF0",
                        borderRadius: 7,
                        background: "white",
                        color: "#555",
                    }}
                >
                    <option value="date">최신순</option>
                    <option value="revenue">매출 높은순</option>
                    <option value="margin">마진 높은순</option>
                    <option value="marginRate">마진율 높은순</option>
                </select>
            </div>

            {/* Table */}
            <div
                className="bg-white overflow-hidden"
                style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr
                            style={{
                                background: "#FAFAFA",
                                borderBottom: "1px solid #F0F0F0",
                            }}
                        >
                            {[
                                "매출번호",
                                "주문번호",
                                "거래처",
                                "의약품",
                                "카테고리",
                                "수량",
                                "매출금액",
                                "매입원가",
                                "마진",
                                "마진율",
                                "납품일",
                                "",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left font-medium"
                                    style={{
                                        color: "#aaa",
                                        fontSize: 11,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((s, i) => {
                            const catColor =
                                CATEGORY_COLORS[(s.category as keyof typeof CATEGORY_COLORS)]
                            const isHighMargin = s.marginRate >= 33
                            return (
                                <tr
                                    key={s.id}
                                    style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "#FAFAFA")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "white")
                                    }
                                >
                                    <td
                                        className="px-4 py-3 text-xs font-medium"
                                        style={{
                                            color: "#0B3D91",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        <button
                                            onClick={() => setDetailItem(s)}
                                            className="hover:underline"
                                        >
                                            {s.saleId}
                                        </button>
                                    </td>
                                    <td
                                        className="px-4 py-3 text-xs"
                                        style={{
                                            color: "#bbb",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {s.orderId}
                                    </td>
                                    <td
                                        className="px-4 py-3 font-medium"
                                        style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}
                                    >
                                        {s.customer}
                                        <span className="ml-1 text-xs" style={{ color: "#bbb" }}>
                        {s.customerType}
                      </span>
                                    </td>
                                    <td
                                        className="px-4 py-3 text-sm"
                                        style={{ color: "#333", whiteSpace: "nowrap" }}
                                    >
                                        {s.productName}
                                    </td>
                                    <td className="px-4 py-3">
                                        {catColor && (
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: catColor.bg,
                                                    color: catColor.color,
                                                }}
                                            >
                          {s.category}
                        </span>
                                        )}
                                    </td>
                                    <td
                                        className="px-4 py-3 text-sm"
                                        style={{
                                            color: "#555",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {s.qty.toLocaleString()}
                                    </td>
                                    <td
                                        className="px-4 py-3 text-sm font-semibold"
                                        style={{
                                            color: "#1a1a1a",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        ₩{s.revenue.toLocaleString()}
                                    </td>
                                    <td
                                        className="px-4 py-3 text-sm"
                                        style={{
                                            color: "#888",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        ₩{s.cost.toLocaleString()}
                                    </td>
                                    <td
                                        className="px-4 py-3 text-sm font-medium"
                                        style={{
                                            color: "#059669",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        ₩{s.margin.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                      <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                              background: isHighMargin ? "#F0FDF4" : "#FFF7ED",
                              color: isHighMargin ? "#166534" : "#C2410C",
                          }}
                      >
                        {s.marginRate.toFixed(1)}%
                      </span>
                                    </td>
                                    <td
                                        className="px-4 py-3 text-xs"
                                        style={{
                                            color: "#999",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {s.date}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setDetailItem(s)}
                                            className="text-xs font-medium"
                                            style={{ color: "#0B3D91" }}
                                        >
                                            상세
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                        <tfoot>
                        <tr
                            style={{
                                background: "#F7F9FC",
                                borderTop: "2px solid #E5EAF0",
                            }}
                        >
                            <td
                                colSpan={6}
                                className="px-4 py-3 text-xs font-semibold"
                                style={{ color: "#666" }}
                            >
                                합계 ({filtered.length}건)
                            </td>
                            <td
                                className="px-4 py-3 text-sm font-bold"
                                style={{
                                    color: "#0B3D91",
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                ₩{totalRevenue.toLocaleString()}
                            </td>
                            <td
                                className="px-4 py-3 text-sm font-bold"
                                style={{ color: "#888", fontFamily: "'Inter', sans-serif" }}
                            >
                                ₩{filtered.reduce((s, r) => s + r.cost, 0).toLocaleString()}
                            </td>
                            <td
                                className="px-4 py-3 text-sm font-bold"
                                style={{
                                    color: "#059669",
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                ₩{totalMargin.toLocaleString()}
                            </td>
                            <td
                                className="px-4 py-3 text-sm font-bold"
                                style={{ color: "#333" }}
                            >
                                {avgMarginRate.toFixed(1)}%
                            </td>
                            <td colSpan={2} />
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {detailItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                    onClick={() => setDetailItem(null)}
                >
                    <div
                        className="bg-white w-full max-w-md p-8 relative"
                        style={{ borderRadius: 12 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setDetailItem(null)}
                            className="absolute top-5 right-5 opacity-40 hover:opacity-100"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#333"
                                strokeWidth="2"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h3
                            className="font-semibold text-lg mb-1"
                            style={{ color: "#1a1a1a" }}
                        >
                            매출 상세 · 마진
                        </h3>
                        <p
                            className="text-xs mb-5"
                            style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}
                        >
                            {detailItem.saleId} / {detailItem.orderId}
                        </p>

                        <div className="space-y-3 mb-5">
                            {[
                                {
                                    label: "거래처",
                                    value: `${detailItem.customer} (${detailItem.customerType})`,
                                },
                                { label: "의약품", value: detailItem.productName },
                                { label: "카테고리", value: detailItem.category },
                                {
                                    label: "수량",
                                    value: `${detailItem.qty.toLocaleString()}개`,
                                },
                                {
                                    label: "판매단가",
                                    value: `₩${detailItem.unitPrice.toLocaleString()}`,
                                },
                                {
                                    label: "원가(단가)",
                                    value: `₩${detailItem.unitCost.toLocaleString()}`,
                                },
                            ].map((row) => (
                                <div key={row.label} className="flex">
                  <span
                      className="w-28 shrink-0 text-xs font-medium"
                      style={{ color: "#999" }}
                  >
                    {row.label}
                  </span>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: "#1a1a1a" }}
                                    >
                    {row.value}
                  </span>
                                </div>
                            ))}
                        </div>

                        {/* Margin breakdown */}
                        <div
                            className="p-4 rounded-lg space-y-2"
                            style={{ background: "#F7F9FC" }}
                        >
                            <p
                                className="text-xs font-semibold mb-3"
                                style={{ color: "#666" }}
                            >
                                마진 분석
                            </p>
                            {[
                                {
                                    label: "매출금액",
                                    value: `₩${detailItem.revenue.toLocaleString()}`,
                                    color: "#0B3D91",
                                },
                                {
                                    label: "매입원가",
                                    value: `₩${detailItem.cost.toLocaleString()}`,
                                    color: "#888",
                                },
                                {
                                    label: "마진",
                                    value: `₩${detailItem.margin.toLocaleString()}`,
                                    color: "#059669",
                                },
                                {
                                    label: "마진율",
                                    value: `${detailItem.marginRate.toFixed(1)}%`,
                                    color: detailItem.marginRate >= 33 ? "#059669" : "#C2410C",
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex justify-between items-center"
                                >
                  <span className="text-xs" style={{ color: "#888" }}>
                    {row.label}
                  </span>
                                    <span
                                        className="text-sm font-bold"
                                        style={{
                                            color: row.color,
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                    {row.value}
                  </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-5">
                            <button
                                onClick={() => setDetailItem(null)}
                                className="px-5 py-2 text-sm font-medium"
                                style={{
                                    border: "1px solid #E5EAF0",
                                    borderRadius: 7,
                                    color: "#666",
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
