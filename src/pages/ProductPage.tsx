import { useState } from "react"

export interface ProductMaster {
  code: string
  name: string
  category: string
  indication: string
  spec: string
  unit: string
  costPrice: number
  salePrice: number
  stock: number
  safetyStock: number
  manufacturer: string
  drugType: "전문의약품" | "일반의약품" | "건강기능식품"
  status: "정상" | "단종"
}

export const CATEGORIES = [
  "감염성질환 및 호흡기계",
  "소화기계 및 순환기계",
  "신경계 및 정신/행동장애",
  "호르몬 및 대사성 의약품",
  "기타",
]

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "감염성질환 및 호흡기계": { bg: "#EFF6FF", text: "#1D4ED8" },
  "소화기계 및 순환기계": { bg: "#ECFDF5", text: "#047857" },
  "신경계 및 정신/행동장애": { bg: "#FFF7ED", text: "#C2410C" },
  "호르몬 및 대사성 의약품": { bg: "#F3E8FF", text: "#6B21A8" },
  기타: { bg: "#F3F4F6", text: "#374151" },
}

export const PRODUCTS: ProductMaster[] = [
  {
    code: "INF-001",
    name: "아목시실린 캡슐 500mg",
    category: "감염성질환 및 호흡기계",
    indication: "세균성 감염증(인후염, 중이염)",
    spec: "100캡슐/병",
    unit: "병",
    costPrice: 8500,
    salePrice: 13500,
    stock: 450,
    safetyStock: 100,
    manufacturer: "한미약품",
    drugType: "전문의약품",
    status: "정상",
  },
  {
    code: "INF-002",
    name: "세프라딘 정 500mg",
    category: "감염성질환 및 호흡기계",
    indication: "호흡기 감염, 피부감염",
    spec: "100정/PTP",
    unit: "상자",
    costPrice: 12000,
    salePrice: 18000,
    stock: 80,
    safetyStock: 100,
    manufacturer: "종근당",
    drugType: "전문의약품",
    status: "정상",
  },
  {
    code: "DIG-001",
    name: "아제스틴 정",
    category: "소화기계 및 순환기계",
    indication: "소화불량, 위산과다",
    spec: "500정/병",
    unit: "병",
    costPrice: 15000,
    salePrice: 22000,
    stock: 320,
    safetyStock: 80,
    manufacturer: "대웅제약",
    drugType: "일반의약품",
    status: "정상",
  },
  {
    code: "DIG-002",
    name: "암로디핀 베실산염 5mg",
    category: "소화기계 및 순환기계",
    indication: "고혈압, 협심증",
    spec: "30정/PTP",
    unit: "상자",
    costPrice: 4200,
    salePrice: 6800,
    stock: 600,
    safetyStock: 150,
    manufacturer: "유한양행",
    drugType: "전문의약품",
    status: "정상",
  },
  {
    code: "NEU-001",
    name: "뉴로펜 서방정 300mg",
    category: "신경계 및 정신/행동장애",
    indication: "신경통, 중추성 통증",
    spec: "100정/병",
    unit: "병",
    costPrice: 18000,
    salePrice: 27000,
    stock: 45,
    safetyStock: 50,
    manufacturer: "GC녹십자",
    drugType: "전문의약품",
    status: "정상",
  },
  {
    code: "MET-001",
    name: "메트포르민 염산염 500mg",
    category: "호르몬 및 대사성 의약품",
    indication: "제2형 당뇨병",
    spec: "100정/PTP",
    unit: "상자",
    costPrice: 3500,
    salePrice: 5500,
    stock: 800,
    safetyStock: 200,
    manufacturer: "JW중외제약",
    drugType: "전문의약품",
    status: "정상",
  },
  {
    code: "ETC-005",
    name: "쿨렉스파스",
    category: "기타",
    indication: "근육통·관절통·묨",
    spec: "6매/봉",
    unit: "박스",
    costPrice: 2400,
    salePrice: 4200,
    stock: 280,
    safetyStock: 100,
    manufacturer: "그린셀제약",
    drugType: "일반의약품",
    status: "정상",
  },
]

export function ProductPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchSearch =
        p.name.includes(searchTerm) ||
        p.code.includes(searchTerm) ||
        p.manufacturer.includes(searchTerm)
    const matchCategory = selectedCategory === "전체" || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              등록된 의약품 및 상품 마스터를 조회하고 관리합니다.
            </p>
          </div>
          <button
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ background: "#0B3D91" }}
          >
            + 새 상품 등록
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <input
                type="text"
                placeholder="상품명, 상품코드, 제약사 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="전체">전체 카테고리</option>
              {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">상품코드</th>
                <th className="px-4 py-3.5 font-semibold">상품명</th>
                <th className="px-4 py-3.5 font-semibold">카테고리</th>
                <th className="px-4 py-3.5 font-semibold">구분</th>
                <th className="px-4 py-3.5 font-semibold">규격 / 단위</th>
                <th className="px-4 py-3.5 font-semibold text-right">매입가</th>
                <th className="px-4 py-3.5 font-semibold text-right">판매가</th>
                <th className="px-4 py-3.5 font-semibold text-right">재고량</th>
                <th className="px-4 py-3.5 font-semibold text-center">상태</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((p) => {
                const catStyle = CATEGORY_COLORS[p.category] || CATEGORY_COLORS["기타"]
                const isLowStock = p.stock <= p.safetyStock
                return (
                    <tr key={p.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                        {p.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.manufacturer}</p>
                      </td>
                      <td className="px-4 py-3">
                      <span
                          className="inline-block px-2.5 py-1 text-xs font-medium rounded-md"
                          style={{ background: catStyle.bg, color: catStyle.text }}
                      >
                        {p.category}
                      </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.drugType}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {p.spec} ({p.unit})
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {p.costPrice.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {p.salePrice.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-right">
                      <span
                          className={`font-semibold ${
                              isLowStock ? "text-red-600" : "text-gray-900"
                          }`}
                      >
                        {p.stock.toLocaleString()}
                      </span>
                        {isLowStock && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-normal">
                          부족
                        </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {p.status}
                      </span>
                      </td>
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

export default ProductPage