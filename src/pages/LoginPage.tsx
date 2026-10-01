import { useState } from "react"
import React from 'react';
import type { AuthUser, UserRole } from "../App"

interface Props {
  onLogin: (user: AuthUser) => void
  onBack: () => void
}

const DEMO_USERS: Record<string, { password: string; role: UserRole; name: string }> = {
  "admin@pharmlink.co.kr": { password: "admin123", role: "admin", name: "김관리자" },
  "sales@pharmlink.co.kr": { password: "sales123", role: "sales", name: "이영업" },
  "warehouse@pharmlink.co.kr": { password: "wh123", role: "warehouse", name: "박창고" },
}

export default function LoginPage({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setTimeout(() => {
      const found = DEMO_USERS[email]
      if (found && found.password === password) {
        onLogin({ name: found.name, role: found.role, email })
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.")
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Pretendard', 'Inter', sans-serif" }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-16"
        style={{ width: "45%", background: "#0B3D91", color: "white" }}
      >
        <button onClick={onBack} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          홈으로
        </button>

        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: "0.08em" }}>PHARMLINK</p>
          <p style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>팜링크 ERP 시스템</p>
          <h2 className="font-semibold leading-tight mt-10 mb-6" style={{ fontSize: 32, opacity: 0.95 }}>
            의약품 유통의<br />모든 순간,<br />팜링크가 함께합니다.
          </h2>
          <p style={{ fontSize: 15, opacity: 0.65, lineHeight: 1.8 }}>
            재고 관리 · 주문 처리 · 납품 추적<br />
            매입/매출 분석을 하나의 시스템에서.
          </p>
        </div>

        <div className="flex gap-6 flex-wrap">
          {[
            { label: "거래처", value: "120+" },
            { label: "의약품", value: "10,000+" },
            { label: "재고 정확도", value: "99.9%" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-bold text-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
              <p className="text-xs opacity-50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "#F7F9FC" }}>
        <button
          onClick={onBack}
          className="lg:hidden self-start mb-8 flex items-center gap-2 text-sm"
          style={{ color: "#666" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          홈으로
        </button>

        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="font-semibold text-2xl mb-2" style={{ color: "#1a1a1a" }}>로그인</h1>
            <p className="text-sm" style={{ color: "#888" }}>팜링크 ERP 시스템에 접속합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#444" }}>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소 입력"
                required
                className="w-full px-4 py-3 text-sm outline-none transition-all duration-150"
                style={{
                  border: "1.5px solid #E5EAF0",
                  borderRadius: 8,
                  background: "white",
                  color: "#333",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0B3D91")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5EAF0")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#444" }}>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                required
                className="w-full px-4 py-3 text-sm outline-none transition-all duration-150"
                style={{
                  border: "1.5px solid #E5EAF0",
                  borderRadius: 8,
                  background: "white",
                  color: "#333",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0B3D91")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5EAF0")}
              />
            </div>

            {error && (
              <p className="text-sm px-4 py-3" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-sm transition-all duration-150 mt-2"
              style={{
                background: loading ? "#7A9CD6" : "#0B3D91",
                color: "white",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "인증 중..." : "로그인"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-10 p-5" style={{ background: "white", borderRadius: 8, border: "1px solid #E5EAF0" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#999" }}>데모 계정</p>
            <div className="space-y-2">
              {[
                { role: "관리자", email: "admin@pharmlink.co.kr", pw: "admin123" },
                { role: "영업담당", email: "sales@pharmlink.co.kr", pw: "sales123" },
                { role: "창고담당", email: "warehouse@pharmlink.co.kr", pw: "wh123" },
              ].map((d) => (
                <button
                  key={d.role}
                  onClick={() => { setEmail(d.email); setPassword(d.pw) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs transition-colors duration-150 text-left"
                  style={{ borderRadius: 6, border: "1px solid #F0F0F0" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F9FC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <span className="font-medium" style={{ color: "#333" }}>{d.role}</span>
                  <span style={{ color: "#999" }}>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
