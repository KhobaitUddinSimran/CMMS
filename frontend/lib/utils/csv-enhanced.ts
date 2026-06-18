/**
 * Enhanced CSV generation — flat reports, and grouped block reports.
 * All output is UTF-8 BOM + RFC 4180 escaping.
 */

export type CsvCell = string | number | null | undefined

function e(v: CsvCell): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function _download(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Flat report ──────────────────────────────────────────────────────────────

/** Generate a flat title + header + data CSV */
export function generateReportCsv(
  filename: string,
  options: {
    titleRow?: string
    headers: string[]
    rows: CsvCell[][]
    summaryRows?: CsvCell[][]
    blankRowAfterTitle?: boolean
  }
): void {
  const lines: string[] = []
  if (options.titleRow) {
    lines.push(e(options.titleRow))
    if (options.blankRowAfterTitle !== false) lines.push('')
  }
  lines.push(options.headers.map(e).join(','))
  for (const row of options.rows) lines.push(row.map(e).join(','))
  if (options.summaryRows?.length) {
    lines.push('')
    for (const row of options.summaryRows) lines.push(row.map(e).join(','))
  }
  _download(filename, lines.join('\r\n'))
}

// ── Grouped block format ─────────────────────────────────────────────────────

/**
 * A course block:
 *  - courseHeader: one or more rows describing the course (not indented)
 *  - subHeaders:   column names for data rows (rendered with a leading blank cell)
 *  - rows:         data rows (rendered with a leading blank cell)
 *  - subtotals:    optional summary rows per block (leading blank cell)
 */
export interface CourseBlock {
  courseHeader: CsvCell[][]
  subHeaders: string[]
  rows: CsvCell[][]
  subtotals?: CsvCell[][]
}

/** Semester group for Full Year downloads */
export interface SemesterGroup {
  groupLabel: string
  blocks: CourseBlock[]
  groupSummary?: CsvCell[][]
}

function renderBlock(lines: string[], block: CourseBlock): void {
  for (const hRow of block.courseHeader) lines.push(hRow.map(e).join(','))
  if (block.subHeaders.length > 0) lines.push(['', ...block.subHeaders].map(e).join(','))
  for (const row of block.rows) lines.push(['', ...row].map(e).join(','))
  if (block.subtotals?.length) {
    for (const row of block.subtotals) lines.push(['', ...row].map(e).join(','))
  }
  lines.push('')
}

/** Single-semester grouped CSV — one block per course */
export function buildGroupedCsv(
  filename: string,
  titleRow: string,
  blocks: CourseBlock[],
  overallSummary?: CsvCell[][]
): void {
  const lines: string[] = [e(titleRow), '']
  for (const block of blocks) renderBlock(lines, block)
  if (overallSummary?.length) {
    for (const row of overallSummary) lines.push(row.map(e).join(','))
  }
  _download(filename, lines.join('\r\n'))
}

/** Full-year grouped CSV — semester group headers with blocks underneath */
export function buildGroupedYearCsv(
  filename: string,
  titleRow: string,
  groups: SemesterGroup[],
  overallSummary?: CsvCell[][]
): void {
  const lines: string[] = [e(titleRow), '']
  for (const group of groups) {
    lines.push(e(`\u2500\u2500\u2500 ${group.groupLabel} \u2500\u2500\u2500`))
    lines.push('')
    for (const block of group.blocks) renderBlock(lines, block)
    if (group.groupSummary?.length) {
      for (const row of group.groupSummary) lines.push(row.map(e).join(','))
      lines.push('')
    }
  }
  if (overallSummary?.length) {
    for (const row of overallSummary) lines.push(row.map(e).join(','))
  }
  _download(filename, lines.join('\r\n'))
}

/** Format today as YYYY-MM-DD for filenames */
export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
