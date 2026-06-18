/**
 * Shared report utilities — grade calculations, date formatting, grouping helpers.
 * Zero repetition across /reports and /export pages.
 */

// ==================== UTM Letter Grade Table ====================
// Mirror of backend/routers/marks.py _LETTER_GRADE_TABLE
const LETTER_GRADE_TABLE: [number, string, number][] = [
  [90, 'A+', 4.00],
  [80, 'A',  4.00],
  [75, 'A-', 3.67],
  [70, 'B+', 3.33],
  [65, 'B',  3.00],
  [60, 'B-', 2.67],
  [55, 'C+', 2.33],
  [50, 'C',  2.00],
  [45, 'C-', 1.67],
  [40, 'D+', 1.33],
  [35, 'D',  1.00],
  [30, 'D-', 0.67],
  [0,  'E',  0.00],
]

export const PASS_THRESHOLD = 50

export interface GradeBand {
  percentage: number
  letter: string
  gpa: number
  pass: boolean
}

/** Map a raw score + max score to UTM grade band */
export function calculateGradeBand(rawScore: number | null, maxScore: number | null): GradeBand {
  const pct = maxScore && maxScore > 0 && rawScore != null
    ? Math.round((rawScore / maxScore) * 100 * 10) / 10
    : 0

  for (const [threshold, letter, gpa] of LETTER_GRADE_TABLE) {
    if (pct >= threshold) {
      return { percentage: pct, letter, gpa, pass: pct >= PASS_THRESHOLD }
    }
  }
  return { percentage: pct, letter: 'E', gpa: 0.0, pass: false }
}

/** Build the first CSV row: report title + academic year + semester + generation timestamp */
export function buildReportHeader(
  title: string,
  academicYear?: string,
  semester?: string | number
): string {
  const parts = [title]
  if (academicYear) parts.push(`Academic Year: ${academicYear}`)
  if (semester) parts.push(`Semester: ${semester}`)
  parts.push(`Generated: ${formatDateTimeLocal(new Date())}`)
  return parts.join(' | ')
}

/** Format ISO date string as YYYY-MM-DD HH:mm (local) */
export function formatDateTimeLocal(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Format ISO date string as YYYY-MM-DD */
export function formatDateLocal(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Format ISO date string as HH:mm:ss */
export function formatTimeLocal(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Calculate days between a date and now */
export function calculateDaysSince(iso: string | Date | null | undefined): number {
  if (!iso) return 0
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return 0
  const diff = Date.now() - d.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/** Group an array of objects by a key */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key] ?? 'Unknown')
    acc[k] = acc[k] || []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

/** Sum numeric values from an array of objects by key */
export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => {
    const v = Number(item[key])
    return sum + (isNaN(v) ? 0 : v)
  }, 0)
}

/** Count items matching a predicate */
export function countBy<T>(arr: T[], predicate: (item: T) => boolean): number {
  return arr.filter(predicate).length
}

/** Determine grade submission status from deadline */
export function gradeSubmissionStatus(deadlineIso: string | null | undefined): string {
  if (!deadlineIso) return 'No Deadline'
  const d = new Date(deadlineIso)
  if (isNaN(d.getTime())) return 'No Deadline'
  return Date.now() > d.getTime() ? 'Closed' : 'Open'
}

/** Days remaining until deadline (negative = overdue) */
export function daysUntilDeadline(deadlineIso: string | null | undefined): number | null {
  if (!deadlineIso) return null
  const d = new Date(deadlineIso)
  if (isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/** Categorise audit action into buckets */
export function auditActionCategory(action: string): string {
  const a = (action || '').toUpperCase()
  if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('AUTH') || a.includes('PASSWORD') || a.includes('OTP')) return 'AUTH'
  if (a.includes('USER') || a.includes('APPROVE') || a.includes('REJECT') || a.includes('ROLE')) return 'USER'
  if (a.includes('COURSE') || a.includes('ASSESSMENT') || a.includes('ENROLL')) return 'COURSE'
  if (a.includes('MARK') || a.includes('GRADE') || a.includes('PUBLISH') || a.includes('FLAG')) return 'MARK'
  return 'SYSTEM'
}

/** Build a concise summary of old_values → new_values changes */
export function auditDetails(oldValues: Record<string, any> | null, newValues: Record<string, any> | null): string {
  if (!oldValues && !newValues) return ''
  const changes: string[] = []
  const keys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})])
  for (const k of keys) {
    const oldV = oldValues?.[k]
    const newV = newValues?.[k]
    if (oldV !== newV) {
      changes.push(`${k}: ${oldV ?? 'null'} → ${newV ?? 'null'}`)
    }
  }
  return changes.join('; ')
}

/** Get academic_year from a course object (handles both academic_year and year fields) */
export function getCourseAcademicYear(course: any): string {
  return course?.academic_year || course?.year || ''
}

/** Filter course by year + semester. Pass semester='all' to match all semesters in the year. */
export function matchesYearSemester(course: any, year: string, semester: string | number): boolean {
  if (!year) return false
  const cy = getCourseAcademicYear(course)
  if (String(semester) === 'all') return cy === year
  const cs = String(course?.semester || '')
  return cy === year && cs === String(semester)
}
