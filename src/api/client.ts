/**
 * API 클라이언트.
 *
 * 명세서 14장 공통 응답 구조(Envelope)를 벗겨내고 data만 돌려준다. 호출부는
 * success 플래그를 매번 확인하지 않고, 실패는 ApiError 예외로 받는다.
 */

import type {
  ApiErrorDetail,
  ErrorCode,
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  Page,
  RefreshResponse,
  SuccessResponse,
} from "../types/api"

/** 1.2 Base URL — 배포 환경에서는 VITE_API_BASE_URL 로 주입한다 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1"

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details: ApiErrorDetail[]

  constructor(status: number, code: ErrorCode, message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }

  /** 네트워크 장애처럼 서버 응답 자체가 없는 경우 */
  static network(cause: unknown) {
    return new ApiError(0, "INTERNAL_SERVER_ERROR", "서버에 연결할 수 없습니다.", [
      { issue: String(cause) },
    ])
  }
}

/* ────────────────────────────── 토큰 보관 ────────────────────────────── */

const ACCESS_TOKEN_KEY = "pharmlink.access_token"
const REFRESH_TOKEN_KEY = "pharmlink.refresh_token"

/**
 * access_token은 메모리를 우선 쓰고 localStorage를 되살림 용도로 둔다.
 * 새로고침해도 로그인이 유지되어야 해서 저장은 하되, 매 요청마다 읽지는 않는다.
 */
let accessToken: string | null = null

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // 프라이빗 모드 등에서 접근이 막히면 메모리만 사용한다
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* 저장 실패는 무시 — 세션 동안은 메모리 토큰으로 동작한다 */
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (accessToken === null) accessToken = readStorage(ACCESS_TOKEN_KEY)
    return accessToken
  },
  getRefreshToken(): string | null {
    return readStorage(REFRESH_TOKEN_KEY)
  },
  set(access: string, refresh?: string) {
    accessToken = access
    writeStorage(ACCESS_TOKEN_KEY, access)
    if (refresh !== undefined) writeStorage(REFRESH_TOKEN_KEY, refresh)
  },
  clear() {
    accessToken = null
    writeStorage(ACCESS_TOKEN_KEY, null)
    writeStorage(REFRESH_TOKEN_KEY, null)
  },
}

/** 토큰이 완전히 만료되어 재로그인이 필요할 때 앱에 알리기 위한 훅 */
type SessionExpiredHandler = () => void
let onSessionExpired: SessionExpiredHandler = () => {}

export function setSessionExpiredHandler(handler: SessionExpiredHandler) {
  onSessionExpired = handler
}

/* ────────────────────────────── 쿼리스트링 ────────────────────────────── */

export type QueryValue = string | number | boolean | undefined | null

/** undefined·null·빈 문자열은 보내지 않는다. 쿼리 파라미터는 snake_case(1.3) */
export function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return ""
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.append(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

/* ────────────────────────────── 요청 ────────────────────────────── */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, QueryValue>
  /** 인증 헤더를 붙이지 않는다 (로그인·토큰 재발급) */
  anonymous?: boolean
  signal?: AbortSignal
}

async function parseError(response: Response): Promise<ApiError> {
  let code: ErrorCode = "INTERNAL_SERVER_ERROR"
  let message = `요청에 실패했습니다. (HTTP ${response.status})`
  let details: ApiErrorDetail[] = []
  try {
    const body = (await response.json()) as ErrorResponse
    if (body?.error) {
      code = body.error.code
      message = body.error.message
      details = body.error.details ?? []
    }
  } catch {
    /* 에러 바디가 JSON이 아닌 경우 기본 메시지를 쓴다 */
  }
  return new ApiError(response.status, code, message, details)
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, query, anonymous, signal } = options
  const headers: Record<string, string> = {}

  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (!anonymous) {
    const token = tokenStore.getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  try {
    return await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw ApiError.network(cause)
  }
}

/**
 * access_token이 만료되면 3.2 토큰 재발급을 한 번 시도하고 원래 요청을 재시도한다.
 * 동시에 여러 요청이 401을 받아도 재발급은 한 번만 일어나도록 진행 중인 Promise를 공유한다.
 */
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refresh_token = tokenStore.getRefreshToken()
  if (!refresh_token) return false

  const response = await rawFetch("/auth/refresh", {
    method: "POST",
    body: { refresh_token },
    anonymous: true,
  })

  if (!response.ok) return false

  const body = (await response.json()) as SuccessResponse<RefreshResponse>
  tokenStore.set(body.data.access_token)
  return true
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  let response = await rawFetch(path, options)

  if (response.status === 401 && !options.anonymous) {
    const refreshed = await ensureRefreshed()
    if (refreshed) {
      response = await rawFetch(path, options)
    } else {
      tokenStore.clear()
      onSessionExpired()
    }
  }

  return response
}

/** 응답 data만 돌려준다 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options)
  if (!response.ok) throw await parseError(response)
  const body = (await response.json()) as SuccessResponse<T>
  return body.data
}

/** 목록 API — data와 pagination을 함께 돌려준다 */
export async function requestPage<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Page<T>> {
  const response = await send(path, options)
  if (!response.ok) throw await parseError(response)
  const body = (await response.json()) as SuccessResponse<T[]>
  return {
    data: body.data,
    pagination: body.pagination ?? {
      page: 1,
      page_size: body.data.length,
      total_count: body.data.length,
      total_pages: 1,
    },
  }
}

/**
 * 목록 API를 마지막 페이지까지 모두 받아 한 배열로 합친다.
 * 화면이 클라이언트 필터링을 하는 동안 서버 page_size 최대값(100)으로 나눠 받는다.
 */
export async function fetchAllPages<T>(fetchPage: (page: number, pageSize: number) => Promise<Page<T>>): Promise<T[]> {
  const pageSize = 100
  const first = await fetchPage(1, pageSize)
  const rows = [...first.data]
  for (let page = 2; page <= first.pagination.total_pages; page++) {
    rows.push(...(await fetchPage(page, pageSize)).data)
  }
  return rows
}

/** 화면에 보여 줄 오류 문구. VALIDATION_ERROR면 어떤 필드가 문제인지 덧붙인다 */
export function errorMessage(err: unknown, fallback = "요청 처리 중 오류가 발생했습니다."): string {
  if (!(err instanceof ApiError)) return fallback
  if (err.code !== "VALIDATION_ERROR") return err.message
  const issues = err.details
    .map((d) => (d.field && d.issue ? `${d.field}: ${d.issue}` : d.issue))
    .filter(Boolean)
  return issues.length > 0 ? `${err.message} (${issues.join(", ")})` : err.message
}

/** 204 No Content 응답 */
export async function requestEmpty(path: string, options: RequestOptions = {}): Promise<void> {
  const response = await send(path, options)
  if (!response.ok) throw await parseError(response)
}

/** 9.5 납품서 PDF — 유일하게 Envelope를 따르지 않는다 */
export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await send(path, options)
  if (!response.ok) throw await parseError(response)
  return response.blob()
}

/* ────────────────────────────── 인증 진입점 ────────────────────────────── */

/** 로그인 성공 시 토큰을 저장한다 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
    anonymous: true,
  })
  tokenStore.set(data.access_token, data.refresh_token)
  return data
}

/**
 * 로그아웃. 서버 호출이 실패해도 클라이언트 토큰은 반드시 지운다
 * (access_token은 서버가 즉시 무효화할 수 없으므로 — 3.3 참고).
 */
export async function logout(): Promise<void> {
  try {
    await requestEmpty("/auth/logout", { method: "POST" })
  } finally {
    tokenStore.clear()
  }
}
