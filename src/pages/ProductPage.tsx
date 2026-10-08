import { useState } from "react"
import { CATEGORIES, ITEMS as SAMPLE_ITEMS, SUPPLIERS } from "../data/sample"
import { CATEGORY_COLORS, ITEM_UNITS, formatMoney, formatNumber, itemCodePrefix } from "../lib/domain"
import type { Item } from "../types/api"

/**
 * 6. 상품(의약품) 마스터.
 *
 * 수량(재고)은 items가 아니라 inventories에 있으므로 이 화면에서는 다루지 않는다.
 * 상품을 등록하면 서버가 기본 창고에 수량 0인 재고 레코드를 함께 만든다(6.3).
 */

/** 공급처는 5.1 거래처 목록에서 partner_type=SUPPLIER 로 조회한 결과를 쓴다 */
const ACTIVE_SUPPLIERS = SUPPLIERS.filter((s) => s.is_active)

const ITEMS = SAMPLE_ITEMS


const onlyDigits = (value: string) => value.replace(/\D/g, "")

const EMPTY_FORM = {
  item_name: "",
  category_id: CATEGORIES[0].category_id,
  code_number: "0001",
  supplier_id: ACTIVE_SUPPLIERS[0].partner_id,
  spec: "",
  unit_qty: 1,
  unit: ITEM_UNITS[0] as string,
  unit_cost: 0,
  unit_price: 0,
  safety_stock: 0,
}

type ItemForm = typeof EMPTY_FORM

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
                  <option key={u} value={u} className="text-gray-700">{u}</option>
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
  const [items, setItems] = useState<Item[]>(ITEMS)
  const [keyword, setKeyword] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("전체")
  const [includeInactive, setIncludeInactive] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM)

  // 6.1 keyword 는 상품 코드 또는 제품명을 검색하고, 기본적으로 단종 상품은 제외한다
  const filteredItems = items.filter((p) => {
    const matchKeyword = p.item_name.includes(keyword) || p.item_code.includes(keyword)
    const matchCategory = categoryFilter === "전체" || p.category_name === categoryFilter
    const matchActive = includeInactive || p.is_active
    return matchKeyword && matchCategory && matchActive
  })

  const categoryName =
      CATEGORIES.find((c) => c.category_id === form.category_id)?.category_name ?? "기타"
  const codePrefix = itemCodePrefix(categoryName)

  /**
   * 서버가 채번하는 값(DB 설계서 7.)을 등록 화면에서 미리 보여주기 위한 추정치.
   * 실제 코드는 6.3 등록 응답의 item_code 를 따른다.
   */
  const nextCodeNumber = (categoryId: number) => {
    const name = CATEGORIES.find((c) => c.category_id === categoryId)?.category_name ?? "기타"
    const prefix = itemCodePrefix(name)
    const used = items
        .filter((p) => p.item_code.startsWith(prefix))
        .map((p) => Number(p.item_code.slice(prefix.length)))
        .filter((n) => Number.isFinite(n))
    return String((used.length ? Math.max(...used) : 0) + 1).padStart(4, "0")
  }

  const update = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, code_number: nextCodeNumber(EMPTY_FORM.category_id) })
    setShowModal(true)
  }

  const changeCategory = (categoryId: number) =>
      setForm((prev) => ({ ...prev, category_id: categoryId, code_number: nextCodeNumber(categoryId) }))

  const handleSave = () => {
    const category = CATEGORIES.find((c) => c.category_id === form.category_id)
    const supplier = ACTIVE_SUPPLIERS.find((s) => s.partner_id === form.supplier_id)
    const newItem: Item = {
      item_id: Math.max(0, ...items.map((p) => p.item_id)) + 1,
      item_code: `${codePrefix}${form.code_number.padStart(4, "0")}`,
      item_name: form.item_name.trim() || "이름 없는 상품",
      category_id: form.category_id,
      category_name: category?.category_name ?? "기타",
      spec: form.spec.trim() || null,
      // 포장 수량이 2 이상이면 "10박스" 처럼 수량을 포함해 적는다
      unit: form.unit_qty > 1 ? `${form.unit_qty}${form.unit}` : form.unit,
      unit_cost: form.unit_cost,
      unit_price: form.unit_price,
      safety_stock: form.safety_stock,
      supplier_id: form.supplier_id,
      supplier_name: supplier?.name ?? "-",
      is_active: true,
    }
    setItems((prev) => [...prev, newItem])
    setShowModal(false)
  }

  /** 6.4 단종 처리 — is_active 토글 */
  const toggleActive = (itemId: number) =>
      setItems((prev) => prev.map((p) => (p.item_id === itemId ? { ...p, is_active: !p.is_active } : p)))

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
                placeholder="상품명, 상품코드 검색..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="cursor-pointer"
              />
              단종 포함
            </label>
            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="전체">전체 카테고리</option>
              {CATEGORIES.map((c) => (
                  <option key={c.category_id} value={c.category_name}>{c.category_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">상품코드</th>
                <th className="px-4 py-3.5 font-semibold">상품명</th>
                <th className="px-4 py-3.5 font-semibold">카테고리</th>
                <th className="px-4 py-3.5 font-semibold">규격 / 단위</th>
                <th className="px-4 py-3.5 font-semibold text-right">매입가</th>
                <th className="px-4 py-3.5 font-semibold text-right">판매가</th>
                <th className="px-4 py-3.5 font-semibold text-right">안전재고</th>
                <th className="px-4 py-3.5 font-semibold text-center">상태</th>
                <th className="px-4 py-3.5 font-semibold text-center"></th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {filteredItems.map((p) => {
                const catStyle = CATEGORY_COLORS[p.category_name] ?? CATEGORY_COLORS["기타"]
                return (
                    <tr key={p.item_id} className="hover:bg-gray-50 transition-colors" style={{ opacity: p.is_active ? 1 : 0.55 }}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                        {p.item_code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.item_name}</p>
                        <p className="text-xs text-gray-400">{p.supplier_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                            className="inline-block px-2.5 py-1 text-xs font-medium rounded-md"
                            style={{ background: catStyle.bg, color: catStyle.color }}
                        >
                          {p.category_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {p.spec ?? "-"} ({p.unit})
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {formatMoney(p.unit_cost)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatMoney(p.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatNumber(p.safety_stock)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                            style={p.is_active
                                ? { background: "#DCFCE7", color: "#166534" }
                                : { background: "#F3F4F6", color: "#6B7280" }}
                        >
                          {p.is_active ? "판매중" : "단종"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                            onClick={() => toggleActive(p.item_id)}
                            className="text-xs font-medium"
                            style={{ color: p.is_active ? "#DC2626" : "#059669" }}
                        >
                          {p.is_active ? "단종 처리" : "단종 해제"}
                        </button>
                      </td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
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
                  카테고리를 고르면 상품코드 앞부분(IT-MED-카테고리코드)이 자동으로 정해집니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="상품명">
                      <input
                          value={form.item_name}
                          onChange={(e) => update("item_name", e.target.value)}
                          placeholder="타이레놀정 500mg"
                          className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="카테고리">
                    <select
                        value={form.category_id}
                        onChange={(e) => changeCategory(Number(e.target.value))}
                        className={selectClass}
                    >
                      {CATEGORIES.map((c) => (
                          <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="상품코드">
                    <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
                      <span className="shrink-0 px-3 py-2 text-sm font-mono text-gray-400 bg-gray-50 border-r border-gray-300">
                        {codePrefix}
                      </span>
                      <input
                          value={form.code_number}
                          onChange={(e) => update("code_number", onlyDigits(e.target.value).slice(0, 4))}
                          inputMode="numeric"
                          className="w-full min-w-0 px-3 py-2 text-sm font-mono outline-none"
                      />
                    </div>
                  </Field>

                  <Field label="공급처">
                    <select
                        value={form.supplier_id}
                        onChange={(e) => update("supplier_id", Number(e.target.value))}
                        className={selectClass}
                    >
                      {ACTIVE_SUPPLIERS.map((s) => (
                          <option key={s.partner_id} value={s.partner_id}>{s.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="규격">
                    <input
                        value={form.spec}
                        onChange={(e) => update("spec", e.target.value)}
                        placeholder="500mg x 10정"
                        className={inputClass}
                    />
                  </Field>

                  <Field label="단위">
                    <QuantityInput
                        value={form.unit_qty}
                        onChange={(v) => update("unit_qty", v)}
                        unit={form.unit}
                        unitOptions={ITEM_UNITS}
                        onUnitChange={(u) => update("unit", u)}
                    />
                  </Field>

                  <Field label="안전재고">
                    <QuantityInput
                        value={form.safety_stock}
                        onChange={(v) => update("safety_stock", v)}
                        unit={form.unit}
                    />
                  </Field>

                  <Field label="매입가 (원가)">
                    <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
                      <input
                          value={form.unit_cost}
                          onChange={(e) => update("unit_cost", Number(onlyDigits(e.target.value) || 0))}
                          inputMode="numeric"
                          className="w-full min-w-0 px-3 py-2 text-sm outline-none"
                      />
                      <span className="shrink-0 self-center pr-3 text-sm text-gray-400">원</span>
                    </div>
                  </Field>

                  <Field label="판매가">
                    <div className="flex items-stretch rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-blue-500">
                      <input
                          value={form.unit_price}
                          onChange={(e) => update("unit_price", Number(onlyDigits(e.target.value) || 0))}
                          inputMode="numeric"
                          className="w-full min-w-0 px-3 py-2 text-sm outline-none"
                      />
                      <span className="shrink-0 self-center pr-3 text-sm text-gray-400">원</span>
                    </div>
                  </Field>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                  등록하면 기본 창고에 수량 0인 재고가 함께 만들어집니다. 입고는 매입 등록에서 처리합니다.
                </p>

                <div className="flex gap-3 mt-4 justify-end">
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
