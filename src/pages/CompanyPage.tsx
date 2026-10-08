import { useState } from "react"
import type { AuthUser } from "../App"
import { COMPANY } from "../data/sample"
import { formatDateTime } from "../lib/domain"
import type { Company } from "../types/api"

/**
 * 13. 회사 정보.
 *
 * 싱글 테넌트라 항상 1건이고 생성·삭제 API는 없다. 조회는 로그인 사용자,
 * 수정은 관리자만 가능하며 수정은 전체 교체(PUT)다. 이 정보는 납품서 PDF의
 * 공급자 영역과 화면 상단 회사명에 쓰인다.
 */

interface Props {
  user: AuthUser
}

/** 사업자등록번호 NNN-NN-NNNNN */
function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

type FieldKey = keyof Omit<Company, "company_id" | "updated_at">

const FIELDS: { key: FieldKey; label: string; required: boolean; placeholder: string; hint?: string }[] = [
  { key: "name", label: "회사명", required: true, placeholder: "팜링크약품" },
  { key: "business_number", label: "사업자등록번호", required: true, placeholder: "000-00-00000" },
  { key: "representative_name", label: "대표자명", required: true, placeholder: "김대표" },
  {
    key: "wholesale_license_number",
    label: "의약품 도매상 허가번호",
    required: false,
    placeholder: "제2026-서울-00123호",
    hint: "생략하면 저장되지 않습니다",
  },
  { key: "address", label: "주소", required: true, placeholder: "서울시 송파구 ..." },
  { key: "phone", label: "대표 전화", required: true, placeholder: "02-555-1234" },
  { key: "fax", label: "팩스", required: false, placeholder: "02-555-1235" },
  { key: "email", label: "대표 이메일", required: false, placeholder: "contact@pharmlink.co.kr" },
]

export default function CompanyPage({ user }: Props) {
  const [company, setCompany] = useState<Company>(COMPANY)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<FieldKey, string>>(() => toForm(COMPANY))
  const [error, setError] = useState<string | null>(null)

  // 13.2 수정은 관리자만 가능하다
  const canEdit = user.role === "ADMIN"

  function toForm(c: Company): Record<FieldKey, string> {
    return {
      name: c.name,
      business_number: c.business_number,
      representative_name: c.representative_name,
      wholesale_license_number: c.wholesale_license_number ?? "",
      address: c.address,
      phone: c.phone,
      fax: c.fax ?? "",
      email: c.email ?? "",
    }
  }

  const startEdit = () => {
    setForm(toForm(company))
    setError(null)
    setEditing(true)
  }

  const update = (key: FieldKey, value: string) =>
    setForm((prev) => ({ ...prev, [key]: key === "business_number" ? formatBusinessNumber(value) : value }))

  const save = () => {
    const missing = FIELDS.filter((f) => f.required && form[f.key].trim() === "")
    if (missing.length > 0) {
      return setError(`${missing.map((f) => f.label).join(", ")}은(는) 필수입니다.`)
    }
    if (form.business_number.replace(/\D/g, "").length !== 10) {
      return setError("사업자등록번호는 000-00-00000 형식이어야 합니다.")
    }
    if (form.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError("대표 이메일 형식이 올바르지 않습니다.")
    }

    // 전체 교체(PUT). 빈 값으로 보낸 선택 항목은 null이 된다
    setCompany((prev) => ({
      ...prev,
      name: form.name.trim(),
      business_number: form.business_number,
      representative_name: form.representative_name.trim(),
      wholesale_license_number: form.wholesale_license_number.trim() || null,
      address: form.address.trim(),
      phone: form.phone.trim(),
      fax: form.fax.trim() || null,
      email: form.email.trim() || null,
      updated_at: new Date().toISOString(),
    }))
    setEditing(false)
    setError(null)
  }

  const displayValue = (key: FieldKey) => {
    const value = company[key]
    return value === null || value === "" ? "-" : value
  }

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>회사 정보</h2>
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              납품서 공급자 영역과 화면 상단 회사명에 사용됩니다
            </p>
          </div>
          {canEdit && !editing && (
              <button
                  onClick={startEdit}
                  className="px-4 py-2 text-sm font-medium"
                  style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
              >
                정보 수정
              </button>
          )}
        </div>

        {!canEdit && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#F7F9FC", color: "#666", borderRadius: 6 }}>
              회사 정보 수정은 관리자만 가능합니다.
            </p>
        )}

        {error && (
            <p className="px-4 py-2.5 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 6 }}>
              {error}
            </p>
        )}

        <div className="bg-white" style={{ borderRadius: 8, border: "1px solid #E5EAF0" }}>
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #F0F0F0" }}>
            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
              {editing ? "회사 정보 수정" : company.name}
            </p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>
              최종 수정 {formatDateTime(company.updated_at)}
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#666" }}>
                    {field.label}
                    {!field.required && <span style={{ color: "#bbb" }}> (선택)</span>}
                  </label>
                  {editing ? (
                      <>
                        <input
                            value={form[field.key]}
                            onChange={(e) => update(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            inputMode={field.key === "business_number" ? "numeric" : undefined}
                            className="w-full px-3 py-2 text-sm outline-none"
                            style={{ border: "1px solid #E5EAF0", borderRadius: 6, color: "#333" }}
                        />
                        {field.hint && (
                            <p className="mt-1 text-xs" style={{ color: "#bbb" }}>{field.hint}</p>
                        )}
                      </>
                  ) : (
                      <p
                          className="text-sm py-2"
                          style={{
                            color: displayValue(field.key) === "-" ? "#bbb" : "#333",
                            fontFamily: field.key === "business_number" || field.key === "phone" || field.key === "fax"
                                ? "'Inter', sans-serif"
                                : undefined,
                          }}
                      >
                        {displayValue(field.key)}
                      </p>
                  )}
                </div>
            ))}
          </div>

          {editing && (
              <div className="flex gap-3 justify-end px-6 py-5" style={{ borderTop: "1px solid #F0F0F0" }}>
                <button
                    onClick={() => { setEditing(false); setError(null) }}
                    className="px-5 py-2 text-sm font-medium"
                    style={{ border: "1px solid #E5EAF0", borderRadius: 7, color: "#666" }}
                >
                  취소
                </button>
                <button
                    onClick={save}
                    className="px-5 py-2 text-sm font-medium"
                    style={{ background: "#0B3D91", color: "white", borderRadius: 7 }}
                >
                  저장
                </button>
              </div>
          )}
        </div>

        <p className="text-xs" style={{ color: "#aaa" }}>
          회사 정보는 시스템에 한 건만 존재하며 생성·삭제할 수 없습니다. 수정은 전체 교체 방식이라 비워 둔 선택 항목은 저장되지 않습니다.
        </p>
      </div>
  )
}
