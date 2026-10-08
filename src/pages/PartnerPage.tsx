import { useState } from "react"
import { PARTNER_TYPE_LABELS, PARTNER_TYPE_TONES } from "../lib/domain"
import { PARTNER_TYPES } from "../types/api"
import type { BusinessPartner, PartnerType } from "../types/api"

/**
 * 5. 거래처 관리.
 *
 * 고객사(CUSTOMER)와 공급처(SUPPLIER)를 한 리소스로 관리하고 partner_type으로
 * 구분한다. 명세의 business_partners에는 업종 분류·이메일·누적 거래액 필드가
 * 없다. 누적 거래액과 최근 거래일이 필요하면 5.6 거래처별 거래 이력에서 가져온다.
 */

const SAMPLE_PARTNERS: BusinessPartner[] = [
  // ── 고객사 ──
  { partner_id: 1, partner_type: "CUSTOMER", name: "새봄약국", business_number: "123-45-67890", phone: "02-1234-5678", address: "서울 마포구 양화로 12", manager_name: "김약사", is_active: true },
  { partner_id: 2, partner_type: "CUSTOMER", name: "라온종합병원", business_number: "124-86-10234", phone: "02-2258-5000", address: "서울 서초구 반포대로 222", manager_name: "이구매", is_active: true },
  { partner_id: 3, partner_type: "CUSTOMER", name: "다온메디유통", business_number: "128-81-55234", phone: "031-456-7890", address: "경기 고양시 덕양구 화정로 100", manager_name: "박대리", is_active: true },
  { partner_id: 4, partner_type: "CUSTOMER", name: "푸른길약국", business_number: "211-09-33451", phone: "02-555-1234", address: "서울 강남구 테헤란로 55", manager_name: "최약사", is_active: true },
  { partner_id: 5, partner_type: "CUSTOMER", name: "해솔메디컬센터", business_number: "602-81-77120", phone: "051-123-4567", address: "부산 해운대구 해운대로 15", manager_name: "정팀장", is_active: false },
  { partner_id: 6, partner_type: "CUSTOMER", name: "한빛대학병원", business_number: "129-82-44510", phone: "031-787-7000", address: "경기 성남시 분당구 구미로 173", manager_name: "한구매팀", is_active: true },
  { partner_id: 7, partner_type: "CUSTOMER", name: "별하약국", business_number: "110-23-88190", phone: "02-362-8800", address: "서울 서대문구 이화여대길 33", manager_name: "이약사", is_active: true },
  { partner_id: 8, partner_type: "CUSTOMER", name: "케이메드유통", business_number: "204-81-62330", phone: "02-966-5500", address: "서울 동대문구 왕산로 40", manager_name: "조부장", is_active: true },
  { partner_id: 9, partner_type: "CUSTOMER", name: "수원온병원", business_number: "135-82-19047", phone: "031-219-5000", address: "경기 수원시 영통구 월드컵로 164", manager_name: "강구매", is_active: true },
  { partner_id: 10, partner_type: "CUSTOMER", name: "바다약국", business_number: "601-11-25874", phone: "051-241-3300", address: "부산 중구 중앙대로 67", manager_name: "윤약사", is_active: true },
  { partner_id: 11, partner_type: "CUSTOMER", name: "늘봄병원", business_number: "305-82-30118", phone: "042-220-8000", address: "대전 중구 목중로 29", manager_name: "오팀장", is_active: false },
  { partner_id: 12, partner_type: "CUSTOMER", name: "유니온헬스유통", business_number: "119-81-70925", phone: "02-3452-7700", address: "서울 금천구 가산디지털1로 165", manager_name: "문대리", is_active: true },

  // ── 공급처 ──
  { partner_id: 13, partner_type: "SUPPLIER", name: "아진바이오", business_number: "107-81-12345", phone: "02-8888-1234", address: "서울 영등포구 여의도동 25", manager_name: "오과장", is_active: true },
  { partner_id: 14, partner_type: "SUPPLIER", name: "메디코어제약", business_number: "220-81-83158", phone: "02-550-8100", address: "서울 강남구 삼성동 167", manager_name: "신부장", is_active: true },
  { partner_id: 15, partner_type: "SUPPLIER", name: "세움파마", business_number: "108-81-02290", phone: "02-828-0114", address: "서울 동작구 노량진로 74", manager_name: "권차장", is_active: true },
  { partner_id: 16, partner_type: "SUPPLIER", name: "한결제약", business_number: "101-81-06192", phone: "02-2194-0114", address: "서울 종로구 새문안로 5길 32", manager_name: "임과장", is_active: true },
  { partner_id: 17, partner_type: "SUPPLIER", name: "이노젠파마", business_number: "211-81-29774", phone: "02-480-3300", address: "서울 강남구 역삼로 514", manager_name: "남팀장", is_active: true },
  { partner_id: 18, partner_type: "SUPPLIER", name: "노바헬스코리아", business_number: "106-81-51510", phone: "02-2094-1114", address: "서울 용산구 한강대로 92", manager_name: "엄부장", is_active: true },
  { partner_id: 19, partner_type: "SUPPLIER", name: "그린셀제약", business_number: "135-81-11891", phone: "031-260-9114", address: "경기 용인시 기흥구 이현로 30", manager_name: "심차장", is_active: true },
  { partner_id: 20, partner_type: "SUPPLIER", name: "다온메디텍", business_number: "201-81-02355", phone: "02-6477-3114", address: "서울 서초구 신반포로 177", manager_name: "서과장", is_active: true },
  { partner_id: 21, partner_type: "SUPPLIER", name: "유니랩제약", business_number: "124-81-00998", phone: "031-580-7114", address: "경기 화성시 향남읍 향남로 641", manager_name: "류팀장", is_active: true },
  { partner_id: 22, partner_type: "SUPPLIER", name: "태성바이오", business_number: "109-81-37258", phone: "02-820-0114", address: "서울 강서구 양천로 583", manager_name: "안대리", is_active: false },
  { partner_id: 23, partner_type: "SUPPLIER", name: "웰니스팜", business_number: "101-86-41800", phone: "02-2194-1300", address: "서울 종로구 새문안로 5가길 28", manager_name: "배과장", is_active: true },
]

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

export default function PartnerPage() {
  const [partners, setPartners] = useState<BusinessPartner[]>(SAMPLE_PARTNERS)
  const [tab, setTab] = useState<TabKey>("all")
  const [sort, setSort] = useState<SortKey>("default")
  const [sortMenu, setSortMenu] = useState<TabKey | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<BusinessPartner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle")

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

  const handleSave = () => {
    if (selected) {
      // 5.4 수정은 전체 교체(PUT). partner_type은 변경되지 않는다
      setPartners((prev) =>
        prev.map((p) =>
          p.partner_id === selected.partner_id
            ? {
                ...p,
                name: form.name,
                business_number: form.business_number,
                phone: form.phone,
                address: form.address,
                manager_name: form.manager_name || null,
              }
            : p,
        ),
      )
    } else {
      setPartners((prev) => [
        ...prev,
        {
          partner_id: Math.max(0, ...prev.map((p) => p.partner_id)) + 1,
          partner_type: form.partner_type,
          name: form.name,
          business_number: form.business_number,
          phone: form.phone,
          address: form.address,
          manager_name: form.manager_name || null,
          is_active: true,
        },
      ])
    }
    closeModal()
  }

  /** 5.5 삭제는 물리 삭제가 아니라 is_active = false 로 비활성화한다 */
  const handleDelete = () => {
    if (!selected) return
    setPartners((prev) =>
      prev.map((p) => (p.partner_id === selected.partner_id ? { ...p, is_active: false } : p)),
    )
    setSelected(null)
    closeModal()
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
                조건에 맞는 거래처가 없습니다.
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
                <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>
                  {selected ? "거래처 상세" : "거래처 등록"}
                </h3>

                <div className="space-y-4">
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

                {confirmDelete ? (
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
                        <button onClick={handleSave} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>
                          저장
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
