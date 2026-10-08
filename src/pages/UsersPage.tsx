import { useState } from "react"
import { ROLE_LABELS, ROLE_TONES, formatDate } from "../lib/domain"
import { USER_ROLES } from "../types/api"
import type { User, UserRole } from "../types/api"

/**
 * 4. 사용자(계정) 관리 — 관리자 전용.
 * 명세의 users 리소스에는 이메일이 없다. 식별자는 username 이다.
 */

const INITIAL_USERS: User[] = [
    { user_id: 1, username: "admin01", name: "김관리자", role: "ADMIN", is_active: true, created_at: "2026-01-05T00:00:00Z" },
    { user_id: 2, username: "sales01", name: "이영업", role: "SALES", is_active: true, created_at: "2026-01-10T00:00:00Z" },
    { user_id: 3, username: "wh01", name: "박창고", role: "WAREHOUSE", is_active: true, created_at: "2026-01-10T00:00:00Z" },
    { user_id: 4, username: "sales02", name: "최담당", role: "SALES", is_active: true, created_at: "2026-02-01T00:00:00Z" },
    { user_id: 5, username: "wh02", name: "정창고", role: "WAREHOUSE", is_active: false, created_at: "2026-02-15T00:00:00Z" },
    { user_id: 6, username: "sales03", name: "강영업", role: "SALES", is_active: true, created_at: "2026-03-01T00:00:00Z" },
    { user_id: 7, username: "admin02", name: "오관리", role: "ADMIN", is_active: false, created_at: "2026-03-20T00:00:00Z" },
    { user_id: 8, username: "wh03", name: "한담당", role: "WAREHOUSE", is_active: true, created_at: "2026-04-01T00:00:00Z" },
]

const EMPTY_FORM = { username: "", name: "", role: "SALES" as UserRole, password: "" }

const SORT_OPTIONS = [
    { key: "default", label: "기본 (ID순)" },
    { key: "active", label: "활성화 우선" },
    { key: "inactive", label: "비활성화 우선" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["key"]

const ROLE_FILTERS = ["전체", ...USER_ROLES] as const
type RoleFilter = (typeof ROLE_FILTERS)[number]

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(INITIAL_USERS)
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("전체")
    const [sort, setSort] = useState<SortKey>("default")
    const [sortMenu, setSortMenu] = useState<RoleFilter | null>(null)
    const [search, setSearch] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [editUser, setEditUser] = useState<User | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)

    const filtered = users.filter((u) => {
        const matchRole = roleFilter === "전체" || u.role === roleFilter
        const matchSearch = u.name.includes(search) || u.username.includes(search)
        return matchRole && matchSearch
    })

    const sorted = [...filtered].sort((a, b) => {
        switch (sort) {
            case "active":
                return (a.is_active ? 0 : 1) - (b.is_active ? 0 : 1)
            case "inactive":
                return (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0)
            default:
                return a.user_id - b.user_id
        }
    })

    const openCreate = () => {
        setEditUser(null)
        setForm(EMPTY_FORM)
        setShowModal(true)
    }

    const openEdit = (u: User) => {
        setEditUser(u)
        // 4.3 수정에서는 username을 바꿀 수 없다. 비밀번호는 재설정할 때만 보낸다
        setForm({ username: u.username, name: u.name, role: u.role, password: "" })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editUser) {
            setUsers((prev) =>
                prev.map((u) =>
                    u.user_id === editUser.user_id ? { ...u, name: form.name, role: form.role } : u,
                ),
            )
        } else {
            const newUser: User = {
                user_id: Math.max(0, ...users.map((u) => u.user_id)) + 1,
                username: form.username,
                name: form.name,
                role: form.role,
                is_active: true,
                created_at: new Date().toISOString(),
            }
            setUsers((prev) => [...prev, newUser])
        }
        setShowModal(false)
    }

    /** 4.4 삭제는 소프트 삭제(is_active=false)이고, 4.3으로 다시 활성화한다 */
    const toggleActive = (userId: number) => {
        setUsers((prev) =>
            prev.map((u) => (u.user_id === userId ? { ...u, is_active: !u.is_active } : u)),
        )
    }

    const stats = {
        total: users.length,
        active: users.filter((u) => u.is_active).length,
        admin: users.filter((u) => u.role === "ADMIN").length,
        sales: users.filter((u) => u.role === "SALES").length,
        warehouse: users.filter((u) => u.role === "WAREHOUSE").length,
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
                    { label: ROLE_LABELS.ADMIN, value: stats.admin, color: "#1D4ED8" },
                    { label: ROLE_LABELS.SALES, value: stats.sales, color: "#166534" },
                    { label: ROLE_LABELS.WAREHOUSE, value: stats.warehouse, color: "#9A3412" },
                ].map((s) => (
                    <div key={s.label} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                        <p className="text-xs" style={{ color: "#999" }}>{s.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters — 역할 버튼을 누르면 정렬 기준 메뉴가 열린다 */}
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
                        placeholder="이름, 아이디 검색..."
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
                            {["ID", "아이디", "이름", "역할", "상태", "생성일", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#aaa", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {sorted.map((u, i) => {
                            const rc = ROLE_TONES[u.role]
                            return (
                                <tr
                                    key={u.user_id}
                                    style={{ borderTop: i > 0 ? "1px solid #F5F5F5" : "none", opacity: u.is_active ? 1 : 0.55 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                >
                                    <td className="px-4 py-3 text-xs" style={{ color: "#ccc", fontFamily: "'Inter', sans-serif" }}>{u.user_id}</td>
                                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#666" }}>{u.username}</td>
                                    <td className="px-4 py-3 font-semibold" style={{ color: "#1a1a1a" }}>{u.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>
                                            {ROLE_LABELS[u.role]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{
                                                background: u.is_active ? "#F0FDF4" : "#FEF2F2",
                                                color: u.is_active ? "#166534" : "#DC2626",
                                            }}
                                        >
                                            {u.is_active ? "활성" : "비활성"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{formatDate(u.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-3">
                                            <button onClick={() => openEdit(u)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>수정</button>
                                            <button
                                                onClick={() => toggleActive(u.user_id)}
                                                className="text-xs font-medium"
                                                style={{ color: u.is_active ? "#DC2626" : "#059669" }}
                                            >
                                                {u.is_active ? "비활성화" : "활성화"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                {sorted.length === 0 && (
                    <div className="py-14 text-center text-sm" style={{ color: "#999" }}>
                        조건에 맞는 계정이 없습니다.
                    </div>
                )}
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
                        <button onClick={() => setShowModal(false)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h3 className="font-semibold text-lg mb-6" style={{ color: "#1a1a1a" }}>
                            {editUser ? "계정 수정" : "계정 생성"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>아이디</label>
                                <input
                                    value={form.username}
                                    onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                                    placeholder="user01"
                                    // 4.3 수정에서는 username을 바꿀 수 없다
                                    disabled={editUser !== null}
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{
                                        border: "1px solid #E5EAF0",
                                        borderRadius: 6,
                                        color: "#333",
                                        background: editUser ? "#F7F9FC" : "white",
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>이름</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="홍길동"
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>
                                    비밀번호 <span style={{ color: "#aaa" }}>(8~64자)</span>
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder={editUser ? "변경 시에만 입력" : "비밀번호 입력"}
                                    autoComplete="new-password"
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>역할</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                                    className="w-full px-3 py-2 text-sm outline-none"
                                    style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333", background: "white" }}
                                >
                                    {USER_ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {ROLE_LABELS[role]} ({role})
                                        </option>
                                    ))}
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
