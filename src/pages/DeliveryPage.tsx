import { useState } from "react"
import { ApiError, deliveriesApi } from "../api"
import type { AuthUser } from "../App"
import { COMPANY, CUSTOMERS, DELIVERIES, PARTNERS } from "../data/sample"
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TONES,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "../lib/domain"
import { DELIVERY_STATUSES } from "../types/api"
import type { DeliveryDetail, DeliveryStatus } from "../types/api"

/**
 * 9. 납품.
 *
 * WAITING → SHIPPED → DELIVERED 로만 전이한다. 재고는 주문 승인(8.4) 시점에
 * 이미 차감되었으므로 납품 상태를 바꿔도 재고는 변하지 않는다. 납품 완료(9.4)
 * 시점에 매출이 자동 생성된다.
 */

interface Props {
  user: AuthUser
}

/** 서버 주소가 있으면 9.5 PDF를 내려받고, 없으면 인쇄 미리보기로 대체한다 */
const HAS_BACKEND = Boolean(import.meta.env.VITE_API_BASE_URL)

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c)

/**
 * 명세 9.5의 PDF 포함 항목을 그대로 담은 인쇄용 문서.
 * 공급자는 회사 정보(13), 공급받는자는 거래처, 그리고 납품번호·주문번호·품목.
 */
function openPrintableDocument(delivery: DeliveryDetail) {
  const partner = PARTNERS.find((p) => p.partner_id === delivery.partner_id)
  const rows = delivery.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.item_name)}<div class="code">${escapeHtml(item.item_code)}</div></td>
        <td class="num">${item.quantity.toLocaleString("ko-KR")}</td>
        <td class="num">${item.unit_price.toLocaleString("ko-KR")}</td>
        <td class="num">${item.line_amount.toLocaleString("ko-KR")}</td>
      </tr>`,
    )
    .join("")

  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<title>납품서 ${delivery.delivery_id}</title>
<style>
  body { font-family: 'Pretendard','Malgun Gothic',sans-serif; color:#222; padding:40px; }
  h1 { font-size:22px; letter-spacing:.3em; text-align:center; margin:0 0 28px; }
  .meta { display:flex; justify-content:space-between; font-size:12px; color:#666; margin-bottom:20px; }
  .parties { display:flex; gap:16px; margin-bottom:24px; }
  .party { flex:1; border:1px solid #ddd; padding:14px 16px; font-size:12px; line-height:1.9; }
  .party h2 { font-size:12px; color:#888; margin:0 0 8px; font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th,td { border-bottom:1px solid #e5e5e5; padding:9px 8px; text-align:left; }
  th { background:#f7f9fc; color:#666; font-weight:600; }
  .num { text-align:right; font-variant-numeric:tabular-nums; }
  .code { color:#aaa; font-size:10px; }
  .total { margin-top:18px; text-align:right; font-size:14px; font-weight:700; }
  @media print { body { padding:0; } }
</style></head>
<body>
  <h1>납 품 서</h1>
  <div class="meta">
    <span>납품번호 ${delivery.delivery_id} · 주문번호 ${escapeHtml(delivery.order_number)}</span>
    <span>출고일 ${delivery.shipped_at ? delivery.shipped_at.slice(0, 10) : "-"} · 납품일 ${delivery.delivered_at ? delivery.delivered_at.slice(0, 10) : "-"}</span>
  </div>
  <div class="parties">
    <div class="party">
      <h2>공급자</h2>
      <div>${escapeHtml(COMPANY.name)}</div>
      <div>사업자등록번호 ${escapeHtml(COMPANY.business_number)}</div>
      <div>대표자 ${escapeHtml(COMPANY.representative_name)}</div>
      <div>${escapeHtml(COMPANY.address)}</div>
      <div>${escapeHtml(COMPANY.phone)}</div>
    </div>
    <div class="party">
      <h2>공급받는자</h2>
      <div>${escapeHtml(delivery.partner_name)}</div>
      <div>사업자등록번호 ${escapeHtml(partner?.business_number ?? "-")}</div>
      <div>${escapeHtml(partner?.address ?? "-")}</div>
      <div>${escapeHtml(partner?.phone ?? "-")}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>상품명</th><th class="num">수량</th><th class="num">판매단가</th><th class="num">품목금액</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">총 납품금액 ${delivery.total_amount.toLocaleString("ko-KR")}원</p>
</body></html>`

  const win = window.open("", "_blank", "width=860,height=1000")
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export default function DeliveryPage({ user }: Props) {
  const [deliveries, setDeliveries] = useState<DeliveryDetail[]>(DELIVERIES)
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "전체">("전체")
  const [partnerFilter, setPartnerFilter] = useState<number | "전체">("전체")
  const [detail, setDetail] = useState<DeliveryDetail | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)

  // 9.3 출고 완료와 9.4 납품 완료는 관리자·창고 권한이다
  const canProcess = user.role === "ADMIN" || user.role === "WAREHOUSE"

  const filtered = deliveries.filter((d) => {
    const matchStatus = statusFilter === "전체" || d.status === statusFilter
    const matchPartner = partnerFilter === "전체" || d.partner_id === partnerFilter
    return matchStatus && matchPartner
  })

  const counts = {
    WAITING: deliveries.filter((d) => d.status === "WAITING").length,
    SHIPPED: deliveries.filter((d) => d.status === "SHIPPED").length,
    DELIVERED: deliveries.filter((d) => d.status === "DELIVERED").length,
  }

  /** 9.3 출고 완료 처리 (WAITING → SHIPPED) */
  const ship = (delivery: DeliveryDetail) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.delivery_id === delivery.delivery_id
          ? { ...d, status: "SHIPPED", shipped_at: new Date().toISOString() }
          : d,
      ),
    )
    setDetail(null)
  }

  /** 9.4 납품 완료 처리 (SHIPPED → DELIVERED) — 매출이 자동 생성된다 */
  const complete = (delivery: DeliveryDetail) => {
    const cost = delivery.items.reduce((sum, i) => sum + i.quantity * Math.round(i.unit_price * 0.7), 0)
    setDeliveries((prev) =>
      prev.map((d) =>
        d.delivery_id === delivery.delivery_id
          ? { ...d, status: "DELIVERED", delivered_at: new Date().toISOString() }
          : d,
      ),
    )
    setDetail(null)
    setNotice(
      `납품 #${delivery.delivery_id} 완료 · 매출 ${formatMoney(delivery.total_amount)} 기록 (추정 마진 ${formatMoney(delivery.total_amount - cost)})`,
    )
  }

  /**
   * 9.5 납품서 PDF.
   *
   * 서버가 PDF binary를 돌려주는 유일한 엔드포인트다. 백엔드 주소가 없을 때는
   * 같은 내용을 브라우저 인쇄 창으로 띄워 미리 볼 수 있게 한다.
   */
  const downloadDocument = async (delivery: DeliveryDetail) => {
    if (!HAS_BACKEND) {
      openPrintableDocument(delivery)
      return
    }
    setDownloading(delivery.delivery_id)
    try {
      const blob = await deliveriesApi.document(delivery.delivery_id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `delivery-${delivery.delivery_id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "납품서를 내려받지 못했습니다.")
    } finally {
      setDownloading(null)
    }
  }

  const chipStyle = (active: boolean) => ({
    background: active ? "#0B3D91" : "#F0F2F5",
    color: active ? "white" : "#666",
  })

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>납품 관리</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              출고 대기 → 출고 완료 → 납품 완료 · 납품 완료 시 매출이 자동 생성됩니다
            </p>
          </div>
        </div>

        {notice && (
            <div
                className="flex items-center justify-between gap-4 px-5 py-3"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8 }}
            >
              <p className="text-sm" style={{ color: "#1D4ED8" }}>{notice}</p>
              <button onClick={() => setNotice(null)} aria-label="알림 닫기" className="text-sm shrink-0" style={{ color: "#1D4ED8" }}>✕</button>
            </div>
        )}

        {/* 상태 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {DELIVERY_STATUSES.map((s) => (
              <div key={s} className="bg-white px-4 py-4" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
                <p className="text-xs" style={{ color: "#999" }}>{DELIVERY_STATUS_LABELS[s]}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: DELIVERY_STATUS_TONES[s].color, fontFamily: "'Inter', sans-serif" }}>
                  {counts[s]}
                </p>
              </div>
          ))}
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStatusFilter("전체")} className="px-3 py-1 text-xs font-medium rounded-full" style={chipStyle(statusFilter === "전체")}>
            전체 ({deliveries.length})
          </button>
          {DELIVERY_STATUSES.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1 text-xs font-medium rounded-full" style={chipStyle(statusFilter === s)}>
                {DELIVERY_STATUS_LABELS[s]} ({counts[s]})
              </button>
          ))}
          <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value === "전체" ? "전체" : Number(e.target.value))}
              className="ml-auto px-3 py-1.5 text-xs outline-none cursor-pointer"
              style={{ border: "1px solid #E5EAF0", borderRadius: 7, background: "white" }}
          >
            <option value="전체">전체 고객사</option>
            {CUSTOMERS.map((p) => (
                <option key={p.partner_id} value={p.partner_id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* 목록 */}
        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1px solid #E5EAF0" }}>
                {["납품번호", "주문번호", "고객사", "금액", "상태", "출고일시", "납품일시", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {filtered.map((d, i) => (
                  <tr
                      key={d.delivery_id}
                      style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: "#666" }}>#{d.delivery_id}</td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: "#666" }}>{d.order_number}</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#1a1a1a" }}>{d.partner_name}</td>
                    <td className="px-5 py-4 font-medium" style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>{formatMoney(d.total_amount)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={DELIVERY_STATUS_TONES[d.status]}>
                        {DELIVERY_STATUS_LABELS[d.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{d.shipped_at ? formatDate(d.shipped_at) : "-"}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{d.delivered_at ? formatDate(d.delivered_at) : "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => setDetail(d)} className="text-xs font-medium" style={{ color: "#0B3D91" }}>상세</button>
                        {canProcess && d.status === "WAITING" && (
                            <button onClick={() => ship(d)} className="text-xs font-medium" style={{ color: "#1D4ED8" }}>출고 완료</button>
                        )}
                        {canProcess && d.status === "SHIPPED" && (
                            <button onClick={() => complete(d)} className="text-xs font-medium" style={{ color: "#059669" }}>납품 완료</button>
                        )}
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
              <div className="py-14 text-center text-sm" style={{ color: "#999" }}>조건에 맞는 납품이 없습니다.</div>
          )}
        </div>

        {/* 9.2 납품 상세 */}
        {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetail(null)}>
              <div className="bg-white w-full max-w-2xl p-8 relative" style={{ borderRadius: 12, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setDetail(null)} aria-label="닫기" className="absolute top-5 right-5 opacity-40 hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>납품 #{detail.delivery_id}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={DELIVERY_STATUS_TONES[detail.status]}>
                    {DELIVERY_STATUS_LABELS[detail.status]}
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: "#888" }}>{detail.order_number} · {detail.partner_name}</p>

                <table className="w-full text-sm mb-5">
                  <thead>
                  <tr style={{ background: "#F7F9FC" }}>
                    {["상품", "수량", "판매단가", "금액"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "#888", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody>
                  {detail.items.map((item, i) => (
                      <tr key={item.item_id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td className="px-3 py-2">
                          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{item.item_name}</p>
                          <p className="font-mono text-xs" style={{ color: "#aaa" }}>{item.item_code}</p>
                        </td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatNumber(item.quantity)}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: "#555", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.unit_price)}</td>
                        <td className="px-3 py-2 text-sm font-medium" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>{formatMoney(item.line_amount)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm pt-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                  {[
                    { label: "총 납품금액", value: formatMoney(detail.total_amount) },
                    { label: "납품 생성", value: formatDateTime(detail.created_at) },
                    { label: "출고일시", value: formatDateTime(detail.shipped_at) },
                    { label: "납품일시", value: formatDateTime(detail.delivered_at) },
                  ].map((row) => (
                      <div key={row.label}>
                        <p className="text-xs" style={{ color: "#999" }}>{row.label}</p>
                        <p className="mt-0.5" style={{ color: "#333" }}>{row.value}</p>
                      </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-7 justify-end">
                  <button
                      onClick={() => downloadDocument(detail)}
                      disabled={downloading === detail.delivery_id}
                      className="px-5 py-2 text-sm font-medium"
                      style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#0B3D91" }}
                  >
                    {downloading === detail.delivery_id ? "생성 중..." : "납품서"}
                  </button>
                  {canProcess && detail.status === "WAITING" && (
                      <button onClick={() => ship(detail)} className="px-5 py-2 text-sm font-medium" style={{ background: "#1D4ED8", color: "white", borderRadius: 7 }}>
                        출고 완료
                      </button>
                  )}
                  {canProcess && detail.status === "SHIPPED" && (
                      <button onClick={() => complete(detail)} className="px-5 py-2 text-sm font-medium" style={{ background: "#059669", color: "white", borderRadius: 7 }}>
                        납품 완료 (매출 생성)
                      </button>
                  )}
                  <button onClick={() => setDetail(null)} className="px-5 py-2 text-sm font-medium" style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}>닫기</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
