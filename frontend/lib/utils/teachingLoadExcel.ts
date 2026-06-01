import ExcelJS from 'exceljs'
import type { LecturerWorkload } from '@/lib/api/courses'

interface CourseRow {
  id: string
  code: string
  name?: string
  section?: string
  semester?: string
  academic_year?: string
  year?: string
  credits?: number
  lecturer_id?: string
  lecturer_name?: string
}

function dateStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

// ARGB fill helpers (ExcelJS uses ARGB with no # prefix)
const FILL_HEADER:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
const FILL_SECTION: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
const FILL_ELECTIVE: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }
const FILL_CORE:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

function applyRowFill(row: ExcelJS.Row, fill: ExcelJS.Fill, fontColor = '00000000', bold = false) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = fill
    cell.font = { bold, color: { argb: fontColor } }
    cell.border = BORDER_THIN
    cell.alignment = { vertical: 'middle', wrapText: false }
  })
}

/**
 * Builds and downloads a Teaching Load Excel (.xlsx) file with colour coding.
 *
 * Row colours:
 *   Dark-blue header  — column titles
 *   Light-blue        — section header (Academic Year + Semester group)
 *   Yellow            — elective / university courses (code starts with 'U')
 *   Light-green       — core / programme courses
 */
export async function downloadTeachingLoad(
  courses: CourseRow[],
  workloads: LecturerWorkload[]
): Promise<void> {
  // ── 1. Sorted lecturer name list ───────────────────────────────────────────
  const lecturerNames: string[] = Array.from(
    new Set(workloads.map((w) => w.full_name?.trim() || w.email).filter(Boolean))
  ).sort()

  const lecturerIndex: Record<string, number> = {}
  lecturerNames.forEach((name, i) => { lecturerIndex[name] = i })

  // ── 2. Group courses by academic_year → semester ───────────────────────────
  const grouped = new Map<string, CourseRow[]>()
  for (const c of courses) {
    const ay  = c.academic_year || c.year || '—'
    const sem = c.semester || '—'
    const key = `${ay}||${sem}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(c)
  }

  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => {
    const [ayA, semA] = a.split('||')
    const [ayB, semB] = b.split('||')
    return ayB !== ayA ? ayB.localeCompare(ayA) : semA.localeCompare(semB)
  })

  // ── 3. Build workbook ──────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CMMS'
  const ws = wb.addWorksheet('Teaching Load', { views: [{ state: 'frozen', ySplit: 1 }] })

  const LEFT_HEADERS = ['Academic Year', 'Semester', 'Course Code', 'Course Name', 'Credit Hours', 'Pre-Req', 'Assigned Lecturer', 'Total Credits']
  const TOTAL_COLS   = LEFT_HEADERS.length + lecturerNames.length

  // Column widths
  ws.columns = [
    { width: 16 },
    { width: 10 },
    { width: 14 },
    { width: 40 },
    { width: 12 },
    { width: 10 },
    { width: 42 },
    { width: 14 },
    ...lecturerNames.map(() => ({ width: 30 })),
  ]

  // ── Header row ─────────────────────────────────────────────────────────────
  const headerRow = ws.addRow([...LEFT_HEADERS, ...lecturerNames])
  headerRow.height = 22
  applyRowFill(headerRow, FILL_HEADER, 'FFFFFFFF', true)

  // ── Calculate total credits per lecturer ──────────────────────────────────
  const lecturerTotals: Record<string, number> = {}
  for (const c of courses) {
    const name = c.lecturer_name?.trim()
    if (name) {
      lecturerTotals[name] = (lecturerTotals[name] || 0) + (c.credits ?? 0)
    }
  }

  // ── Data rows ──────────────────────────────────────────────────────────────
  for (const [groupKey, groupCourses] of sortedGroups) {
    const [ay, sem] = groupKey.split('||')

    // Section header row (merged)
    const sectionRow = ws.addRow([`${ay}  —  Semester ${sem}`, ...Array(TOTAL_COLS - 1).fill('')])
    sectionRow.height = 18
    applyRowFill(sectionRow, FILL_SECTION, 'FF1E3A5F', true)
    ws.mergeCells(sectionRow.number, 1, sectionRow.number, TOTAL_COLS)

    for (const course of groupCourses) {
      const assignedName = course.lecturer_name?.trim() || ''
      const credits      = course.credits ?? null
      const isElective   = course.code.toUpperCase().startsWith('U')

      const lecturerCols = lecturerNames.map((name) =>
        assignedName && name === assignedName && typeof credits === 'number' ? credits : null
      )

      const totalCredits = assignedName ? lecturerTotals[assignedName] || 0 : null

      const dataRow = ws.addRow([
        ay, sem, course.code, course.name || '', credits, '', assignedName || 'Unassigned', totalCredits,
        ...lecturerCols,
      ])
      dataRow.height = 16
      applyRowFill(dataRow, isElective ? FILL_ELECTIVE : FILL_CORE, 'FF111827', false)

      // Right-align numeric credit cells
      dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
      lecturerNames.forEach((_, i) => {
        const cell = dataRow.getCell(LEFT_HEADERS.length + 1 + i)
        if (cell.value) cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })
    }
  }

  // ── Download ───────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `teaching_load_${dateStamp()}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
