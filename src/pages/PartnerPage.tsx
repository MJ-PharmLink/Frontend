import { useEffect, useState } from "react"
import { errorMessage, fetchAllPages, partnersApi } from "../api"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PARTNER_TRANSACTION_LABELS,
  PARTNER_TYPE_LABELS,
  PARTNER_TYPE_TONES,
  formatDateTime,
  formatMoney,
} from "../lib/domain"
import { PARTNER_TYPES } from "../types/api"
import type { BusinessPartner, PartnerTransaction, PartnerType } from "../types/api"

/** 거래 이력 행 배지 색 */
const TRANSACTION_TONES = {
  ORDER: { bg: "#EFF6FF", color: "#1D4ED8" },
  SALE: { bg: "#DCFCE7", color: "#166534" },
  PURCHASE: { bg: "#FFF7ED", color: "#9A3412" },
} as const

/**
 * 5. 거래처 관리.
 *
 * 고객사(CUSTOMER)와 공급처(SUPPLIER)를 한 리소스로 관리하고 partner_type으로
 * 구분한다. 명세의 business_partners에는 업종 분류·이메일·누적 거래액 필드가
 * 없다. 누적 거래액과 최근 거래일이 필요하면 5.6 거래처별 거래 이력에서 가져온다.
 */


const TYPE_TABS = [
  { key: "all", label: "전체" },
  { key: "CUSTOMER", label: PARTNER_TYPE_LABELS.CUSTOMER },
  { key: "SUPPLIER", label: PARTNER_TYPE_LABELS.SUPPLIER },
] as const

type TabKey = (typeof TYPE_TABS)[number]["key"]

const SORT_OPTIONS = [
  { key: "default", label: "기본 (등록순)" },
  { key: "active", label: "활성화 우선" },
  { key: "inactive", label: "비활성화 우선" },
  { key: "name", label: "거래처명 가나다순" },
  { key: "recent", label: "최근 등록순" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["key"]

/** 사업자등록번호 NNN-NN-NNNNN */
function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

const EMPTY_FORM = {
  partner_type: "CUSTOMER" as PartnerType,
  name: "",
  business_number: "",
  phone: "",
  address: "",
  manager_name: "",
}

/**
 * 5.6 거래처별 거래 이력.
 * 고객사는 주문·매출, 공급처는 매입만 발생한다. 취소된 주문도 포함된다.
 */
function PartnerTransactions({ partnerId }: { partnerId: number }) {
  const [rows, setRows] = useState<PartnerTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchAllPages((page, page_size) => partnersApi.transactions(partnerId, { page, page_size }))
        .then(setRows)
        .catch((err) => setError(errorMessage(err, "거래 이력을 불러오지 못했습니다.")))
        .finally(() => setLoading(false))
  }, [partnerId])

  if (loading) return <p className="py-12 text-center text-sm" style={{ color: "#999" }}>불러오는 중...</p>
  if (error) {
    return (
        <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
          {error}
        </p>
    )
  }

  // 누적 거래액은 거래처 필드가 아니라 이 이력에서 집계한다
  const totals = rows.reduce(
    (acc, row) => {
      if (row.type === "SALE") acc.sale += row.amount
      if (row.type === "PURCHASE") acc.purchase += row.amount
      return acc
    },
    { sale: 0, purchase: 0 },
  )
  const lastDate = rows[0]?.transaction_date ?? null

  return (
      <div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "누적 매출액", value: formatMoney(totals.sale) },
            { label: "누적 매입액", value: formatMoney(totals.purchase) },
            { label: "최근 거래", value: lastDate ? formatDateTime(lastDate) : "-" },
          ].map((s) => (
              <div key={s.label} className="px-4 py-3" style={{ background: "#F7F9FC", borderRadius: 8 }}>
                <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
              </div>
          ))}
        </div>

        {rows.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: "#999" }}>거래 이력이 없습니다.</p>
        ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table className="w-full text-sm">
                <thead>
                <tr style={{ background: "#F7F9FC" }}>
                  {["구분", "참조", "상태", "금액", "일시"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#888", fontSize: 11, position: "sticky", top: 0, background: "#F7F9FC" }}>{h}</th>
                  ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, i) => (
                    <tr key={`${row.type}-${row.reference_id}`} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={TRANSACTION_TONES[row.type]}>
                          {PARTNER_TRANSACTION_LABELS[row.type]}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: "#666" }}>
                        {row.reference_number ?? `#${row.reference_id}`}
                      </td>
                      <td className="px-3 py-2">
                        {row.status ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={ORDER_STATUS_TONES[row.status]}>
                              {ORDER_STATUS_LABELS[row.status]}
                            </span>
                        ) : (
                            <span className="text-xs" style={{ color: "#ccc" }}>-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(row.amount)}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDateTime(row.transaction_date)}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  )
}

export default function PartnerPage() {
  const [partners, setPartners] = useState<BusinessPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<TabKey>("all")
  const [sort, setSort] = useState<SortKey>("default")
  const [sortMenu, setSortMenu] = useState<TabKey | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<BusinessPartner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modalTab, setModalTab] = useState<"info" | "transactions">("info")
  const [form, setForm] = useState(EMPTY_FORM)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle")

  // 5.1 목록 — 비활성 거래처도 함께 받아 탭·검색·정렬은 화면에서 한다
  useEffect(() => {
    fetchAllPages((page, page_size) => partnersApi.list({ page, page_size, include_inactive: true }))
        .then(setPartners)
        .catch((err) => setPageError(errorMessage(err, "거래처 목록을 불러오지 못했습니다.")))
        .finally(() => setLoading(false))
  }, [])

  const replacePartner = (updated: BusinessPartner) =>
      setPartners((prev) => prev.map((p) => (p.partner_id === updated.partner_id ? updated : p)))

  // 5.1 keyword 는 거래처명 또는 사업자등록번호를 검색한다
  const filtered = partners.filter((p) => {
    const matchTab = tab === "all" || p.partner_type === tab
    const matchSearch =
      search === "" ||
      p.name.includes(search) ||
      p.business_number.includes(search) ||
      (p.manager_name ?? "").includes(search)
    return matchTab && matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "active":
        return (a.is_active ? 0 : 1) - (b.is_active ? 0 : 1)
      case "inactive":
        return (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0)
      case "name":
        return a.name.localeCompare(b.name, "ko")
      case "recent":
        return b.partner_id - a.partner_id
      default:
        return a.partner_id - b.partner_id
    }
  })

  const openModal = (partner: BusinessPartner | null) => {
    setSelected(partner)
    setForm(
      partner
        ? {
            partner_type: partner.partner_type,
            name: partner.name,
            business_number: partner.business_number,
            phone: partner.phone,
            address: partner.address,
            manager_name: partner.manager_name ?? "",
          }
        : EMPTY_FORM,
    )
    setVerificationStatus("idle")
    setConfirmDelete(false)
    setFormError(null)
    setModalTab("info")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setConfirmDelete(false)
  }

  const update = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const verifyBusinessNumber = () => {
    const isValid = form.business_number.replace(/\D/g, "").length === 10
    setVerificationStatus(isValid ? "success" : "error")
  }

  const handleSave = async () => {
    setFormError(null)
    setSaving(true)
    const body = {
      name: form.name,
      business_number: form.business_number,
      phone: form.phone,
      address: form.address,
      // 담당자는 선택 항목이라 비워 두면 보내지 않는다(null 저장)
      manager_name: form.manager_name.trim() || undefined,
    }
    try {
      if (selected) {
        // 5.4 수정은 전체 교체(PUT). partner_type은 변경되지 않는다
        replacePartner(await partnersApi.update(selected.partner_id, body))
      } else {
        // 5.2 등록
        const created = await partnersApi.create({ ...body, partner_type: form.partner_type })
        setPartners((prev) => [...prev, created])
      }
      closeModal()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  /**
   * 5.5 삭제는 물리 삭제가 아니라 is_active = false 로 비활성화한다.
   * 진행 중인 주문·납품이 있으면 서버가 409 PARTNER_IN_USE 로 거절한다.
   */
  const handleDelete = async () => {
    if (!selected) return
    setFormError(null)
    setSaving(true)
    try {
      await partnersApi.deactivate(selected.partner_id)
      replacePartner({ ...selected, is_active: false })
      setSelected(null)
      closeModal()
    } catch (err) {
      setConfirmDelete(false)
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" } as const

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>거래처 관리</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>고객사 및 공급처 등록·조회·수정</p>
          </div>
          <button
              onClick={() => openModal(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150"
              style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a3280")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0B3D91")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            거래처 등록
          </button>
        </div>

        {pageError && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              {pageError}
            </p>
        )}

        {/* 탭을 누르면 정렬 기준 메뉴가 열린다 */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F0F2F5" }}>
              {TYPE_TABS.map((t) => (
                  <div key={t.key} className="relative">
                    <button
                        onClick={() => {
                          setTab(t.key)
                          setSortMenu(sortMenu === t.key ? null : t.key)
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                        style={{
                          background: tab === t.key ? "white" : "transparent",
                          color: tab === t.key ? "#0B3D91" : "#888",
                          boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        }}
                    >
                      {t.label}
                      <svg
                          width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3"
                          style={{
                            transform: sortMenu === t.key ? "rotate(180deg)" : "none",
                            transition: "transform 150ms",
                          }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {sortMenu === t.key && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setSortMenu(null)} />
                          <div
                              className="absolute left-0 top-full mt-2 z-50 py-1.5 bg-white"
                              style={{
                                minWidth: 200, borderRadius: 8,
                                border: "1px solid #E5EAF0",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
                              }}
                          >
                            <div className="px-3 pt-1 pb-2 text-xs font-medium" style={{ color: "#999" }}>
                              정렬 기준
                            </div>
                            {SORT_OPTIONS.map((o) => (
                                <button
                                    key={o.key}
                                    onClick={() => { setSort(o.key); setSortMenu(null) }}
                                    className="flex items-center justify-between w-full gap-4 px-3 py-2 text-sm text-left transition-colors"
                                    style={{
                                      color: sort === o.key ? "#0B3D91" : "#555",
                                      fontWeight: sort === o.key ? 600 : 400,
                                      background: "transparent",
                                      whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F9FC")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  {o.label}
                                  {sort === o.key && (
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                  )}
                                </button>
                            ))}
                          </div>
                        </>
                    )}
                  </div>
              ))}
            </div>
            <span className="text-xs" style={{ color: "#999" }}>
              {sorted.length}곳 · 정렬: {SORT_OPTIONS.find((o) => o.key === sort)?.label}
            </span>
          </div>
          <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="거래처명, 사업자등록번호, 담당자 검색..."
              className="px-4 py-2 text-sm outline-none"
              style={{ border: "1px solid #E5EAF0", borderRadius: 8, background: "white", color: "#333", minWidth: 260 }}
          />
        </div>

        {/* Table */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["ID", "거래처명", "구분", "사업자등록번호", "담당자", "연락처", "주소", "상태", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {sorted.map((p, i) => {
                const tone = PARTNER_TYPE_TONES[p.partner_type]
                return (
                    <tr
                        key={p.partner_id}
                        style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none", opacity: p.is_active ? 1 : 0.55 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{p.partner_id}</td>
                      <td className="px-5 py-4 font-medium" style={{ color: "#1a1a1a" }}>{p.name}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: tone.bg, color: tone.color }}>
                          {PARTNER_TYPE_LABELS[p.partner_type]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>{p.business_number}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#555" }}>{p.manager_name ?? "-"}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>{p.phone}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: "#999", maxWidth: 220 }}>{p.address}</td>
                      <td className="px-5 py-4">
                        <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={p.is_active ? { background: "#DCFCE7", color: "#166534" } : { background: "#F3F4F6", color: "#6B7280" }}
                        >
                          {p.is_active ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                            onClick={() => openModal(p)}
                            className="text-xs font-medium transition-colors"
                            style={{ color: "#0B3D91" }}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && (
              <div className="py-14 text-center text-sm" style={{ color: "#999" }}>
                {loading ? "불러오는 중..." : "조건에 맞는 거래처가 없습니다."}
              </div>
          )}
        </div>

        {/* 상세 / 등록 모달 */}
        {showModal && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.45)" }}
                onClick={closeModal}
            >
              <div
                  className="bg-white w-full max-w-lg p-8 relative"
                  style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }}
                  onClick={(e) => e.stopPropagation()}
              >
                <button
                    onClick={closeModal}
                    aria-label="닫기"
                    className="absolute top-5 right-5 opacity-40 hover:opacity-100 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg mb-4" style={{ color: "#1a1a1a" }}>
                  {selected ? "거래처 상세" : "거래처 등록"}
                </h3>

                {selected && (
                    <div className="flex gap-1 p-1 rounded-lg w-fit mb-5" style={{ background: "#F0F2F5" }}>
                      {([["info", "기본 정보"], ["transactions", "거래 이력"]] as const).map(([key, label]) => (
                          <button
                              key={key}
                              onClick={() => setModalTab(key)}
                              className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                              style={{
                                background: modalTab === key ? "white" : "transparent",
                                color: modalTab === key ? "#0B3D91" : "#888",
                                boxShadow: modalTab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                              }}
                          >
                            {label}
                          </button>
                      ))}
                    </div>
                )}

                {selected && modalTab === "transactions" && (
                    <PartnerTransactions partnerId={selected.partner_id} />
                )}

                <div className="space-y-4" style={{ display: selected && modalTab === "transactions" ? "none" : undefined }}>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-24 shrink-0" style={{ color: "#666" }}>거래처명</label>
                    <input
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="행복약국"
                        className="flex-1 px-3 py-2 text-sm outline-none"
                        style={inputStyle}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-24 shrink-0" style={{ color: "#666" }}>구분</label>
                    <select
                        value={form.partner_type}
                        onChange={(e) => update("partner_type", e.target.value as PartnerType)}
                        // 5.4 — partner_type은 등록 후 변경할 수 없다
                        disabled={selected !== null}
                        className="flex-1 px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{ ...inputStyle, background: selected ? "#F7F9FC" : "white" }}
                    >
                      {PARTNER_TYPES.map((type) => (
                          <option key={type} value={type}>{PARTNER_TYPE_LABELS[type]} ({type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-start gap-4">
                    <label className="text-sm font-medium w-24 shrink-0 pt-2" style={{ color: "#666" }}>사업자등록번호</label>
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input
                            value={form.business_number}
                            onChange={(e) => {
                              update("business_number", formatBusinessNumber(e.target.value))
                              setVerificationStatus("idle")
                            }}
                            inputMode="numeric"
                            placeholder="000-00-00000"
                            aria-label="사업자등록번호"
                            className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                            style={{
                              border: `1px solid ${verificationStatus === "error" ? "#FCA5A5" : verificationStatus === "success" ? "#86EFAC" : "#E5EAF0"}`,
                              borderRadius: 6,
                              color: "#333",
                            }}
                        />
                        <button
                            type="button"
                            onClick={verifyBusinessNumber}
                            className="shrink-0 px-4 py-2 text-sm font-medium transition-colors"
                            style={{
                              background: verificationStatus === "success" ? "#F0FDF4" : "#EFF6FF",
                              border: `1px solid ${verificationStatus === "success" ? "#BBF7D0" : "#BFDBFE"}`,
                              borderRadius: 6,
                              color: verificationStatus === "success" ? "#166534" : "#1D4ED8",
                            }}
                        >
                          {verificationStatus === "success" ? "인증완료" : "인증"}
                        </button>
                      </div>
                      {verificationStatus !== "idle" && (
                          <p className="mt-1.5 text-xs" style={{ color: verificationStatus === "success" ? "#166534" : "#DC2626" }}>
                            {verificationStatus === "success"
                                ? "사업자등록번호 인증이 완료되었습니다."
                                : "사업자등록번호 10자리를 정확히 입력해 주세요."}
                          </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-24 shrink-0" style={{ color: "#666" }}>담당자</label>
                    <input
                        value={form.manager_name}
                        onChange={(e) => update("manager_name", e.target.value)}
                        placeholder="선택 입력"
                        className="flex-1 px-3 py-2 text-sm outline-none"
                        style={inputStyle}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-24 shrink-0" style={{ color: "#666" }}>연락처</label>
                    <input
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="02-1234-5678"
                        className="flex-1 px-3 py-2 text-sm outline-none"
                        style={inputStyle}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-24 shrink-0" style={{ color: "#666" }}>주소</label>
                    <input
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="서울시 강남구 ..."
                        className="flex-1 px-3 py-2 text-sm outline-none"
                        style={inputStyle}
                    />
                  </div>
                </div>

                {formError && !(selected && modalTab === "transactions") && (
                    <p className="mt-5 px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
                      {formError}
                    </p>
                )}

                {selected && modalTab === "transactions" ? (
                    <div className="flex justify-end mt-7">
                      <button onClick={closeModal} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>
                        닫기
                      </button>
                    </div>
                ) : confirmDelete ? (
                    <div
                        className="flex items-center justify-between gap-4 mt-8 px-4 py-3"
                        style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}
                    >
                      <span className="text-sm" style={{ color: "#991B1B" }}>
                        {selected?.name} 거래처를 비활성화할까요?
                      </span>
                      <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1.5 text-sm font-medium"
                            style={{ background: "white", border: "1px solid #E5EAF0", borderRadius: 6, color: "#666" }}
                        >
                          취소
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm font-medium"
                            style={{ background: "#DC2626", color: "white", borderRadius: 6 }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mt-8">
                      {selected && selected.is_active && (
                          <button
                              onClick={() => setConfirmDelete(true)}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
                              style={{ background: "white", border: "1px solid #FECACA", borderRadius: 7, color: "#DC2626" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            삭제
                          </button>
                      )}
                      <div className="flex gap-3 ml-auto">
                        <button onClick={closeModal} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>
                          취소
                        </button>
                        <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-medium" style={{ background: saving ? "#7A9CD6" : "#0B3D91", color: "white", borderRadius: 7 }}>
                          {saving ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  )
}
