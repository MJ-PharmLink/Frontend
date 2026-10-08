import { useState } from "react"
import { ApiError, login } from "../api"
import type { AuthUser } from "../types/api"

interface Props {
  onLogin: (user: AuthUser) => void
  onBack: () => void
}

/**
 * 백엔드가 아직 없을 때 화면을 확인하기 위한 대체 계정.
 *
 * VITE_API_BASE_URL 이 설정되어 있으면 3.1 로그인 API만 사용하고 이 목록은
 * 쳐다보지 않는다. 서버가 붙으면 .env 에 주소만 넣으면 되고, 이 상수와
 * 아래 분기는 그때 지우면 된다.
 */
const OFFLINE_ACCOUNTS: Record<string, { password: string; user: AuthUser }> = {
  admin01: { password: "admin123", user: { user_id: 1, username: "admin01", name: "김관리자", role: "ADMIN" } },
  sales01: { password: "sales123", user: { user_id: 2, username: "sales01", name: "이영업", role: "SALES" } },
  wh01: { password: "wh123", user: { user_id: 3, username: "wh01", name: "박창고", role: "WAREHOUSE" } },
}

/** 서버 주소가 주입되어 있으면 실제 API로만 인증한다 */
const HAS_BACKEND = Boolean(import.meta.env.VITE_API_BASE_URL)

export default function LoginPage({ onLogin, onBack }: Props) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!HAS_BACKEND) {
      const found = OFFLINE_ACCOUNTS[username]
      if (found && found.password === password) onLogin(found.user)
      else setError("아이디 또는 비밀번호가 일치하지 않습니다.")
      setLoading(false)
      return
    }

    try {
      // 3.1 로그인 — 성공하면 client.ts가 access/refresh 토큰을 보관한다
      const result = await login({ username, password })
      onLogin(result.user)
    } catch (err) {
      // 계정 존재 여부가 드러나지 않도록 서버 메시지를 그대로 보여준다
      setError(err instanceof ApiError ? err.message : "로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
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
              <label className="block text-sm font-medium mb-2" style={{ color: "#444" }}>아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 입력"
                autoComplete="username"
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
                autoComplete="current-password"
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
        </div>
      </div>
    </div>
  )
}
