import { CSSProperties, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react"
import { aiApi } from "../../api"
import {
  AI_MESSAGE_MAX_LENGTH,
  DEFAULT_CAPABILITIES,
  buildHistory,
  newMessageId,
  suggestionList,
  toChatError,
} from "../../lib/chatbot"
import type { ChatMessage } from "../../lib/chatbot"
import type { AiCapabilities, AuthUser } from "../../types/api"
import ChatAnswerCard from "./ChatAnswerCard"

interface Props {
  user: AuthUser
  onNavigate?: (route: "inventory" | "dashboard") => void
}

/** 이 시간이 지나면 "조금 더 걸리고 있어요" 안내를 띄운다 */
const SLOW_HINT_SECONDS = 12

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-[#1677FF]"
      aria-hidden="true"
    />
  )
}

/**
 * 공통 레이아웃 오른쪽 아래에 붙는 AI 챗봇 패널.
 * 화면을 옮겨 다녀도 AdminLayout 안에 있으므로 대화가 유지되고, 로그아웃하면 사라진다.
 */
export default function ChatbotPanel({ user, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [caps, setCaps] = useState<AiCapabilities>(DEFAULT_CAPABILITIES)
  const [unread, setUnread] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const openRef = useRef(open)
  openRef.current = open

  // 2. 서버 capabilities가 있으면 추천 질문을 그걸로 바꾼다. 없으면(404 등) 기본값 유지
  useEffect(() => {
    if (!open) return
    let alive = true
    aiApi
      .capabilities()
      .then((c) => {
        if (alive && c?.capabilities?.length) setCaps(c)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open])

  // 새 메시지가 오면 맨 아래로
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending, open])

  useEffect(() => {
    if (open) {
      setUnread(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // 로딩 경과 시간
  useEffect(() => {
    if (!pending) return
    setElapsed(0)
    const started = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(t)
  }, [pending])

  // 패널이 사라지면(로그아웃 등) 진행 중인 요청을 끊는다
  useEffect(() => () => abortRef.current?.abort(), [])

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || pending) return
      if (text.length > AI_MESSAGE_MAX_LENGTH) return

      const history = buildHistory(messages)
      const userMsg: ChatMessage = { id: newMessageId(), role: "user", content: text, status: "done" }
      const botId = newMessageId()
      setMessages((prev) => [...prev, userMsg, { id: botId, role: "assistant", content: "", status: "pending", question: text }])
      setInput("")
      setPending(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await aiApi.chat({ message: text, history }, controller.signal)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? { ...m, content: res.answer ?? "", status: "done", response: res, received_at: new Date().toISOString() }
              : m,
          ),
        )
      } catch (err) {
        const view = toChatError(err)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, status: view.kind === "canceled" ? "canceled" : "error", error: view } : m,
          ),
        )
      } finally {
        abortRef.current = null
        setPending(false)
        if (!openRef.current) setUnread(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    },
    [messages, pending],
  )

  const cancel = () => abortRef.current?.abort()

  const reset = () => {
    abortRef.current?.abort()
    setMessages([])
    setInput("")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중 Enter는 글자 확정용이므로 전송하지 않는다
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
    if (e.key === "Escape") setOpen(false)
  }

  const suggestions = suggestionList(caps)
  const over = input.length > AI_MESSAGE_MAX_LENGTH
  const canSend = !pending && input.trim().length > 0 && !over

  return (
    <>
      {/* 열기 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{ background: "#0B3D91" }}
        aria-label={open ? "AI 챗봇 닫기" : "AI 챗봇 열기"}
        aria-expanded={open}
        data-testid="ai-chat-toggle"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <line x1="8" y1="9" x2="16" y2="9" />
            <line x1="8" y1="13" x2="13" y2="13" />
          </svg>
        )}
        {unread && !open && <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" aria-label="새 답변" />}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="PharmLink AI 챗봇"
          className="fixed bottom-24 right-6 z-40 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F7F9FC] shadow-2xl max-sm:inset-x-3 max-sm:bottom-24 max-sm:right-3"
          style={{ width: "min(460px, calc(100vw - 24px))", height: "min(640px, calc(100vh - 128px))", fontFamily: "'Pretendard', 'Inter', sans-serif" }}
          data-testid="ai-chat-panel"
        >
          {/* 헤더 */}
          <header className="flex shrink-0 items-center justify-between px-4 py-3 text-white" style={{ background: "#0B3D91" }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold">AI 도우미 소리</p>
              <p className="text-[11px] text-white/60">재고 · 상품 조회 전용 · {user.name}님</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                disabled={messages.length === 0}
                className="rounded px-2 py-1 text-[11.5px] text-white/80 hover:bg-white/10 disabled:opacity-40"
                title="대화 초기화"
              >
                새 대화
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-white/80 hover:bg-white/10" aria-label="닫기">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          {/* 대화 */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite" data-testid="ai-chat-list">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-[13px] leading-relaxed text-slate-600">
                  안녕하세요, {user.name}님. 재고 부족 상품, 상품별·창고별 재고를 자연어로 물어보세요.
                  <br />
                  <span className="text-[12px] text-slate-400">데이터 조회만 할 수 있고, 재고 변경이나 주문 처리는 하지 않아요.</span>
                </div>
                <div>
                  <p className="mb-1.5 px-1 text-[11.5px] font-medium text-slate-500">이렇게 물어보세요</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-[12.5px] text-slate-700 hover:border-[#1677FF] hover:text-[#1677FF]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm px-3.5 py-2 text-[13.5px] text-white" style={{ background: "#1677FF" }}>
                      {m.content}
                    </div>
                  </div>
                )
              }
              if (m.status === "pending") {
                return (
                  <div key={m.id} className="flex" data-testid="ai-chat-loading">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <Spinner />
                        <span>ERP 데이터를 조회하고 답변을 만드는 중이에요{elapsed > 0 ? ` (${elapsed}초)` : ""}</span>
                      </div>
                      {elapsed >= SLOW_HINT_SECONDS && (
                        <p className="mt-1.5 text-[11.5px] text-slate-400">평소보다 오래 걸리고 있어요. 조금만 더 기다리거나 취소할 수 있어요.</p>
                      )}
                      <button type="button" onClick={cancel} className="mt-1.5 text-[12px] font-medium text-slate-500 underline hover:text-slate-800">
                        취소
                      </button>
                    </div>
                  </div>
                )
              }
              if (m.status === "error" || m.status === "canceled") {
                const e = m.error!
                const isErr = m.status === "error"
                return (
                  <div key={m.id} className="flex" data-testid="ai-chat-error" data-kind={e.kind}>
                    <div
                      className="max-w-[90%] rounded-lg border px-3.5 py-2.5 text-[13px]"
                      style={isErr ? { borderColor: "#FECACA", background: "#FEF2F2", color: "#991B1B" } : { borderColor: "#E2E8F0", background: "white", color: "#475569" }}
                      role={isErr ? "alert" : undefined}
                    >
                      <p className="font-semibold">{e.title}</p>
                      <p className="mt-0.5 leading-relaxed" style={{ color: isErr ? "#B91C1C" : "#64748B" }}>
                        {e.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        {e.retryable && m.question && (
                          <button
                            type="button"
                            onClick={() => {
                              setMessages((prev) => {
                                // 실패한 질문·오류 쌍을 지우고 같은 질문을 다시 보낸다
                                const idx = prev.findIndex((x) => x.id === m.id)
                                return idx > 0 ? [...prev.slice(0, idx - 1), ...prev.slice(idx + 1)] : prev
                              })
                              void send(m.question!)
                            }}
                            disabled={pending}
                            className="text-[12px] font-medium underline disabled:opacity-40"
                          >
                            다시 시도
                          </button>
                        )}
                        {e.code && <span className="text-[10.5px] opacity-60">{e.code}</span>}
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={m.id} className="flex">
                  <div className="w-full">
                    <ChatAnswerCard message={m} onNavigate={onNavigate} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 입력 */}
          <form
            className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="예: 1번 창고 부족 재고 알려줘"
                aria-label="질문 입력"
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#1677FF]"
                style={{ fieldSizing: "content" } as CSSProperties}
                data-testid="ai-chat-input"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-10 shrink-0 items-center justify-center rounded-lg px-3.5 text-[13px] font-medium text-white disabled:opacity-40"
                style={{ background: "#0B3D91" }}
                data-testid="ai-chat-send"
              >
                {pending ? <Spinner /> : "보내기"}
              </button>
            </div>
            <div className="mt-1 flex justify-between px-0.5 text-[11px] text-slate-400">
              <span>Enter 전송 · Shift+Enter 줄바꿈</span>
              <span style={over ? { color: "#DC2626", fontWeight: 600 } : undefined}>
                {input.length.toLocaleString("ko-KR")} / {AI_MESSAGE_MAX_LENGTH.toLocaleString("ko-KR")}
              </span>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
