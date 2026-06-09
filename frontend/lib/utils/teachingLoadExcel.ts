import ExcelJS from 'exceljs'
import type { LecturerWorkload } from '@/lib/api/courses'
import {
  buildTeachingLoadReport,
  getCourseType,
  getYearLevelLabel,
  categoryLabel,
  fillBar,
  fillPct,
  sectionStatus,
  type TeachingLoadCourseRow,
} from '@/lib/utils/teachingLoadReport'
import type { CourseCategory } from '@/lib/api/courses'

function dateStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

// ── Palette ───────────────────────────────────────────────────────────────────
const F = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

const FILL_TITLE      = F('FF1F3864')  // deep navy  — report title
const FILL_COL_HDR    = F('FF2F5496')  // mid navy   — column headers
const FILL_GRP_HDR    = F('FFBDD7EE')  // pale blue  — semester group bands
const FILL_CORE       = F('FFE2EFDA')  // soft green — SE / programme core
const FILL_UNIV       = F('FFFFF2CC')  // soft amber — university / general
const FILL_UNASSIGNED = F('FFF3E5F5')  // soft violet — unassigned sections
const FILL_HIGH       = F('FFFFF8DC')  // light yellow — high fill (>70 %)
const FILL_FULL       = F('FFFFE0E0')  // light red  — full sections (>95 %)
const FILL_LECT_HDR   = F('FF1F3864')  // same navy  — sheet-2 header
const FILL_NO_LIMIT   = F('FFE8F5E9')  // very light green — unlimited cap
const FILL_STAT_GRP   = F('FF2F5496')  // stat section divider
const FILL_STAT_VAL   = F('FFF9FAFB')  // near-white — stat value rows

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function applyFill(row: ExcelJS.Row, fill: ExcelJS.Fill, fontArgb = 'FF111827', bold = false, colCount?: number) {
  const count = colCount ?? row.cellCount
  for (let i = 1; i <= count; i++) {
    const c = row.getCell(i)
    c.fill = fill
    c.font = { bold, color: { argb: fontArgb } }
    c.border = BORDER_THIN
    if (!c.alignment) c.alignment = { vertical: 'middle', wrapText: false }
  }
}

function centre(row: ExcelJS.Row, ...cols: number[]) {
  cols.forEach((i) => { row.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' } })
}

function loadBar(used: number, max: number | null): string {
  if (!max) return '∞ No limit'
  const pct = Math.min(100, Math.round((used / max) * 100))
  return `${fillBar(pct)}  ${pct}%`
}

function lecturerStatus(used: number, max: number | null, isFull: boolean): string {
  if (!max) return '∞ No Limit'
  if (isFull || used >= max) return '🔴 At Capacity'
  const pct = (used / max) * 100
  if (pct >= 67) return '🟡 High Load'
  return '🟢 Available'
}

function rowFillForCourse(type: string, enrolled: number, max?: number | null, hasLecturer = true): ExcelJS.Fill {
  if (!hasLecturer) return FILL_UNASSIGNED
  if (max && (enrolled / max) >= 0.95) return FILL_FULL
  if (max && (enrolled / max) >= 0.70) return FILL_HIGH
  if (type === 'University' || type === 'General Elective' || type === 'Language') return FILL_UNIV
  return FILL_CORE
}

export async function downloadTeachingLoad(
  courses: TeachingLoadCourseRow[],
  workloads: LecturerWorkload[],
  options?: { scopeLabel?: string }
): Promise<void> {
  const report    = buildTeachingLoadReport(courses, workloads)
  const scope     = options?.scopeLabel || 'All Courses'
  const generated = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })
  const COLS = 16  // Sheet 1 column count

  const wb = new ExcelJS.Workbook()
  wb.creator  = 'CMMS — Teaching Load Export'
  wb.created  = new Date()
  wb.modified = new Date()

  // ════════════════════════════════════════════════════════════
  //  SHEET 1 — Course Offer  (grouped by Category → Semester)
  // ════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Course Offer', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })
  ws1.columns = [
    { width: 5  },  // 1  No.
    { width: 13 },  // 2  Code
    { width: 38 },  // 3  Name
    { width: 10 },  // 4  Year
    { width: 9  },  // 5  Section
    { width: 16 },  // 6  Type
    { width: 7  },  // 7  Credits
    { width: 14 },  // 8  Contact Hrs
    { width: 8  },  // 9  Final Exam
    { width: 32 },  // 10 Teaching Lecturer
    { width: 26 },  // 11 Coordinator
    { width: 10 },  // 12 Enrolled
    { width: 10 },  // 13 Capacity
    { width: 10 },  // 14 Fill %
    { width: 18 },  // 15 Fill Bar
    { width: 18 },  // 16 Status
  ]

  // Row 1 — Institution header
  const r1 = ws1.addRow([
    `Malaysia-Japan International Institute of Technology (MJIIT)  ·  Course Offer & Teaching Load`,
    ...Array(COLS - 1).fill(''),
  ])
  r1.height = 22
  ws1.mergeCells(r1.number, 1, r1.number, COLS)
  applyFill(r1, FILL_TITLE, 'FFFFFFFF', true, COLS)
  r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 2 — Scope + generated
  const r2 = ws1.addRow([
    `Scope: ${scope}     |     Generated: ${generated}`,
    ...Array(COLS - 1).fill(''),
  ])
  r2.height = 18
  ws1.mergeCells(r2.number, 1, r2.number, COLS)
  applyFill(r2, FILL_GRP_HDR, 'FF1F3864', false, COLS)
  r2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

  // Row 3 — Colour legend
  const r3 = ws1.addRow([
    '  Legend:   🟢 SE/Programme Core     🟡 University / Language     🟣 Unassigned     🟠 High Fill (>70%)     🔴 Full (>95%)',
    ...Array(COLS - 1).fill(''),
  ])
  r3.height = 16
  ws1.mergeCells(r3.number, 1, r3.number, COLS)
  applyFill(r3, FILL_STAT_VAL, 'FF374151', false, COLS)
  r3.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF374151' } }

  // Row 4 — Column headers
  const hdr = ws1.addRow([
    'No.', 'Code', 'Course Name', 'Year', 'Sec', 'Type', 'Cr',
    'Contact Hrs', 'Final Exam', 'Teaching Lecturer', 'Coordinator',
    'Enrolled', 'Capacity', 'Fill %', 'Fill Bar', 'Status',
  ])
  hdr.height = 22
  applyFill(hdr, FILL_COL_HDR, 'FFFFFFFF', true, COLS)
  centre(hdr, 1, 4, 5, 6, 7, 8, 9, 12, 13, 14, 16)
  ws1.autoFilter = { from: { row: hdr.number, column: 1 }, to: { row: hdr.number, column: COLS } }

  // Group all courses by category, then by semester within each category
  const CAT_ORDER: CourseCategory[] = ['engineering', 'mathematics', 'university', 'language']
  const byCat = new Map<CourseCategory, typeof report.groups>()
  for (const cat of CAT_ORDER) byCat.set(cat, [])

  for (const group of report.groups) {
    for (const cat of CAT_ORDER) {
      const catCourses = group.courses.filter(
        (c) => (c.category ?? 'engineering') === cat
      )
      if (catCourses.length === 0) continue
      const existing = byCat.get(cat)!
      const existingGroup = existing.find(
        (g) => g.academic_year === group.academic_year && g.semester === group.semester
      )
      if (existingGroup) {
        existingGroup.courses.push(...catCourses)
      } else {
        existing.push({ ...group, courses: catCourses })
      }
    }
  }

  let rowNo = 0
  for (const cat of CAT_ORDER) {
    const catGroups = byCat.get(cat)!
    if (catGroups.every((g) => g.courses.length === 0)) continue

    // Category header — bold dark, full-width (matches CSV row structure)
    const catRow = ws1.addRow([categoryLabel(cat), ...Array(COLS - 1).fill('')])
    catRow.height = 20
    ws1.mergeCells(catRow.number, 1, catRow.number, COLS)
    applyFill(catRow, FILL_TITLE, 'FFFFFFFF', true, COLS)
    catRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    catRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }

    for (const group of catGroups) {
      // Semester group banner
      const banner = ws1.addRow([
        `  ${group.academic_year}   ·   Semester ${group.semester}`,
        ...Array(COLS - 1).fill(''),
      ])
      banner.height = 18
      ws1.mergeCells(banner.number, 1, banner.number, COLS)
      applyFill(banner, FILL_GRP_HDR, 'FF1F3864', true, COLS)

      const sorted = [...group.courses].sort((a, b) => a.code.localeCompare(b.code))

      for (const course of sorted) {
        rowNo++
        const enrolled = course.enrolled_count ?? 0
        const maxCap   = course.max_students ?? null
        const type     = getCourseType(course.code, course.category)
        const hasLect  = !!(course.lecturer_name?.trim())
        const pctNum   = maxCap ? Math.min(100, Math.round((enrolled / maxCap) * 100)) : null
        const barText  = pctNum !== null ? `${fillBar(pctNum)}  ${pctNum}%` : '— no cap'
        const status   = hasLect
          ? (maxCap ? sectionStatus(enrolled, maxCap) : '⚪ No Cap')
          : '⚪ Unassigned'

        const lh = course.lecture_hours ?? 0
        const th = course.tutorial_hours ?? 0
        const labH = course.lab_hours ?? 0
        const contactHrs = [
          lh  > 0 ? `${lh}L`   : '',
          th  > 0 ? `${th}T`   : '',
          labH > 0 ? `${labH}P` : '',
        ].filter(Boolean).join('+') || '—'

        const coordinatorName = course.coordinator_name?.trim() || '—'

        const dr = ws1.addRow([
          rowNo,
          course.code,
          course.name || '—',
          getYearLevelLabel(course.code),
          course.section || '—',
          type,
          course.credits ?? '—',
          contactHrs,
          course.has_final_exam ? 'YES' : 'NO',
          hasLect ? (course.lecturer_name!.trim()) : '⚠ Unassigned',
          coordinatorName,
          enrolled,
          maxCap ?? '—',
          maxCap ? fillPct(enrolled, maxCap) : '—',
          barText,
          status,
        ])
        dr.height = 16
        applyFill(dr, rowFillForCourse(type, enrolled, maxCap, hasLect), 'FF111827', false, COLS)
        centre(dr, 1, 4, 5, 6, 7, 8, 9, 12, 13, 14, 16)
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  //  SHEET 2 — Lecturer Load Summary
  // ════════════════════════════════════════════════════════════
  const LCOLS = 11
  const ws2 = wb.addWorksheet('Lecturer Load', {
    views: [{ state: 'frozen', ySplit: 3 }],
  })
  ws2.columns = [
    { width: 5  },  // 1  No.
    { width: 28 },  // 2  Name
    { width: 30 },  // 3  Email
    { width: 10 },  // 4  Sections
    { width: 11 },  // 5  Credits
    { width: 13 },  // 6  Limit
    { width: 13 },  // 7  Remaining
    { width: 11 },  // 8  Util %
    { width: 22 },  // 9  Load bar
    { width: 16 },  // 10 Status
    { width: 48 },  // 11 Courses
  ]

  const l1 = ws2.addRow([
    `MJIIT — Lecturer Teaching Load Summary     ·     ${scope}`,
    ...Array(LCOLS - 1).fill(''),
  ])
  l1.height = 22
  ws2.mergeCells(l1.number, 1, l1.number, LCOLS)
  applyFill(l1, FILL_LECT_HDR, 'FFFFFFFF', true, LCOLS)
  l1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

  const l2 = ws2.addRow([`Generated: ${generated}`, ...Array(LCOLS - 1).fill('')])
  l2.height = 15
  ws2.mergeCells(l2.number, 1, l2.number, LCOLS)
  applyFill(l2, FILL_GRP_HDR, 'FF1F3864', false, LCOLS)
  l2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
  l2.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF1F3864' } }

  const lh = ws2.addRow([
    'No.', 'Lecturer Name', 'Email', 'Sections', 'Credits', 'Limit',
    'Remaining', 'Util %', 'Load Bar', 'Status', 'Assigned Courses',
  ])
  lh.height = 22
  applyFill(lh, FILL_COL_HDR, 'FFFFFFFF', true, LCOLS)
  centre(lh, 1, 4, 5, 6, 7, 8, 10)

  const sortedLecturers = [...report.lecturer_summaries].sort(
    (a, b) => b.backend_credits - a.backend_credits
  )

  let lNo = 0
  for (const lect of sortedLecturers) {
    lNo++
    const used      = lect.backend_credits
    const max       = lect.max_credits
    const pct       = max ? Math.min(100, Math.round((used / max) * 100)) : null
    const bar       = loadBar(used, max)
    const status    = lecturerStatus(used, max, lect.is_full)
    const courseList = lect.assigned_courses
      .map((c) => `${c.code} (${c.credits ?? '?'}cr)`)
      .join(',  ')

    const lr = ws2.addRow([
      lNo,
      lect.full_name,
      lect.email,
      lect.assigned_courses.length,
      used,
      max ?? 'Unlimited',
      lect.remaining_credits ?? 'Unlimited',
      pct !== null ? `${pct}%` : '—',
      bar,
      status,
      courseList || '—',
    ])
    lr.height = 16

    let rowFill: ExcelJS.Fill
    if (!max)                                     rowFill = FILL_NO_LIMIT
    else if (lect.is_full || (pct ?? 0) >= 95)   rowFill = FILL_FULL
    else if ((pct ?? 0) >= 67)                    rowFill = FILL_HIGH
    else                                          rowFill = FILL_CORE

    applyFill(lr, rowFill, 'FF111827', false, LCOLS)
    centre(lr, 1, 4, 5, 7, 8)
    lr.getCell(6).alignment  = { horizontal: 'center', vertical: 'middle' }
    lr.getCell(9).alignment  = { horizontal: 'left',   vertical: 'middle' }
    lr.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }
    lr.getCell(11).alignment = { horizontal: 'left',   vertical: 'middle', wrapText: true }
  }

  // ════════════════════════════════════════════════════════════
  //  SHEET 3 — Statistics
  // ════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('Statistics')
  ws3.columns = [{ width: 38 }, { width: 20 }]

  function statTitle(label: string) {
    const r = ws3.addRow([label, ''])
    r.height = 20
    ws3.mergeCells(r.number, 1, r.number, 2)
    applyFill(r, FILL_STAT_GRP, 'FFFFFFFF', true, 2)
    r.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
  }

  function statRow(label: string, value: string | number) {
    const r = ws3.addRow([label, value])
    r.height = 17
    applyFill(r, FILL_STAT_VAL, 'FF374151', false, 2)
    r.getCell(1).font = { color: { argb: 'FF374151' }, size: 10 }
    r.getCell(2).font = { bold: true, color: { argb: 'FF111827' }, size: 10 }
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  }

  const s1 = ws3.addRow([`CMMS — Teaching Load Statistics     ·     ${scope}`, ''])
  s1.height = 24
  ws3.mergeCells(s1.number, 1, s1.number, 2)
  applyFill(s1, FILL_TITLE, 'FFFFFFFF', true, 2)
  s1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

  ws3.addRow(['', ''])

  const totalEnrolled = courses.reduce((s, c) => s + (c.enrolled_count ?? 0), 0)
  const avgEnrolled   = courses.length ? (totalEnrolled / courses.length).toFixed(1) : '—'
  const assignedCount = report.metrics.assigned_courses
  const assignRate    = report.metrics.total_courses
    ? `${Math.round((assignedCount / report.metrics.total_courses) * 100)}%`
    : '—'

  statTitle('Overview')
  statRow('Academic Scope',            scope)
  statRow('Report Generated',          generated)
  statRow('Total Courses',             report.metrics.total_courses)
  statRow('Total Lecturers',           report.metrics.lecturer_count)
  statRow('Total Enrolled Students',   totalEnrolled)
  statRow('Avg Enrolled per Section',  avgEnrolled)

  ws3.addRow(['', ''])
  statTitle('Assignment')
  statRow('Assigned Courses',          assignedCount)
  statRow('Unassigned Courses',        report.metrics.unassigned_courses)
  statRow('Assignment Rate',           assignRate)
  statRow('Total Credits Offered',     report.metrics.total_courses > 0
    ? courses.reduce((s, c) => s + (c.credits ?? 0), 0) : 0)
  statRow('Total Credits Assigned',    report.metrics.backend_assigned_credits)
  statRow('Credits Unassigned',        report.metrics.unassigned_credits)

  ws3.addRow(['', ''])
  statTitle('Lecturer Capacity')
  const atCap  = report.lecturer_summaries.filter((l) => l.is_full).length
  const hiLoad = report.lecturer_summaries.filter(
    (l) => !l.is_full && l.max_credits !== null && (l.backend_credits / (l.max_credits ?? 1)) >= 0.67
  ).length
  const noLim  = report.lecturer_summaries.filter((l) => l.max_credits === null).length
  const avail  = report.lecturer_summaries.length - atCap - hiLoad - noLim

  statRow('🔴 At Capacity',            atCap)
  statRow('🟡 High Load (≥67%)',        hiLoad)
  statRow('🟢 Available (<67%)',        Math.max(0, avail))
  statRow('∞  No Limit Set',           noLim)
  statRow('Avg Credits per Lecturer',
    report.metrics.lecturer_count > 0
      ? (report.metrics.backend_assigned_credits / report.metrics.lecturer_count).toFixed(1)
      : '—')

  // ── Download ─────────────────────────────────────────────────
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