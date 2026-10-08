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

const CATEGORY_CODE_PREFIX: Record<string, string> = {
  "감염성질환 및 호흡기계": "INF",
  "소화기계 및 순환기계": "DIG",
  "신경계 및 정신/행동장애": "NEU",
  "호르몬 및 대사성 의약품": "HOR",
  기타: "ETC",
}

const UNITS = ["박스", "개"] as const
type Unit = (typeof UNITS)[number]

const DRUG_TYPES: ProductMaster["drugType"][] = ["전문의약품", "일반의약품", "건강기능식품"]

const MANUFACTURERS = Array.from(new Set(PRODUCTS.map((p) => p.manufacturer))).sort((a, b) =>
    a.localeCompare(b, "ko"),
)

const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0],
  codeNumber: "001",
  manufacturer: MANUFACTURERS[0],
  indication: "",
  spec: "",
  unitQty: 1,
  unit: "박스" as Unit,
  drugType: "전문의약품" as ProductMaster["drugType"],
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  safetyStock: 0,
}

type ProductForm = typeof EMPTY_FORM

const onlyDigits = (value: string) => value.replace(/\D/g, "")

/** 숫자 입력 + 화살표(1단위 증감) + 뒤에 연한 색으로 고정되는 단위 */
function QuantityInput({
                         value,
                         onChange,
                         unit,
                         unitOptions,
                         onUnitChange,
                       }: {
  value: number
  onChange: (next: number) => void
  unit: string
  unitOptions?: readonly string[]
  onUnitChange?: (next: string) => void
}) {
  const step = (delta: number) => onChange(Math.max(0, value + delta))

  return (
      <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
        <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(Number(onlyDigits(e.target.value) || 0))}
            className="w-full min-w-0 px-3 py-2 text-sm outline-none"
        />
        {unitOptions ? (
            <select
                value={unit}
                onChange={(e) => onUnitChange?.(e.target.value)}
                aria-label="단위"
                className="shrink-0 self-stretch pl-1 pr-2 text-sm bg-transparent text-gray-400 outline-none cursor-pointer"
            >
              {unitOptions.map((u) => (
                  <option key={u} value={u} className="text-gray-700">
                    {u}
                  </option>
              ))}
            </select>
        ) : (
            <span className="shrink-0 self-center pr-3 text-sm text-gray-400">{unit}</span>
        )}
        <div className="flex flex-col shrink-0 border-l border-gray-200">
          <button
              type="button"
              aria-label="1 증가"
              onClick={() => step(1)}
              className="flex-1 px-2 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
              type="button"
              aria-label="1 감소"
              onClick={() => step(-1)}
              className="flex-1 px-2 flex items-center justify-center text-gray-400 border-t border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
        {children}
      </div>
  )
}

const selectClass =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-blue-500 cursor-pointer"
const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"

export function ProductPage() {
  const [products, setProducts] = useState<ProductMaster[]>(PRODUCTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)

  const filteredProducts = products.filter((p) => {
    const matchSearch =
        p.name.includes(searchTerm) ||
        p.code.includes(searchTerm) ||
        p.manufacturer.includes(searchTerm)
    const matchCategory = selectedCategory === "전체" || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  const codePrefix = CATEGORY_CODE_PREFIX[form.category] ?? "ETC"

  /** 해당 카테고리에서 아직 쓰지 않은 다음 일련번호 */
  const nextCodeNumber = (category: string) => {
    const prefix = CATEGORY_CODE_PREFIX[category] ?? "ETC"
    const used = products
        .filter((p) => p.code.startsWith(`${prefix}-`))
        .map((p) => Number(p.code.slice(prefix.length + 1)))
        .filter((n) => Number.isFinite(n))
    return String((used.length ? Math.max(...used) : 0) + 1).padStart(3, "0")
  }

  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, codeNumber: nextCodeNumber(EMPTY_FORM.category) })
    setShowModal(true)
  }

  const changeCategory = (category: string) =>
      setForm((prev) => ({ ...prev, category, codeNumber: nextCodeNumber(category) }))

  const handleSave = () => {
    const newProduct: ProductMaster = {
      code: `${codePrefix}-${form.codeNumber.padStart(3, "0")}`,
      name: form.name.trim() || "이름 없는 상품",
      category: form.category,
      indication: form.indication.trim(),
      spec: form.spec.trim() || "-",
      unit: form.unitQty > 1 ? `${form.unitQty}${form.unit}` : form.unit,
      costPrice: form.costPrice,
      salePrice: form.salePrice,
      stock: form.stock,
      safetyStock: form.safetyStock,
      manufacturer: form.manufacturer,
      drugType: form.drugType,
      status: "정상",
    }
    setProducts((prev) => [...prev, newProduct])
    setShowModal(false)
  }

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
              onClick={openCreate}
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
          {filteredProducts.length === 0 && (
              <div className="py-14 text-center text-sm text-gray-400">
                조건에 맞는 상품이 없습니다.
              </div>
          )}
        </div>

        {/* 새 상품 등록 모달 */}
        {showModal && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.45)" }}
                onClick={() => setShowModal(false)}
            >
              <div
                  className="bg-white w-full max-w-2xl p-8 relative rounded-xl"
                  style={{ maxHeight: "90vh", overflowY: "auto" }}
                  onClick={(e) => e.stopPropagation()}
              >
                <button
                    onClick={() => setShowModal(false)}
                    aria-label="닫기"
                    className="absolute top-5 right-5 opacity-40 hover:opacity-100 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <h3 className="font-semibold text-lg text-gray-900 mb-1">새 상품 등록</h3>
                <p className="text-sm text-gray-500 mb-6">
                  카테고리를 고르면 상품코드 앞부분이 자동으로 정해집니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="상품명">
                      <input
                          value={form.name}
                          onChange={(e) => update("name", e.target.value)}
                          placeholder="아목시실린 캡슐 500mg"
                          className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="카테고리">
                    <select
                        value={form.category}
                        onChange={(e) => changeCategory(e.target.value)}
                        className={selectClass}
                    >
                      {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="상품코드">
                    <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
                      <span className="shrink-0 px-3 py-2 text-sm font-mono text-gray-400 bg-gray-50 border-r border-gray-300">
                        {codePrefix}-
                      </span>
                      <input
                          value={form.codeNumber}
                          onChange={(e) => update("codeNumber", onlyDigits(e.target.value).slice(0, 3))}
                          inputMode="numeric"
                          className="w-full min-w-0 px-3 py-2 text-sm font-mono outline-none"
                      />
                    </div>
                  </Field>

                  <Field label="제조사">
                    <select
                        value={form.manufacturer}
                        onChange={(e) => update("manufacturer", e.target.value)}
                        className={selectClass}
                    >
                      {MANUFACTURERS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="구분">
                    <select
                        value={form.drugType}
                        onChange={(e) => update("drugType", e.target.value as ProductMaster["drugType"])}
                        className={selectClass}
                    >
                      {DRUG_TYPES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="효능·효과">
                    <input
                        value={form.indication}
                        onChange={(e) => update("indication", e.target.value)}
                        placeholder="세균성 감염증(인후염, 중이염)"
                        className={inputClass}
                    />
                  </Field>

                  <Field label="규격">
                    <input
                        value={form.spec}
                        onChange={(e) => update("spec", e.target.value)}
                        placeholder="100캡슐/병"
                        className={inputClass}
                    />
                  </Field>

                  <Field label="단위">
                    <QuantityInput
                        value={form.unitQty}
                        onChange={(v) => update("unitQty", v)}
                        unit={form.unit}
                        unitOptions={UNITS}
                        onUnitChange={(u) => update("unit", u as Unit)}
                    />
                  </Field>

                  <Field label="재고">
                    <QuantityInput
                        value={form.stock}
                        onChange={(v) => update("stock", v)}
                        unit={form.unit}
                    />
                  </Field>

                  <Field label="안전재고">
                    <QuantityInput
                        value={form.safetyStock}
                        onChange={(v) => update("safetyStock", v)}
                        unit={form.unit}
                    />
                  </Field>

                  <Field label="매입가">
                    <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
                      <input
                          value={form.costPrice}
                          onChange={(e) => update("costPrice", Number(onlyDigits(e.target.value) || 0))}
                          inputMode="numeric"
                          className="w-full min-w-0 px-3 py-2 text-sm outline-none"
                      />
                      <span className="shrink-0 self-center pr-3 text-sm text-gray-400">원</span>
                    </div>
                  </Field>

                  <Field label="판매가">
                    <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
                      <input
                          value={form.salePrice}
                          onChange={(e) => update("salePrice", Number(onlyDigits(e.target.value) || 0))}
                          inputMode="numeric"
                          className="w-full min-w-0 px-3 py-2 text-sm outline-none"
                      />
                      <span className="shrink-0 self-center pr-3 text-sm text-gray-400">원</span>
                    </div>
                  </Field>
                </div>

                <div className="flex gap-3 mt-8 justify-end">
                  <button
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-600"
                  >
                    취소
                  </button>
                  <button
                      onClick={handleSave}
                      className="px-5 py-2 text-sm font-medium text-white rounded-lg"
                      style={{ background: "#0B3D91" }}
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default ProductPage
