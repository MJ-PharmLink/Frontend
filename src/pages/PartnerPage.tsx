import { useState } from "react"

type PartnerType = "customer" | "supplier"

const CATEGORIES = ["병원", "제조사", "수입사", "도매상", "약국"] as const
type Category = (typeof CATEGORIES)[number]

const PARTNER_TYPES = ["고객사", "공급처"] as const

interface Partner {
  id: string
  name: string
  type: "고객사" | "공급처"
  category: Category
  contact: string
  phone: string
  email: string
  address: string
  status: "활성" | "비활성"
  totalTrade: number
  lastTrade: string
}

const SAMPLE_PARTNERS: Partner[] = [
  // ── 고객사 (12개) ──
  { id: "C001", name: "한강약국", type: "고객사", category: "약국", contact: "김약사", phone: "02-1234-5678", email: "hangang@pharm.co.kr", address: "서울 마포구 양화로 12", status: "활성", totalTrade: 42800000, lastTrade: "2026.09.11" },
  { id: "C002", name: "서울성모병원", type: "고객사", category: "병원", contact: "이구매", phone: "02-2258-5000", email: "purchase@cmcseoul.or.kr", address: "서울 서초구 반포대로 222", status: "활성", totalTrade: 285000000, lastTrade: "2026.09.10" },
  { id: "C003", name: "메디팜도매", type: "고객사", category: "도매상", contact: "박대리", phone: "031-456-7890", email: "order@medipharm.co.kr", address: "경기 고양시 덕양구 화정로 100", status: "활성", totalTrade: 168000000, lastTrade: "2026.09.09" },
  { id: "C004", name: "강남약국", type: "고객사", category: "약국", contact: "최약사", phone: "02-555-1234", email: "gangnam@pharm.co.kr", address: "서울 강남구 테헤란로 55", status: "활성", totalTrade: 31200000, lastTrade: "2026.09.08" },
  { id: "C005", name: "부산메디칼", type: "고객사", category: "병원", contact: "정팀장", phone: "051-123-4567", email: "info@busanmedical.co.kr", address: "부산 해운대구 해운대로 15", status: "비활성", totalTrade: 12500000, lastTrade: "2026.07.15" },
  { id: "C006", name: "분당서울대병원", type: "고객사", category: "병원", contact: "한구매팀", phone: "031-787-7000", email: "purchase@snubh.org", address: "경기 성남시 분당구 구미로 173", status: "활성", totalTrade: 312000000, lastTrade: "2026.09.11" },
  { id: "C007", name: "이화약국", type: "고객사", category: "약국", contact: "이약사", phone: "02-362-8800", email: "ewha@pharm.co.kr", address: "서울 서대문구 이화여대길 33", status: "활성", totalTrade: 18600000, lastTrade: "2026.09.07" },
  { id: "C008", name: "경동제약도매", type: "고객사", category: "도매상", contact: "조부장", phone: "02-966-5500", email: "sales@kdpharm.co.kr", address: "서울 동대문구 왕산로 40", status: "활성", totalTrade: 224000000, lastTrade: "2026.09.10" },
  { id: "C009", name: "아주대병원", type: "고객사", category: "병원", contact: "강구매", phone: "031-219-5000", email: "purchase@ajoumc.or.kr", address: "경기 수원시 영통구 월드컵로 164", status: "활성", totalTrade: 198000000, lastTrade: "2026.09.09" },
  { id: "C010", name: "청십자약국", type: "고객사", category: "약국", contact: "윤약사", phone: "051-241-3300", email: "bluecross@pharm.co.kr", address: "부산 중구 중앙대로 67", status: "활성", totalTrade: 27400000, lastTrade: "2026.09.06" },
  { id: "C011", name: "대전선병원", type: "고객사", category: "병원", contact: "오팀장", phone: "042-220-8000", email: "purchase@sunhospital.co.kr", address: "대전 중구 목중로 29", status: "비활성", totalTrade: 8900000, lastTrade: "2026.06.20" },
  { id: "C012", name: "글로벌메디도매", type: "고객사", category: "도매상", contact: "문대리", phone: "02-3452-7700", email: "order@globalmed.co.kr", address: "서울 금천구 가산디지털1로 165", status: "활성", totalTrade: 145000000, lastTrade: "2026.09.08" },

  // ── 공급처 (11개) ──
  { id: "S001", name: "한국제약(주)", type: "공급처", category: "제조사", contact: "오과장", phone: "02-8888-1234", email: "supply@hankookpharm.co.kr", address: "서울 영등포구 여의도동 25", status: "활성", totalTrade: 520000000, lastTrade: "2026.09.10" },
  { id: "S002", name: "대웅제약", type: "공급처", category: "제조사", contact: "신부장", phone: "02-550-8100", email: "supply@daewoong.co.kr", address: "서울 강남구 삼성동 167", status: "활성", totalTrade: 380000000, lastTrade: "2026.09.08" },
  { id: "S003", name: "유한양행", type: "공급처", category: "제조사", contact: "권차장", phone: "02-828-0114", email: "b2b@yuhan.co.kr", address: "서울 동작구 노량진로 74", status: "활성", totalTrade: 290000000, lastTrade: "2026.09.05" },
  { id: "S004", name: "종근당", type: "공급처", category: "제조사", contact: "임과장", phone: "02-2194-0114", email: "supply@ckdpharm.co.kr", address: "서울 종로구 새문안로 5길 32", status: "활성", totalTrade: 345000000, lastTrade: "2026.09.09" },
  { id: "S005", name: "바이엘코리아", type: "공급처", category: "수입사", contact: "남팀장", phone: "02-480-3300", email: "supply.kr@bayer.com", address: "서울 강남구 역삼로 514", status: "활성", totalTrade: 218000000, lastTrade: "2026.09.07" },
  { id: "S006", name: "한국얀센", type: "공급처", category: "수입사", contact: "엄부장", phone: "02-2094-1114", email: "korea.supply@janssen.com", address: "서울 용산구 한강대로 92", status: "활성", totalTrade: 176000000, lastTrade: "2026.09.06" },
  { id: "S007", name: "녹십자", type: "공급처", category: "제조사", contact: "심차장", phone: "031-260-9114", email: "b2b@greencross.com", address: "경기 용인시 기흥구 이현로 30", status: "활성", totalTrade: 265000000, lastTrade: "2026.09.10" },
  { id: "S008", name: "동아에스티", type: "공급처", category: "제조사", contact: "서과장", phone: "02-6477-3114", email: "supply@donga-st.com", address: "서울 서초구 신반포로 177", status: "활성", totalTrade: 198000000, lastTrade: "2026.09.04" },
  { id: "S009", name: "한미약품", type: "공급처", category: "제조사", contact: "류팀장", phone: "031-580-7114", email: "supply@hanmi.co.kr", address: "경기 화성시 향남읍 향남로 641", status: "활성", totalTrade: 310000000, lastTrade: "2026.09.08" },
  { id: "S010", name: "삼성제약", type: "공급처", category: "제조사", contact: "안대리", phone: "02-820-0114", email: "supply@samsungpharm.co.kr", address: "서울 강서구 양천로 583", status: "비활성", totalTrade: 42000000, lastTrade: "2026.07.01" },
  { id: "S011", name: "종근당건강", type: "공급처", category: "제조사", contact: "배과장", phone: "02-2194-1300", email: "supply@ckdhealth.co.kr", address: "서울 종로구 새문안로 5가길 28", status: "활성", totalTrade: 134000000, lastTrade: "2026.09.03" },
]

const typeTab = [
  { key: "all", label: "전체" },
  { key: "customer", label: "고객사" },
  { key: "supplier", label: "공급처" },
] as const

type TabKey = "all" | PartnerType

const SORT_OPTIONS = [
  { key: "default", label: "기본 (코드순)" },
  { key: "active", label: "활성화 우선" },
  { key: "inactive", label: "비활성화 우선" },
  { key: "tradeDesc", label: "누적 거래액 높은순" },
  { key: "tradeAsc", label: "누적 거래액 낮은순" },
  { key: "name", label: "거래처명 가나다순" },
  { key: "recent", label: "마지막 거래 최신순" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["key"]

export default function PartnerPage() {
  const [partners, setPartners] = useState<Partner[]>(SAMPLE_PARTNERS)
  const [tab, setTab] = useState<TabKey>("all")
  const [sort, setSort] = useState<SortKey>("default")
  const [sortMenu, setSortMenu] = useState<TabKey | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Partner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const openModal = (p: Partner | null) => {
    setSelected(p)
    setConfirmDelete(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setConfirmDelete(false)
  }

  const handleDelete = () => {
    if (!selected) return
    setPartners((prev) => prev.filter((p) => p.id !== selected.id))
    setSelected(null)
    closeModal()
  }

  const filtered = partners.filter((p) => {
    const matchTab = tab === "all" || (tab === "customer" ? p.type === "고객사" : p.type === "공급처")
    const matchSearch = p.name.includes(search) || p.contact.includes(search) || p.category.includes(search)
    return matchTab && matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "active":
        return (a.status === "활성" ? 0 : 1) - (b.status === "활성" ? 0 : 1)
      case "inactive":
        return (a.status === "비활성" ? 0 : 1) - (b.status === "비활성" ? 0 : 1)
      case "tradeDesc":
        return b.totalTrade - a.totalTrade
      case "tradeAsc":
        return a.totalTrade - b.totalTrade
      case "name":
        return a.name.localeCompare(b.name, "ko")
      case "recent":
        return b.lastTrade.localeCompare(a.lastTrade)
      default:
        return a.id.localeCompare(b.id)
    }
  })

  const fields: { label: string; value: string; options?: readonly string[] }[] = [
    { label: "거래처명", value: selected?.name ?? "" },
    { label: "구분", value: selected?.type ?? PARTNER_TYPES[0], options: PARTNER_TYPES },
    { label: "분류", value: selected?.category ?? CATEGORIES[0], options: CATEGORIES },
    { label: "담당자", value: selected?.contact ?? "" },
    { label: "연락처", value: selected?.phone ?? "" },
    { label: "이메일", value: selected?.email ?? "" },
    { label: "주소", value: selected?.address ?? "" },
  ]

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

      {/* Tabs + Search */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F0F2F5" }}>
            {typeTab.map((t) => (
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
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
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
                        minWidth: 200,
                        borderRadius: 8,
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
                          onClick={() => {
                            setSort(o.key)
                            setSortMenu(null)
                          }}
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
            정렬: {SORT_OPTIONS.find((o) => o.key === sort)?.label}
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="거래처명, 담당자, 분류 검색..."
          className="px-4 py-2 text-sm outline-none"
          style={{ border: "1px solid #E5EAF0", borderRadius: 8, background: "white", color: "#333", minWidth: 240 }}
        />
      </div>

      {/* Table */}
      <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["코드", "거래처명", "구분", "분류", "담당자", "연락처", "누적 거래액", "마지막 거래", "상태", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{p.id}</td>
                  <td className="px-5 py-4 font-medium" style={{ color: "#1a1a1a" }}>{p.name}</td>
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={p.type === "고객사" ? { background: "#EFF6FF", color: "#1D4ED8" } : { background: "#F0FDF4", color: "#166534" }}
                    >
                      {p.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: "#666" }}>{p.category}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: "#555" }}>{p.contact}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>{p.phone}</td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>₩ {p.totalTrade.toLocaleString()}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: "#999" }}>{p.lastTrade}</td>
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={p.status === "활성" ? { background: "#DCFCE7", color: "#166534" } : { background: "#F3F4F6", color: "#6B7280" }}
                    >
                      {p.status}
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
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="py-14 text-center text-sm" style={{ color: "#999" }}>
            조건에 맞는 거래처가 없습니다.
          </div>
        )}
      </div>

      {/* Simple Detail Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-lg p-8 relative"
            style={{ borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
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
              {fields.map((f) => (
                <div key={f.label} className="flex items-center gap-4">
                  <label className="text-sm font-medium w-20 shrink-0" style={{ color: "#666" }}>{f.label}</label>
                  {f.options ? (
                    <select
                      key={f.value}
                      defaultValue={f.value}
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white cursor-pointer"
                      style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      defaultValue={f.value}
                      className="flex-1 px-3 py-2 text-sm outline-none"
                      style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                    />
                  )}
                </div>
              ))}
            </div>
            {confirmDelete ? (
              <div
                className="flex items-center justify-between gap-4 mt-8 px-4 py-3"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}
              >
                <span className="text-sm" style={{ color: "#991B1B" }}>
                  {selected?.name} 거래처를 삭제할까요?
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
                {selected && (
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
                  <button onClick={closeModal} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>
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
