import { useState } from "react"
import { PRODUCTS, CATEGORY_COLORS } from "../data/products"
import type { AuthUser } from "../App"

interface DeliveryItem {
    id: number
    orderId: string
    partner: string
    partnerType: "약국" | "병원" | "도매상"
    productCode: string
    productName: string
    category: string
    qty: number
    unitPrice: number
    status: "출고대기" | "출고완료" | "납품완료"
    orderDate: string
    shipDate?: string
    completeDate?: string
}

const INITIAL_DELIVERIES: DeliveryItem[] = [
    { id: 1, orderId: "ORD-0821", partner: "행복약국", partnerType: "약국", productCode: "IT_MED_0001", productName: "타이레놀정 500mg", category: "일반의약품", qty: 200, unitPrice: 3200, status: "납품완료", orderDate: "2026-09-01", shipDate: "2026-09-03", completeDate: "2026-09-04" },
    { id: 2, orderId: "ORD-0822", partner: "미래병원", partnerType: "병원", productCode: "IT_ANT_0001", productName: "아목시실린캡슐 250mg", category: "항생제", qty: 150, unitPrice: 4500, status: "납품완료", orderDate: "2026-09-03", shipDate: "2026-09-05", completeDate: "2026-09-06" },
    { id: 3, orderId: "ORD-0823", partner: "서울중앙병원", partnerType: "병원", productCode: "IT_CAR_0001", productName: "아스피린장용정 100mg", category: "심혈관계", qty: 300, unitPrice: 2800, status: "출고완료", orderDate: "2026-09-08", shipDate: "2026-09-10" },
    { id: 4, orderId: "ORD-0824", partner: "그린약국", partnerType: "약국", productCode: "IT_VIT_0001", productName: "비타민C 1000mg", category: "건강기능식품", qty: 100, unitPrice: 8500, status: "출고완료", orderDate: "2026-09-10", shipDate: "2026-09-12" },
    { id: 5, orderId: "ORD-0825", partner: "한국도매", partnerType: "도매상", productCode: "IT_ALL_0001", productName: "지르텍정 10mg", category: "알러지·호흡기", qty: 500, unitPrice: 3800, status: "출고대기", orderDate: "2026-09-15" },
    { id: 6, orderId: "ORD-0826", partner: "강남약국", partnerType: "약국", productCode: "IT_MED_0002", productName: "부루펜정 400mg", category: "일반의약품", qty: 120, unitPrice: 2900, status: "출고대기", orderDate: "2026-09-16" },
    { id: 7, orderId: "ORD-0827", partner: "동화의원", partnerType: "병원", productCode: "IT_ANT_0002", productName: "세파클러캡슐 250mg", category: "항생제", qty: 80, unitPrice: 6200, status: "출고대기", orderDate: "2026-09-18" },
    { id: 8, orderId: "ORD-0828", partner: "메디팜도매", partnerType: "도매상", productCode: "IT_CAR_0002", productName: "로수바스타틴정 10mg", category: "심혈관계", qty: 400, unitPrice: 5100, status: "납품완료", orderDate: "2026-09-05", shipDate: "2026-09-07", completeDate: "2026-09-08" },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    "출고대기": { bg: "#FFF7ED", color: "#C2410C" },
    "출고완료": { bg: "#EFF6FF", color: "#1D4ED8" },
    "납품완료": { bg: "#F0FDF4", color: "#166534" },
}

interface Props { user: AuthUser }

export default function DeliveryPage({ user }: Props) {
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>(INITIAL_DELIVERIES)
    const [statusFilter, setStatusFilter] = useState("전체")
    const [search, setSearch] = useState("")
    const [detailItem, setDetailItem] = useState<DeliveryItem | null>(null)

    const filtered = deliveries.filter((d) => {
        const matchStatus = statusFilter === "전체" || d.status === statusFilter
        const matchSearch =
            d.partner.includes(search) ||
            d.productName.includes(search) ||
            d.orderId.includes(search)
        return matchStatus && matchSearch
    })

    const canShip = user.role === "admin" || user.role === "warehouse"

    const advanceStatus = (id: number) => {
        setDeliveries((prev) =>
            prev.map((d) => {
                if (d.id !== id) return d
                if (d.status === "출고대기") return { ...d, status: "출고완료", shipDate: new Date().toISOString().slice(0, 10) }
                if (d.status === "출고완료") return { ...d, status: "납품완료", completeDate: new Date().toISOString().slice(0, 10) }
                return d
            })
        )
    }

    const statusCounts = {
        "출고대기": deliveries.filter((d) => d.status === "출고대기").length,
        "출고완료": deliveries.filter((d) => d.status === "출고완료").length,
        "납품완료": deliveries.filter((d) => d.status === "납품완료").length,
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>납품 관리</h2>
                    <p className="text-sm mt-0.5" style={{ color: "#888" }}>출고 처리 · 납품 완료 · 납품서 발행 관리</p>
                </div>
            </div>

            {/* Status KPI cards */}
            <div className="grid grid-cols-3 gap-3">
                {(["출고대기", "출고완료", "납품완료"] as const).map((s) => {
                    const sty = STATUS_STYLE[s]
                    return (
                        <div key={s} className="bg-white px-5 py-4 flex items-center gap-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                            <div className="flex-1">
                                <p className="text-xs" style={{ color: "#999" }}>{s}</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: sty.color, fontFamily: "'Inter', sans-serif" }}>{statusCounts[s]}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ background: sty.bg }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sty.color} strokeWidth="1.8">
                                    <path d="M16 16v-4a2 2 0 00-2-2H8.5L6 8H3M6 16a2 2 0 100 4 2 2 0 000-4zM18 16a2 2 0 100 4 2 2 0 000-4zM6 8l2 8h12" />
                                </svg>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2">
                    {["전체", "출고대기", "출고완료", "납품완료"].map((s) => {
                        const sty = s !== "전체" ? STATUS_STYLE[s] : null
                        const active = statusFilter === s
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
                                style={{
                                    background: active ? (sty?.color ?? "#0B3D91") : "#F0F2F5",
                                    color: active ? "white" : "#666",
                                }}
                            >
                                {s}
                            </button>
                        )
                    })}
                </div>
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="거래처, 제품명, 주문번호 검색..."
                        className="pl-8 pr-3 py-1.5 text-sm outline-none"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white", minWidth: 230 }}
                    />
                </div>
                <span className="text-xs" style={{ color: "#999" }}>{filtered.length}건</span>
            </div>

            {/* Table */}
            <div className="bg-white overflow-hidden" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                            {["주문번호", "거래처", "의약품", "카테고리", "수량", "금액", "주문일", "상태", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((d, i) => {
                            const sty = STATUS_STYLE[d.status]
                            const catColor = CATEGORY_COLORS[d.category as keyof typeof CATEGORY_COLORS]
                            return (
                                <tr
                                    key={d.id}
                                    style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                >
                                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>
                                        <button onClick={() => setDetailItem(d)} className="hover:underline">{d.orderId}</button>
                                    </td>
                                    <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>
                                        {d.partner}
                                        <span className="ml-1.5 text-xs" style={{ color: "#bbb" }}>{d.partnerType}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "#333", whiteSpace: "nowrap" }}>{d.productName}</td>
                                    <td className="px-4 py-3">
                                        {catColor && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: catColor.bg, color: catColor.color }}>
                          {d.category}
                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{d.qty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>
                                        ₩{(d.qty * d.unitPrice).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{d.orderDate}</td>
                                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: sty.bg, color: sty.color }}>
                        {d.status}
                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 items-center">
                                            {canShip && d.status !== "납품완료" && (
                                                <button
                                                    onClick={() => advanceStatus(d.id)}
                                                    className="text-xs font-medium px-2.5 py-1 rounded-md transition-colors"
                                                    style={{ background: d.status === "출고대기" ? "#EFF6FF" : "#F0FDF4", color: d.status === "출고대기" ? "#1D4ED8" : "#166534" }}
                                                >
                                                    {d.status === "출고대기" ? "출고 처리" : "납품 완료"}
                                                </button>
                                            )}
                                            {d.status === "납품완료" && (
                                                <button
                                                    onClick={() => setDetailItem(d)}
                                                    className="text-xs font-medium px-2.5 py-1 rounded-md"
                                                    style={{ background: "#F5F5F5", color: "#666" }}
                                                >
                                                    납품서
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
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
                        className="bg-white w-full max-w-lg p-8 relative"
                        style={{ borderRadius: 12 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setDetailItem(null)} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Slip header */}
                        <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "2px solid #0B3D91" }}>
                            <div>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11, color: "#0B3D91", letterSpacing: "0.12em" }}>PHARMLINK</p>
                                <h3 className="font-bold text-xl" style={{ color: "#1a1a1a" }}>납품확인서</h3>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-xs" style={{ color: "#999" }}>주문번호</p>
                                <p className="font-bold text-sm" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>{detailItem.orderId}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm mb-6">
                            {[
                                { label: "수신처", value: detailItem.partner },
                                { label: "의약품", value: detailItem.productName },
                                { label: "카테고리", value: detailItem.category },
                                { label: "수량", value: `${detailItem.qty.toLocaleString()} 개` },
                                { label: "단가", value: `₩${detailItem.unitPrice.toLocaleString()}` },
                                { label: "합계금액", value: `₩${(detailItem.qty * detailItem.unitPrice).toLocaleString()}` },
                                { label: "주문일", value: detailItem.orderDate },
                                { label: "출고일", value: detailItem.shipDate ?? "—" },
                                { label: "납품완료일", value: detailItem.completeDate ?? "—" },
                            ].map((row) => (
                                <div key={row.label} className="flex">
                                    <span className="w-28 shrink-0 text-xs font-medium" style={{ color: "#999" }}>{row.label}</span>
                                    <span className="font-medium" style={{ color: "#1a1a1a" }}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDetailItem(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                            <button className="px-5 py-2 text-sm font-medium flex items-center gap-2" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                PDF 출력
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
