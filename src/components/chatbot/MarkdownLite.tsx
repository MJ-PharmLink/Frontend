import { Fragment, ReactNode } from "react"

/**
 * Gemini 답변에 자주 나오는 마크다운만 React 요소로 그린다.
 * (제목, 글머리표·번호 목록, 표, 굵게, 인라인 코드, 문단)
 * HTML 문자열을 그대로 넣지 않으므로 답변에 태그가 섞여도 실행되지 않는다.
 */

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "p"; lines: string[] }

const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith("|")) s = s.slice(1)
  if (s.endsWith("|")) s = s.slice(0, -1)
  return s.split("|").map((c) => c.trim())
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed)
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] })
      i++
      continue
    }

    if (trimmed.includes("|") && i + 1 < lines.length && TABLE_DIVIDER.test(lines[i + 1])) {
      const header = splitRow(trimmed)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim().includes("|")) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push({ type: "table", header, rows })
      continue
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""))
        i++
      }
      blocks.push({ type: "ul", items })
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""))
        i++
      }
      blocks.push({ type: "ol", items })
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && TABLE_DIVIDER.test(lines[i + 1]))
    ) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push({ type: "p", lines: para })
  }

  return blocks
}

/** **굵게**, `코드` 만 처리한다 */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith("**")) {
      out.push(
        <strong key={k++} className="font-semibold text-slate-900">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else {
      out.push(
        <code key={k++} className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-800">
          {tok.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function MarkdownLite({ text }: { text: string }) {
  const blocks = parseMarkdown(text)
  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed text-slate-700 break-words">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case "heading":
            return (
              <p key={idx} className="font-semibold text-slate-900" style={{ fontSize: b.level <= 2 ? 14.5 : 13.5 }}>
                {inline(b.text)}
              </p>
            )
          case "ul":
            return (
              <ul key={idx} className="list-disc space-y-1 pl-5 marker:text-slate-400">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            )
          case "ol":
            return (
              <ol key={idx} className="list-decimal space-y-1 pl-5 marker:text-slate-400">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ol>
            )
          case "table":
            return (
              <div key={idx} className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {b.header.map((h, j) => (
                        <th key={j} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium">
                          {inline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-t border-slate-100">
                        {b.header.map((_, c) => (
                          <td key={c} className="whitespace-nowrap px-2.5 py-1.5 tabular-nums">
                            {inline(r[c] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          default:
            return (
              <p key={idx}>
                {b.lines.map((l, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    {inline(l)}
                  </Fragment>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
