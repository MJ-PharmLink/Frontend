import { useState } from "react"

type PartnerType = "customer" | "supplier"

interface Partner {
  id: string
  name: string
  type: "고객사" | "공급처"
  category: string
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
  { id: "C001", name: "새봄약국", type: "고객사", category: "약국", contact: "김약사", phone: "02-1234-5678", email: "hangang@pharm.co.kr", address: "서울 마포구 양화로 12", status: "활성", totalTrade: 42800000, lastTrade: "2026.09.11" },
  { id: "C002", name: "라온종합병원", type: "고객사", category: "병원", contact: "이구매", phone: "02-2258-5000", email: "purchase@cmcseoul.or.kr", address: "서울 서초구 반포대로 222", status: "활성", totalTrade: 285000000, lastTrade: "2026.09.10" },
  { id: "C003", name: "다온메디유통", type: "고객사", category: "도매상", contact: "박대리", phone: "031-456-7890", email: "order@medipharm.co.kr", address: "경기 고양시 덕양구 화정로 100", status: "활성", totalTrade: 168000000, lastTrade: "2026.09.09" },
  { id: "C004", name: "푸른길약국", type: "고객사", category: "약국", contact: "최약사", phone: "02-555-1234", email: "gangnam@pharm.co.kr", address: "서울 강남구 테헤란로 55", status: "활성", totalTrade: 31200000, lastTrade: "2026.09.08" },
  { id: "C005", name: "해솔메디컬센터", type: "고객사", category: "병원", contact: "정팀장", phone: "051-123-4567", email: "info@busanmedical.co.kr", address: "부산 해운대구 해운대로 15", status: "비활성", totalTrade: 12500000, lastTrade: "2026.07.15" },
  { id: "C006", name: "한빛대학병원", type: "고객사", category: "병원", contact: "한구매팀", phone: "031-787-7000", email: "purchase@snubh.org", address: "경기 성남시 분당구 구미로 173", status: "활성", totalTrade: 312000000, lastTrade: "2026.09.11" },
  { id: "C007", name: "별하약국", type: "고객사", category: "약국", contact: "이약사", phone: "02-362-8800", email: "ewha@pharm.co.kr", address: "서울 서대문구 이화여대길 33", status: "활성", totalTrade: 18600000, lastTrade: "2026.09.07" },
  { id: "C008", name: "케이메드유통", type: "고객사", category: "도매상", contact: "조부장", phone: "02-966-5500", email: "sales@kdpharm.co.kr", address: "서울 동대문구 왕산로 40", status: "활성", totalTrade: 224000000, lastTrade: "2026.09.10" },
  { id: "C009", name: "수원온병원", type: "고객사", category: "병원", contact: "강구매", phone: "031-219-5000", email: "purchase@ajoumc.or.kr", address: "경기 수원시 영통구 월드컵로 164", status: "활성", totalTrade: 198000000, lastTrade: "2026.09.09" },
  { id: "C010", name: "바다약국", type: "고객사", category: "약국", contact: "윤약사", phone: "051-241-3300", email: "bluecross@pharm.co.kr", address: "부산 중구 중앙대로 67", status: "활성", totalTrade: 27400000, lastTrade: "2026.09.06" },
  { id: "C011", name: "늘봄병원", type: "고객사", category: "병원", contact: "오팀장", phone: "042-220-8000", email: "purchase@sunhospital.co.kr", address: "대전 중구 목중로 29", status: "비활성", totalTrade: 8900000, lastTrade: "2026.06.20" },
  { id: "C012", name: "유니온헬스유통", type: "고객사", category: "도매상", contact: "문대리", phone: "02-3452-7700", email: "order@globalmed.co.kr", address: "서울 금천구 가산디지털1로 165", status: "활성", totalTrade: 145000000, lastTrade: "2026.09.08" },

  // ── 공급처 (11개) ──
  { id: "S001", name: "아진바이오", type: "공급처", category: "제조사", contact: "오과장", phone: "02-8888-1234", email: "supply@hankookpharm.co.kr", address: "서울 영등포구 여의도동 25", status: "활성", totalTrade: 520000000, lastTrade: "2026.09.10" },
  { id: "S002", name: "메디코어제약", type: "공급처", category: "제조사", contact: "신부장", phone: "02-550-8100", email: "supply@daewoong.co.kr", address: "서울 강남구 삼성동 167", status: "활성", totalTrade: 380000000, lastTrade: "2026.09.08" },
  { id: "S003", name: "세움파마", type: "공급처", category: "제조사", contact: "권차장", phone: "02-828-0114", email: "b2b@yuhan.co.kr", address: "서울 동작구 노량진로 74", status: "활성", totalTrade: 290000000, lastTrade: "2026.09.05" },
  { id: "S004", name: "한결제약", type: "공급처", category: "제조사", contact: "임과장", phone: "02-2194-0114", email: "supply@ckdpharm.co.kr", address: "서울 종로구 새문안로 5길 32", status: "활성", totalTrade: 345000000, lastTrade: "2026.09.09" },
  { id: "S005", name: "이노젠파마", type: "공급처", category: "수입사", contact: "남팀장", phone: "02-480-3300", email: "supply.kr@bayer.com", address: "서울 강남구 역삼로 514", status: "활성", totalTrade: 218000000, lastTrade: "2026.09.07" },
  { id: "S006", name: "노바헬스코리아", type: "공급처", category: "수입사", contact: "엄부장", phone: "02-2094-1114", email: "korea.supply@janssen.com", address: "서울 용산구 한강대로 92", status: "활성", totalTrade: 176000000, lastTrade: "2026.09.06" },
  { id: "S007", name: "그린셀제약", type: "공급처", category: "제조사", contact: "심차장", phone: "031-260-9114", email: "b2b@greencross.com", address: "경기 용인시 기흥구 이현로 30", status: "활성", totalTrade: 265000000, lastTrade: "2026.09.10" },
  { id: "S008", name: "다온메디텍", type: "공급처", category: "제조사", contact: "서과장", phone: "02-6477-3114", email: "supply@donga-st.com", address: "서울 서초구 신반포로 177", status: "활성", totalTrade: 198000000, lastTrade: "2026.09.04" },
  { id: "S009", name: "유니랩제약", type: "공급처", category: "제조사", contact: "류팀장", phone: "031-580-7114", email: "supply@hanmi.co.kr", address: "경기 화성시 향남읍 향남로 641", status: "활성", totalTrade: 310000000, lastTrade: "2026.09.08" },
  { id: "S010", name: "태성바이오", type: "공급처", category: "제조사", contact: "안대리", phone: "02-820-0114", email: "supply@samsungpharm.co.kr", address: "서울 강서구 양천로 583", status: "비활성", totalTrade: 42000000, lastTrade: "2026.07.01" },
  { id: "S011", name: "웰니스팜", type: "공급처", category: "제조사", contact: "배과장", phone: "02-2194-1300", email: "supply@ckdhealth.co.kr", address: "서울 종로구 새문안로 5가길 28", status: "활성", totalTrade: 134000000, lastTrade: "2026.09.03" },
]

const typeTab = [
  { key: "all", label: "전체" },
  { key: "customer", label: "고객사" },
  { key: "supplier", label: "공급처" },
] as const

type TabKey = "all" | PartnerType

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export default function PartnerPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Partner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [businessNumber, setBusinessNumber] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle")

  const filtered = SAMPLE_PARTNERS.filter((p) => {
    const matchTab = tab === "all" || (tab === "customer" ? p.type === "고객사" : p.type === "공급처")
    const matchSearch = p.name.includes(search) || p.contact.includes(search) || p.category.includes(search)
    return matchTab && matchSearch
  })

  const openPartnerModal = (partner: Partner | null) => {
    setSelected(partner)
    setBusinessNumber(partner ? `120-8${partner.id.slice(2, 3)}-${partner.id.slice(1).padStart(5, "0")}` : "")
    setVerificationStatus("idle")
    setShowModal(true)
  }

  const verifyBusinessNumber = () => {
    const isValid = businessNumber.replace(/\D/g, "").length === 10
    setVerificationStatus(isValid ? "success" : "error")
  }

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>거래처 관리</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>고객사 및 공급처 등록·조회·수정</p>
          </div>
          <button
              onClick={() => openPartnerModal(null)}
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
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F0F2F5" }}>
            {typeTab.map((t) => (
                <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                    style={{
                      background: tab === t.key ? "white" : "transparent",
                      color: tab === t.key ? "#0B3D91" : "#888",
                      boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                >
                  {t.label}
                </button>
            ))}
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
              {filtered.map((p, i) => (
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
                          onClick={() => openPartnerModal(p)}
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
        </div>

        {/* Simple Detail Modal */}
        {showModal && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.45)" }}
                onClick={() => setShowModal(false)}
            >
              <div
                  className="bg-white w-full max-w-lg p-8 relative"
                  style={{ borderRadius: 12 }}
                  onClick={(e) => e.stopPropagation()}
              >
                <button
                    onClick={() => setShowModal(false)}
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
                  {[
                    { label: "거래처명", value: selected?.name ?? "" },
                    { label: "구분", value: selected?.type ?? "" },
                    { label: "분류", value: selected?.category ?? "" },
                    { label: "담당자", value: selected?.contact ?? "" },
                    { label: "연락처", value: selected?.phone ?? "" },
                    { label: "이메일", value: selected?.email ?? "" },
                    { label: "주소", value: selected?.address ?? "" },
                  ].map((f) => (
                      <div key={f.label} className="flex items-center gap-4">
                        <label className="text-sm font-medium w-20 shrink-0" style={{ color: "#666" }}>{f.label}</label>
                        <input
                            defaultValue={f.value}
                            className="flex-1 px-3 py-2 text-sm outline-none"
                            style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                        />
                      </div>
                  ))}
                  <div className="flex items-start gap-4">
                    <label className="text-sm font-medium w-20 shrink-0 pt-2" style={{ color: "#666" }}>사업자등록번호</label>
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input
                            value={businessNumber}
                            onChange={(e) => {
                              setBusinessNumber(formatBusinessNumber(e.target.value))
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
                </div>
                <div className="flex gap-3 mt-8 justify-end">
                  <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>
                    취소
                  </button>
                  <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>
                    저장
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
