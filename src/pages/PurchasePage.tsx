import { useCallback, useEffect, useState } from "react"
import { errorMessage, fetchAllPages, partnersApi, purchasesApi } from "../api"
import { DETAIL_FETCH_CONCURRENCY, mapWithConcurrency } from "../lib/concurrency"
// 상품(6.1)·창고(6.8) 목록 API가 생기기 전까지 선택 목록은 샘플을 쓴다 (로컬 DB에 같은 item_id·warehouse_id 필요)
import { DEFAULT_WAREHOUSE, ITEMS, TODAY, WAREHOUSES } from "../data/sample"
import { formatDate, formatDateTime, formatMoney, formatNumber } from "../lib/domain"
import type { BusinessPartner, PurchaseDetail } from "../types/api"

/**
 * 10. 매입 — 관리자·창고 전용.
 *
 * 매입 등록 하나가 매입 기록 생성 + 로트 생성 + 재고 증가 + 재고 이력(IN)
 * 저장을 모두 포함한다. 별도의 입고 API는 없다. 원가는 클라이언트가 보내지
 * 않고 서버가 상품 마스터에서 조회해 스냅샷으로 저장한다.
 */

interface DraftLine {
  item_id: number
  quantity: number
  lot_number: string
  expiry_date: string
}

const emptyLine = (): DraftLine => ({
  item_id: ITEMS[0].item_id,
  quantity: 1,
  lot_number: "",
  // 유통기한은 매입일 이후여야 한다(10.2)
  expiry_date: "",
})

export default function PurchasePage() {
  const [purchases, setPurchases] = useState<PurchaseDetail[]>([])
  const [suppliers, setSuppliers] = useState<BusinessPartner[]>([])
  const [pageError, setPageError] = useState<string | null>(null)
  const [partnerFilter, setPartnerFilter] = useState<number | "전체">("전체")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [detail, setDetail] = useState<PurchaseDetail | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [draftPartner, setDraftPartner] = useState<number>(0)
  const [draftWarehouse, setDraftWarehouse] = useState<number>(DEFAULT_WAREHOUSE.warehouse_id)
  const [draftDate, setDraftDate] = useState(TODAY)
  const [draftLines, setDraftLines] = useState<DraftLine[]>([emptyLine()])

  /**
   * 10.1 매입 목록 → 10.3 상세. 요약 카드의 입고 수량 합계에 라인 수량이 필요해서
   * 목록의 각 매입을 상세로 다시 받는다 (목록 응답에는 라인이 없다)
   */
  const reloadPurchases = useCallback(async () => {
    const rows = await fetchAllPages((page, page_size) => purchasesApi.list({ page, page_size }))
    setPurchases(await mapWithConcurrency(rows, DETAIL_FETCH_CONCURRENCY, (row) => purchasesApi.get(row.purchase_id)))
  }, [])

  useEffect(() => {
    Promise.all([
      reloadPurchases(),
      fetchAllPages((page, page_size) =>
        partnersApi.list({ partner_type: "SUPPLIER", include_inactive: true, page, page_size }),
      ).then((rows) => {
        setSuppliers(rows)
        setDraftPartner(rows.find((p) => p.is_active)?.partner_id ?? 0)
      }),
    ]).catch((err) => setPageError(errorMessage(err, "매입 목록을 불러오지 못했습니다.")))
  }, [reloadPurchases])

  // 10.1 기간 필터는 purchase_date 기준이며 시작일·종료일 모두 포함한다
  const invalidRange = startDate !== "" && endDate !== "" && startDate > endDate
  const filtered = invalidRange ? [] : purchases.filter((p) => {
    const matchPartner = partnerFilter === "전체" || p.partner_id === partnerFilter
    const matchStart = startDate === "" || p.purchase_date >= startDate
    const matchEnd = endDate === "" || p.purchase_date <= endDate
    return matchPartner && matchStart && matchEnd
  })

  const totals = {
    count: filtered.length,
    amount: filtered.reduce((sum, p) => sum + p.total_amount, 0),
    quantity: filtered.reduce((sum, p) => sum + p.items.reduce((q, i) => q + i.quantity, 0), 0),
  }

  const draftTotal = draftLines.reduce((sum, l) => {
    const item = ITEMS.find((i) => i.item_id === l.item_id)
    return sum + (item ? item.unit_cost * l.quantity : 0)
  }, 0)

  const createPurchase = async () => {
    const lines = draftLines.filter((l) => l.quantity > 0)
    if (lines.length === 0) return setError("매입 품목을 한 개 이상 입력해 주세요.")
    if (lines.some((l) => l.lot_number.trim() === "")) return setError("로트번호는 필수입니다.")
    if (lines.some((l) => l.expiry_date === "")) return setError("유통기한은 필수입니다.")
    // 10.2 — 유통기한은 매입일 이후여야 한다 (유통기한은 당일까지 유효하므로 매입일과 같은 날은 허용, 이전 날짜만 거부)
    if (lines.some((l) => l.expiry_date < draftDate)) {
      return setError("유통기한은 매입일보다 앞설 수 없습니다.")
    }
    // 동일 매입 안에서 같은 (상품, 로트번호) 조합은 중복될 수 없다
    // 로트번호는 서버와 같은 기준(앞뒤 공백 제거, 대소문자 무시)으로 비교한다
    const keys = lines.map((l) => `${l.item_id}:${l.lot_number.trim().toUpperCase()}`)
    if (new Set(keys).size !== keys.length) {
      return setError("같은 상품에 동일한 로트번호를 중복으로 넣을 수 없습니다.")
    }

    // 원가 스냅샷(3.15)·로트 생성·재고 증가는 서버가 한 트랜잭션으로 처리한다
    try {
      await purchasesApi.create({
        partner_id: draftPartner,
        warehouse_id: draftWarehouse,
        purchase_date: draftDate,
        items: lines.map((l) => ({
          item_id: l.item_id,
          quantity: l.quantity,
          lot_number: l.lot_number.trim(),
          expiry_date: l.expiry_date,
        })),
      })
      await reloadPurchases()
    } catch (err) {
      return setError(errorMessage(err, "매입을 등록하지 못했습니다."))
    }
    setShowCreate(false)
    setDraftLines([emptyLine()])
    setError(null)
  }

  const inputStyle = { border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" } as const

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>매입 관리</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              공급처 입고 기록 · 등록 시 로트가 생성되고 재고가 증가합니다
            </p>
          </div>
          <button
              onClick={() => { setShowCreate(true); setError(null) }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
              style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            매입 등록
          </button>
        </div>

        {pageError && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              {pageError}
            </p>
        )}

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "매입 건수", value: `${totals.count}건`, color: "#0B3D91" },
            { label: "총 입고 수량", value: formatNumber(totals.quantity), color: "#1677FF" },
            { label: "총 매입액", value: formatMoney(totals.amount), color: "#059669" },
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
            <option value="전체">전체 공급처</option>
            {suppliers.map((p) => (
                <option key={p.partner_id} value={p.partner_id}>{p.name}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 text-xs outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }} />
          <span className="text-xs" style={{ color: "#999" }}>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 text-xs outline-none" style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }} />
          {(startDate || endDate || partnerFilter !== "전체") && (
              <button
                  onClick={() => { setStartDate(""); setEndDate(""); setPartnerFilter("전체") }}
                  className="px-3 py-1.5 text-xs"
                  style={{ color: "#0B3D91" }}
              >
                초기화
              </button>
          )}
        </div>

        {invalidRange && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              시작일이 종료일보다 늦습니다. 기간을 다시 선택해 주세요.
            </p>
        )}

        {/* 목록 */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["매입번호", "공급처", "창고", "매입일", "품목 수", "매입액", "등록일시", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {filtered.map((p, i) => (
                  <tr
                      key={p.purchase_id}
                      style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: "#666" }}>#{p.purchase_id}</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#1a1a1a" }}>{p.partner_name}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: "#777" }}>
                      {WAREHOUSES.find((w) => w.warehouse_id === p.warehouse_id)?.name ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatDate(p.purchase_date)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: "#555" }}>{p.items.length}개</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(p.total_amount)}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDateTime(p.created_at)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setDetail(p)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>상세</button>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
              <div className="py-14 text-center text-sm" style={{ color: "#999" }}>조건에 맞는 매입 기록이 없습니다.</div>
          )}
        </div>

        {/* 10.3 매입 상세 */}
        {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetail(null)}>
              <div className="bg-white w-full max-w-2xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setDetail(null)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>매입 #{detail.purchase_id}</h3>
                <p className="text-sm mt-1 mb-6" style={{ color: "#888" }}>
                  {detail.partner_name} · {formatDate(detail.purchase_date)} · {WAREHOUSES.find((w) => w.warehouse_id === detail.warehouse_id)?.name}
                </p>

                <table className="w-full text-sm mb-5">
                  <thead>
                  <tr style={{ background: "#F7F9FC" }}>
                    {["상품", "로트번호", "유통기한", "수량", "원가", "금액"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#888", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody>
                  {detail.items.map((item, i) => (
                      <tr key={item.purchase_item_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-3 py-2">
                          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{item.item_name}</p>
                          <p className="font-mono text-xs" style={{ color: "#aaa" }}>{item.item_code}</p>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs" style={{ color: "#555" }}>{item.lot_number}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatDate(item.expiry_date)}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatNumber(item.quantity)}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.unit_cost)}</td>
                        <td className="px-3 py-2 text-sm font-medium" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.line_amount)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                <p className="text-xs mb-5" style={{ color: "#aaa" }}>
                  원가는 매입 등록 시점의 스냅샷입니다. 이후 상품 마스터 원가가 바뀌어도 과거 매입 금액은 변하지 않습니다.
                </p>

                <div className="flex items-center justify-between pt-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <span className="text-sm" style={{ color: "#666" }}>총 매입액</span>
                  <span className="text-lg font-bold" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>{formatMoney(detail.total_amount)}</span>
                </div>

                <div className="flex justify-end mt-6">
                  <button onClick={() => setDetail(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                </div>
              </div>
            </div>
        )}

        {/* 10.2 매입 등록 */}
        {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setShowCreate(false)}>
              <div className="bg-white w-full max-w-3xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowCreate(false)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg mb-1" style={{ color: "#1a1a1a" }}>매입 등록</h3>
                <p className="text-sm mb-6" style={{ color: "#888" }}>
                  입고 수량은 로트 단위로 기록됩니다. 원가는 상품 마스터에서 자동으로 적용됩니다.
                </p>

                {error && (
                    <p className="mb-4 px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>{error}</p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>공급처</label>
                    <select
                        value={draftPartner}
                        onChange={(e) => setDraftPartner(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{ ...inputStyle, background: "white" }}
                    >
                      {suppliers.filter((s) => s.is_active).map((s) => (
                          <option key={s.partner_id} value={s.partner_id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>입고 창고</label>
                    <select
                        value={draftWarehouse}
                        onChange={(e) => setDraftWarehouse(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{ ...inputStyle, background: "white" }}
                    >
                      {WAREHOUSES.map((w) => (
                          <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}{w.is_default ? " (기본)" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>매입일</label>
                    <input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} />
                  </div>
                </div>

                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>입고 품목</label>
                <div className="space-y-2">
                  {draftLines.map((line, idx) => {
                    const item = ITEMS.find((i) => i.item_id === line.item_id)
                    return (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                              value={line.item_id}
                              onChange={(e) => setDraftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, item_id: Number(e.target.value) } : l)))}
                              className="flex-1 min-w-0 px-3 py-2 text-sm outline-none cursor-pointer"
                              style={{ ...inputStyle, background: "white" }}
                          >
                            {ITEMS.filter((i) => i.is_active).map((i) => (
                                <option key={i.item_id} value={i.item_id}>{i.item_code} · {i.item_name}</option>
                            ))}
                          </select>
                          <input
                              value={line.lot_number}
                              onChange={(e) => setDraftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, lot_number: e.target.value } : l)))}
                              placeholder="로트번호"
                              className="w-28 px-3 py-2 text-sm outline-none font-mono"
                              style={inputStyle}
                          />
                          <input
                              type="date"
                              value={line.expiry_date}
                              onChange={(e) => setDraftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, expiry_date: e.target.value } : l)))}
                              className="w-36 px-2 py-2 text-sm outline-none"
                              style={inputStyle}
                          />
                          <input
                              value={line.quantity}
                              onChange={(e) => setDraftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "") || 1)) } : l)))}
                              inputMode="numeric"
                              className="w-20 px-3 py-2 text-sm outline-none text-right"
                              style={inputStyle}
                          />
                          <span className="w-24 text-right text-sm shrink-0" style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>
                            {formatMoney((item?.unit_cost ?? 0) * line.quantity)}
                          </span>
                          <button
                              onClick={() => setDraftLines((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={draftLines.length === 1}
                              aria-label="품목 삭제"
                              className="px-2 py-2 text-sm shrink-0"
                              style={{ color: draftLines.length === 1 ? "#ddd" : "#DC2626" }}
                          >
                            ✕
                          </button>
                        </div>
                    )
                  })}
                </div>

                <button
                    onClick={() => setDraftLines((prev) => [...prev, emptyLine()])}
                    className="mt-3 px-3 py-1.5 text-xs font-medium"
                    style={{ border: "1px dashed #CBD5E1", borderRadius: 6, color: "#0B3D91" }}
                >
                  + 품목 추가
                </button>

                <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <span className="text-sm" style={{ color: "#666" }}>총 매입액</span>
                  <span className="text-lg font-bold" style={{ color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>{formatMoney(draftTotal)}</span>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                  <button onClick={() => setShowCreate(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                  <button onClick={createPurchase} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>등록</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
