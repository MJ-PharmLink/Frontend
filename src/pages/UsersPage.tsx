import { useState } from "react"
import type { UserRole } from "../App"

interface SysUser {
    id: number
    username: string
    name: string
    role: UserRole
    email: string
    isActive: boolean
    createdAt: string
}

const ROLE_LABELS: Record<string, string> = { admin: "관리자", sales: "영업담당", warehouse: "창고담당" }
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    admin: { bg: "#EFF6FF", color: "#1D4ED8" },
    sales: { bg: "#F0FDF4", color: "#166534" },
    warehouse: { bg: "#FFF7ED", color: "#9A3412" },
}

const INITIAL_USERS: SysUser[] = [
    { id: 1, username: "admin01", name: "김관리자", role: "admin", email: "admin@pharmlink.co.kr", isActive: true, createdAt: "2026-01-05" },
    { id: 2, username: "sales01", name: "이영업", role: "sales", email: "sales@pharmlink.co.kr", isActive: true, createdAt: "2026-01-10" },
    { id: 3, username: "wh01", name: "박창고", role: "warehouse", email: "warehouse@pharmlink.co.kr", isActive: true, createdAt: "2026-01-10" },
    { id: 4, username: "sales02", name: "최담당", role: "sales", email: "choi@pharmlink.co.kr", isActive: true, createdAt: "2026-02-01" },
    { id: 5, username: "wh02", name: "정창고", role: "warehouse", email: "jung@pharmlink.co.kr", isActive: false, createdAt: "2026-02-15" },
    { id: 6, username: "sales03", name: "강영업", role: "sales", email: "kang@pharmlink.co.kr", isActive: true, createdAt: "2026-03-01" },
    { id: 7, username: "admin02", name: "오관리", role: "admin", email: "oh@pharmlink.co.kr", isActive: false, createdAt: "2026-03-20" },
    { id: 8, username: "wh03", name: "한담당", role: "warehouse", email: "han@pharmlink.co.kr", isActive: true, createdAt: "2026-04-01" },
]

const EMPTY_FORM = { username: "", name: "", email: "", role: "sales" as UserRole, password: "" }

const SORT_OPTIONS = [
    { key: "default", label: "기본 (ID순)" },
    { key: "active", label: "활성화 우선" },
    { key: "inactive", label: "비활성화 우선" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["key"]

const ROLE_FILTERS = ["전체", "admin", "sales", "warehouse"] as const

export default function UsersPage() {
    const [users, setUsers] = useState<SysUser[]>(INITIAL_USERS)
    const [roleFilter, setRoleFilter] = useState<string>("전체")
    const [sort, setSort] = useState<SortKey>("default")
    const [sortMenu, setSortMenu] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [editUser, setEditUser] = useState<SysUser | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)

    const filtered = users.filter((u) => {
        const matchRole = roleFilter === "전체" || u.role === roleFilter
        const matchSearch =
            u.name.includes(search) || u.username.includes(search) || u.email.includes(search)
        return matchRole && matchSearch
    })

    const sorted = [...filtered].sort((a, b) => {
        switch (sort) {
            case "active":
                return (a.isActive ? 0 : 1) - (b.isActive ? 0 : 1)
            case "inactive":
                return (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0)
            default:
                return a.id - b.id
        }
    })

    const openCreate = () => {
        setEditUser(null)
        setForm(EMPTY_FORM)
        setShowModal(true)
    }

    const openEdit = (u: SysUser) => {
        setEditUser(u)
        setForm({ username: u.username, name: u.name, email: u.email, role: u.role, password: "" })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editUser) {
            setUsers((prev) =>
                prev.map((u) => (u.id === editUser.id ? { ...u, ...form } : u))
            )
        } else {
            const newUser: SysUser = {
                id: Math.max(...users.map((u) => u.id)) + 1,
                username: form.username,
                name: form.name,
                email: form.email,
                role: form.role,
                isActive: true,
                createdAt: new Date().toISOString().slice(0, 10),
            }
            setUsers((prev) => [...prev, newUser])
        }
        setShowModal(false)
    }

    const toggleActive = (id: number) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)))
    }

    const stats = {
        total: users.length,
        active: users.filter((u) => u.isActive).length,
        admin: users.filter((u) => u.role === "admin").length,
        sales: users.filter((u) => u.role === "sales").length,
        warehouse: users.filter((u) => u.role === "warehouse").length,
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>사용자(계정) 관리</h2>
                    <p className="text-sm mt-0.5" style={{ color: "#888" }}>ERP 시스템 접속 계정 및 역할 관리 — 관리자 전용</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                    style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    계정 생성
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "전체 계정", value: stats.total, color: "#0B3D91" },
                    { label: "활성 계정", value: stats.active, color: "#059669" },
                    { label: "관리자", value: stats.admin, color: "#1D4ED8" },
                    { label: "영업담당", value: stats.sales, color: "#166534" },
                    { label: "창고담당", value: stats.warehouse, color: "#9A3412" },
                ].map((s) => (
                    <div key={s.label} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                        <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2">
                    {ROLE_FILTERS.map((r) => (
                        <div key={r} className="relative">
                            <button
                                onClick={() => {
                                    setRoleFilter(r)
                                    setSortMenu(sortMenu === r ? null : r)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150"
                                style={{
                                    background: roleFilter === r ? "#0B3D91" : "#F0F2F5",
                                    color: roleFilter === r ? "white" : "#666",
                                }}
                            >
                                {r === "전체" ? "전체" : ROLE_LABELS[r]}
                                <svg
                                    width="9"
                                    height="9"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    style={{
                                        transform: sortMenu === r ? "rotate(180deg)" : "none",
                                        transition: "transform 150ms",
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {sortMenu === r && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setSortMenu(null)} />
                                    <div
                                        className="absolute left-0 top-full mt-2 z-50 py-1.5 bg-white"
                                        style={{
                                            minWidth: 170,
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
                                                className="flex items-center justify-between w-full gap-4 px-3 py-2 text-xs text-left transition-colors"
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
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="3">
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
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="이름, 아이디, 이메일 검색..."
                        className="pl-8 pr-3 py-1.5 text-sm outline-none"
                        style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white", minWidth: 220 }}
                    />
                </div>
                <span className="text-xs" style={{ color: "#999" }}>
                    {filtered.length}명 · 정렬: {SORT_OPTIONS.find((o) => o.key === sort)?.label}
                </span>
            </div>

            {/* Table */}
            <div className="bg-white overflow-hidden" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                            {["ID", "아이디", "이름", "이메일", "역할", "상태", "생성일", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {sorted.map((u, i) => {
                            const rc = ROLE_COLORS[u.role]
                            return (
                                <tr
                                    key={u.id}
                                    style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none", opacity: u.isActive ? 1 : 0.55 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                >
                                    <td className="px-4 py-3 text-xs" style={{ color: "#ccc", fontFamily: "'Inter', sans-serif" }}>{u.id}</td>
                                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#666" }}>{u.username}</td>
                                    <td className="px-4 py-3 font-semibold" style={{ color: "#1a1a1a" }}>{u.name}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "#777" }}>{u.email}</td>
                                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                      <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                              background: u.isActive ? "#F0FDF4" : "#FEF2F2",
                              color: u.isActive ? "#166534" : "#DC2626",
                          }}
                      >
                        {u.isActive ? "활성" : "비활성"}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{u.createdAt}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-3">
                                            <button onClick={() => openEdit(u)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>수정</button>
                                            <button
                                                onClick={() => toggleActive(u.id)}
                                                className="text-xs font-medium"
                                                style={{ color: u.isActive ? "#DC2626" : "#059669" }}
                                            >
                                                {u.isActive ? "비활성화" : "활성화"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white w-full max-w-lg p-8 relative"
                        style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>
                            {editUser ? "계정 수정" : "계정 생성"}
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: "아이디", key: "username", type: "text", placeholder: "user01" },
                                { label: "이름", key: "name", type: "text", placeholder: "홍길동" },
                                { label: "이메일", key: "email", type: "email", placeholder: "user@pharmlink.co.kr" },
                                { label: "비밀번호", key: "password", type: "password", placeholder: editUser ? "변경 시에만 입력" : "비밀번호 입력" },
                            ].map((f) => (
                                <div key={f.key}>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={(form as Record<string, string>)[f.key]}
                                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full px-3 py-2 text-sm outline-none"
                                        style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>역할</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333", background: "white" }}
                                >
                                    <option value="admin">관리자 (ADMIN)</option>
                                    <option value="sales">영업담당 (SALES)</option>
                                    <option value="warehouse">창고담당 (WAREHOUSE)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 justify-end">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>취소</button>
                            <button onClick={handleSave} className="px-5 py-2 text-sm font-medium" style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
