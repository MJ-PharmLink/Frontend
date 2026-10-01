import { ReactNode, useState } from "react"
import React from 'react';
import type { AuthUser, AdminRoute } from "../App"

interface NavItem {
  id: AdminRoute
  label: string
  icon: ReactNode
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    roles: ["admin", "sales", "warehouse"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "partners",
    label: "거래처 관리",
    roles: ["admin", "sales"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
  },
  {
    id: "products",
    label: "상품 관리",
    roles: ["admin", "warehouse"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: "inventory",
    label: "재고 관리",
    roles: ["admin", "warehouse", "sales"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "주문·납품",
    roles: ["admin", "sales", "warehouse"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    id: "margin",
    label: "매입·매출·마진",
    roles: ["admin", "warehouse"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
]

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  sales: "영업담당",
  warehouse: "창고담당",
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#0B3D91",
  sales: "#1677FF",
  warehouse: "#059669",
}

interface Props {
  user: AuthUser
  currentRoute: AdminRoute
  onNavigate: (r: AdminRoute) => void
  onLogout: () => void
  children: ReactNode
}

export default function AdminLayout({ user, currentRoute, onNavigate, onLogout, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const accessible = NAV_ITEMS.filter((n) => n.roles.includes(user.role))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F9FC", fontFamily: "'Pretendard', 'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-200 shrink-0"
        style={{
          width: sidebarOpen ? 240 : 64,
          background: "#0B3D91",
          borderRight: "none",
          overflowX: "hidden",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center px-4 shrink-0"
          style={{ height: 64, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: 6, fontFamily: "'Inter', sans-serif" }}
              >
                PL
              </div>
              <div className="min-w-0">
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", color: "white", lineHeight: 1.2 }}>PHARMLINK</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.03em" }}>ERP System</p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center text-white font-bold text-sm mx-auto"
              style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: 6, fontFamily: "'Inter', sans-serif" }}
            >
              PL
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {accessible.map((item) => {
            const active = currentRoute === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center transition-all duration-150"
                style={{
                  gap: sidebarOpen ? 12 : 0,
                  padding: sidebarOpen ? "10px 16px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.6)",
                  borderLeft: active ? "3px solid white" : "3px solid transparent",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)" }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User info */}
        <div
          className="shrink-0 p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div
                className="shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: 32, height: 32, borderRadius: "50%", background: ROLE_COLORS[user.role] }}
              >
                {user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{ROLE_LABELS[user.role]}</p>
              </div>
              <button onClick={onLogout} title="로그아웃" className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center text-white text-xs font-bold"
                style={{ width: 32, height: 32, borderRadius: "50%", background: ROLE_COLORS[user.role] }}
              >
                {user.name[0]}
              </div>
              <button onClick={onLogout} title="로그아웃" className="opacity-50 hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 shrink-0"
          style={{ height: 64, background: "white", borderBottom: "1px solid #E5EAF0" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded transition-colors duration-150"
              style={{ color: "#666" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F9FC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
                {NAV_ITEMS.find((n) => n.id === currentRoute)?.label}
              </p>
              <p className="text-xs" style={{ color: "#999" }}>PHARMLINK ERP</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="text-xs font-medium px-2.5 py-1 rounded"
              style={{ background: `${ROLE_COLORS[user.role]}18`, color: ROLE_COLORS[user.role] }}
            >
              {ROLE_LABELS[user.role]}
            </div>
            <span className="text-sm font-medium" style={{ color: "#444" }}>{user.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
