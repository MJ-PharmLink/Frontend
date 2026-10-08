import { useState } from "react"
import { PRODUCTS, CATEGORIES, CATEGORY_COLORS } from "../data/products"

interface Purchase {
    id: number
    purchaseId: string
    supplier: string
    productCode: string
    productName: string
    category: string
    qty: number
    unitCost: number
    totalCost: number
    date: string
    registeredBy: string
}

const SUPPLIERS = [
    "아진바이오", "메디코어제약", "세움파마", "한결제약", "이노젠파마",
    "노바헬스코리아", "그린셀제약", "다온메디텍", "유니랩제약",
    "태성바이오", "웰니스팜",
]

const INITIAL_PURCHASES: Purchase[] = [
    { id: 1, purchaseId: "PUR-0901", supplier: "다온메디텍", productCode: "INF-001", productName: "클리어숨콜드캡슐", category: "감염성질환 및 호흡기계", qty: 1000, unitCost: 4200, totalCost: 4200000, date: "2026-09-01", registeredBy: "김관리자" },
    { id: 2, purchaseId: "PUR-0902", supplier: "세움파마", productCode: "INF-002", productName: "알러쉴드정", category: "감염성질환 및 호흡기계", qty: 500, unitCost: 5800, totalCost: 2900000, date: "2026-09-03", registeredBy: "이영업" },
    { id: 3, purchaseId: "PUR-0903", supplier: "메디코어제약", productCode: "DIG-001", productName: "다이제온정", category: "소화기계 및 순환기계", qty: 800, unitCost: 3400, totalCost: 2720000, date: "2026-09-05", registeredBy: "김관리자" },
    { id: 4, purchaseId: "PUR-0904", supplier: "태성바이오", productCode: "DIG-002", productName: "위편한겔현탁액", category: "소화기계 및 순환기계", qty: 600, unitCost: 4600, totalCost: 2760000, date: "2026-09-07", registeredBy: "이영업" },
    { id: 5, purchaseId: "PUR-0905", supplier: "메디코어제약", productCode: "NEU-001", productName: "페인제로정 500mg", category: "신경계 및 정신/행동장애", qty: 400, unitCost: 1800, totalCost: 720000, date: "2026-09-10", registeredBy: "김관리자" },
    { id: 6, purchaseId: "PUR-0906", supplier: "한결제약", productCode: "NEU-003", productName: "모션프리정", category: "신경계 및 정신/행동장애", qty: 700, unitCost: 3200, totalCost: 2240000, date: "2026-09-12", registeredBy: "이영업" },
    { id: 7, purchaseId: "PUR-0907", supplier: "한결제약", productCode: "HOR-001", productName: "에너지밸런스정", category: "호르몬 및 대사성 의약품", qty: 300, unitCost: 7200, totalCost: 2160000, date: "2026-09-15", registeredBy: "김관리자" },
    { id: 8, purchaseId: "PUR-0908", supplier: "웰니스팜", productCode: "HOR-002", productName: "마그온맥스연질캡슐", category: "호르몬 및 대사성 의약품", qty: 600, unitCost: 8400, totalCost: 5040000, date: "2026-09-18", registeredBy: "이영업" },
    { id: 9, purchaseId: "PUR-0909", supplier: "이노젠파마", productCode: "ETC-003", productName: "더마리페어연고", category: "기타", qty: 250, unitCost: 5800, totalCost: 1450000, date: "2026-09-20", registeredBy: "김관리자" },
    { id: 10, purchaseId: "PUR-0910", supplier: "노바헬스코리아", productCode: "ETC-002", productName: "풋클린크림 1%", category: "기타", qty: 450, unitCost: 6400, totalCost: 2880000, date: "2026-09-22", registeredBy: "이영업" },
]

const EMPTY_FORM = {
    supplier: SUPPLIERS[0],
    productCode: PRODUCTS[0].code,
    qty: "",
}

export default function PurchasePage() {
    const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES)
    const [catFilter, setCatFilter] = useState("전체")
    const [search, setSearch] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [detailItem, setDetailItem] = useState<Purchase | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [editForm, setEditForm] = useState({ supplier: "", productCode: "", qty: "", date: "" })

    const filtered = purchases.filter((p) => {
        const matchCat = catFilter === "전체" || p.category === catFilter
        const matchSearch =
            p.productName.includes(search) ||
            p.supplier.includes(search) ||
            p.purchaseId.includes(search)
        return matchCat && matchSearch
    })

    const totalAmount = filtered.reduce((sum, p) => sum + p.totalCost, 0)

    const handleRegister = () => {
        const product = PRODUCTS.find((p) => p.code === form.productCode)
        if (!product || !form.qty) return
        const qty = Number(form.qty)
        const newPurchase: Purchase = {
            id: Math.max(...purchases.map((p) => p.id)) + 1,
            purchaseId: `PUR-${String(Math.max(...purchases.map((p) => Number(p.purchaseId.split("-")[1]))) + 1).padStart(4, "0")}`,
            supplier: form.supplier,
            productCode: product.code,
            productName: product.name,
            category: product.category,
            qty,
            unitCost: product.costPrice,
            totalCost: qty * product.costPrice,
            date: new Date().toISOString().slice(0, 10),
            registeredBy: "김관리자",
        }
        setPurchases((prev) => [newPurchase, ...prev])
        setShowModal(false)
        setForm(EMPTY_FORM)
    }

    const selectedProduct = PRODUCTS.find((p) => p.code === form.productCode)
    const editProduct = PRODUCTS.find((p) => p.code === editForm.productCode)

    const openDetail = (purchase: Purchase) => {
        setDetailItem(purchase)
        setIsEditing(false)
    }

    const startEditing = () => {
        if (!detailItem) return
        setEditForm({
            supplier: detailItem.supplier,
            productCode: detailItem.productCode,
            qty: String(detailItem.qty),
            date: detailItem.date,
        })
        setIsEditing(true)
    }

    const handleUpdate = () => {
        if (!detailItem || !editProduct || !editForm.qty) return
        const qty = Number(editForm.qty)
        const updated: Purchase = {
            ...detailItem,
            supplier: editForm.supplier,
            productCode: editProduct.code,
            productName: editProduct.name,
            category: editProduct.category,
            qty,
            unitCost: editProduct.costPrice,
            totalCost: qty * editProduct.costPrice,
            date: editForm.date,
        }
        setPurchases((prev) => prev.map((purchase) => purchase.id === updated.id ? updated : purchase))
        setDetailItem(updated)
        setIsEditing(false)
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>매입 관리</h2>
                    <p className="text-sm mt-0.5" style={{ color: "#888" }}>공급처별 의약품 매입 기록 관리</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                    style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    매입 등록
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "총 매입건수", value: `${purchases.length}건`, color: "#0B3D91" },
                    { label: "조회 매입금액", value: `₩${(totalAmount / 10000).toFixed(0)}만`, color: "#1D4ED8" },
                    { label: "이번달 매입", value: `${purchases.filter((p) => p.date.startsWith("2026-09")).length}건`, color: "#059669" },
                    { label: "거래 공급처", value: `${new Set(purchases.map((p) => p.supplier)).size}개사`, color: "#9A3412" },
                ].map((s) => (
                    <div key={s.label} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                        <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                        <p className="text-xl font-bold mt-1" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Category chips + search */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCatFilter("전체")}
                        className="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
                        style={{ background: catFilter === "전체" ? "#0B3D91" : "#F0F2F5", color: catFilter === "전체" ? "white" : "#666" }}
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
                                style={{ background: active ? c.color : c.bg, color: active ? "white" : c.color, border: `1px solid ${active ? c.color : c.border}` }}
                            >
                                {cat}
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
                        placeholder="의약품명, 공급처, 매입번호 검색..."
                        className="pl-8 pr-3 py-1.5 text-sm outline-none"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white", minWidth: 240 }}
                    />
                </div>
                <span className="text-xs" style={{ color: "#999" }}>{filtered.length}건 / 합계 ₩{totalAmount.toLocaleString()}</span>
            </div>

            {/* Table */}
            <div className="bg-white overflow-hidden" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                            {["매입번호", "공급처", "의약품", "카테고리", "수량", "단가(원가)", "합계금액", "매입일", "등록자", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((p, i) => {
                            const catColor = CATEGORY_COLORS[p.category as keyof typeof CATEGORY_COLORS]
                            return (
                                <tr
                                    key={p.id}
                                    style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                >
                                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>
                                        <button onClick={() => openDetail(p)} className="hover:underline">{p.purchaseId}</button>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "#444" }}>{p.supplier}</td>
                                    <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a", whiteSpace: "nowrap" }}>{p.productName}</td>
                                    <td className="px-4 py-3">
                                        {catColor && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: catColor.bg, color: catColor.color }}>
                          {p.category}
                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{p.qty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "#777", fontFamily: "'Inter', sans-serif" }}>₩{p.unitCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>₩{p.totalCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{p.date}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "#888" }}>{p.registeredBy}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => openDetail(p)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>상세</button>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Register Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white w-full max-w-md p-8 relative"
                        style={{ borderRadius: 12 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>매입 등록</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>공급처</label>
                                <select
                                    value={form.supplier}
                                    onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white" }}
                                >
                                    {SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>의약품</label>
                                <select
                                    value={form.productCode}
                                    onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white" }}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <optgroup key={cat} label={cat}>
                                            {PRODUCTS.filter((p) => p.category === cat).map((p) => (
                                                <option key={p.code} value={p.code}>{p.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            {selectedProduct && (
                                <div className="px-3 py-2 text-xs" style={{ background: "#F7F9FC", borderRadius: 6, color: "#666" }}>
                                    원가(단가): <strong style={{ color: "#0B3D91" }}>₩{selectedProduct.costPrice.toLocaleString()}</strong>
                                    &nbsp;·&nbsp;카테고리: <strong>{selectedProduct.category}</strong>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>수량</label>
                                <input
                                    type="number"
                                    value={form.qty}
                                    onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                                    placeholder="수량 입력"
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6 }}
                                />
                            </div>
                            {selectedProduct && form.qty && (
                                <div className="px-3 py-2 text-sm font-semibold" style={{ background: "#EFF6FF", borderRadius: 6, color: "#1D4ED8" }}>
                                    예상 합계: ₩{(selectedProduct.costPrice * Number(form.qty)).toLocaleString()}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6 justify-end">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                            <button onClick={handleRegister} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>등록</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detailItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                    onClick={() => { setDetailItem(null); setIsEditing(false) }}
                >
                    <div
                        className="bg-white w-full max-w-md p-8 relative"
                        style={{ borderRadius: 12 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => { setDetailItem(null); setIsEditing(false) }} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h3 className="font-semibold text-lg mb-1" style={{ color: "#1a1a1a" }}>
                            {isEditing ? "매입 수정" : "매입 상세"}
                        </h3>
                        <p className="text-xs mb-5" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{detailItem.purchaseId}</p>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>공급처</label>
                                    <select value={editForm.supplier} onChange={(e) => setEditForm((form) => ({ ...form, supplier: e.target.value }))} className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white" }}>
                                        {SUPPLIERS.map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>의약품</label>
                                    <select value={editForm.productCode} onChange={(e) => setEditForm((form) => ({ ...form, productCode: e.target.value }))} className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6, background: "white" }}>
                                        {CATEGORIES.map((category) => (
                                            <optgroup key={category} label={category}>
                                                {PRODUCTS.filter((product) => product.category === category).map((product) => <option key={product.code} value={product.code}>{product.name}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>수량</label>
                                        <input type="number" min="1" value={editForm.qty} onChange={(e) => setEditForm((form) => ({ ...form, qty: e.target.value }))} className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6 }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>매입일</label>
                                        <input type="date" value={editForm.date} onChange={(e) => setEditForm((form) => ({ ...form, date: e.target.value }))} className="w-full px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 6 }} />
                                    </div>
                                </div>
                                {editProduct && editForm.qty && (
                                    <div className="px-3 py-2 text-sm font-semibold" style={{ background: "#EFF6FF", borderRadius: 6, color: "#1D4ED8" }}>
                                        수정 합계: ₩{(editProduct.costPrice * Number(editForm.qty)).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { label: "공급처", value: detailItem.supplier },
                                    { label: "의약품", value: detailItem.productName },
                                    { label: "카테고리", value: detailItem.category },
                                    { label: "수량", value: `${detailItem.qty.toLocaleString()}개` },
                                    { label: "단가(원가)", value: `₩${detailItem.unitCost.toLocaleString()}` },
                                    { label: "합계금액", value: `₩${detailItem.totalCost.toLocaleString()}` },
                                    { label: "매입일", value: detailItem.date },
                                    { label: "등록자", value: detailItem.registeredBy },
                                ].map((row) => (
                                    <div key={row.label} className="flex">
                                        <span className="w-28 shrink-0 text-xs font-medium" style={{ color: "#999" }}>{row.label}</span>
                                        <span className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-6">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                                    <button onClick={handleUpdate} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", borderRadius: 7, color: "white" }}>저장</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setDetailItem(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                                    <button onClick={startEditing} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", borderRadius: 7, color: "white" }}>수정</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
