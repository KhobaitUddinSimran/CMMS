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
const FILL_AT_CAPACITY: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } }
const FILL_HIGH_UTIL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8DC' } }
const FILL_UNASSIGNED: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } }
const FILL_STAT_HEADER: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } }

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
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
}

export async function downloadTeachingLoad(
  courses: CourseRow[],
  workloads: LecturerWorkload[]
): Promise<void> {
  // ── 1. Sorted lecturer name list ───────────────────────────────────────────
  const lecturerNames: string[] = Array.from(
    new Set(workloads.map((w) => w.full_name?.trim() || w.email).filter(Boolean))
  ).sort()

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

  // ── 3. Calculate statistics ────────────────────────────────────────────────
  const lecturerTotals: Record<string, number> = {}
  const lecturerCourses: Record<string, CourseRow[]> = {}
  const unassignedCourses: CourseRow[] = []
  let totalAssignedCredits = 0
  let totalCourses = 0

  for (const c of courses) {
    totalCourses++
    const name = c.lecturer_name?.trim()
    if (name) {
      totalAssignedCredits += c.credits ?? 0
      lecturerTotals[name] = (lecturerTotals[name] || 0) + (c.credits ?? 0)
      if (!lecturerCourses[name]) lecturerCourses[name] = []
      lecturerCourses[name].push(c)
    } else {
      unassignedCourses.push(c)
    }
  }

  const unassignedCredits = unassignedCourses.reduce((sum, c) => sum + (c.credits ?? 0), 0)

  // ── 4. Build workbook ──────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CMMS Teaching Load Report'

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 1: Lecturer Workload Summary with Assigned Courses
  // ════════════════════════════════════════════════════════════════════════════
  const summaryWs = wb.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 1 }] })
  summaryWs.columns = [
    { width: 30 },
    { width: 20 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 15 },
    { width: 50 },
  ]

  const summaryHeaderRow = summaryWs.addRow([
    'Lecturer Name',
    'Total Credits',
    'Max Capacity',
    'Remaining',
    'Utilization %',
    'Status',
    'Assigned Courses (Code - Name - Credits)'
  ])
  summaryHeaderRow.height = 24
  applyRowFill(summaryHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

  for (const lecturer of lecturerNames) {
    const workload = workloads.find((w) => w.full_name?.trim() === lecturer || w.email === lecturer)
    const totalAssigned = lecturerTotals[lecturer] || 0
    const maxCapacity = workload?.max_credits || null
    const remaining = maxCapacity ? Math.max(0, maxCapacity - totalAssigned) : null
    const utilizationPercent = maxCapacity ? Math.round((totalAssigned / maxCapacity) * 100) : 'N/A'
    const isAtCapacity = workload?.is_full ?? false
    const status = isAtCapacity ? '🔴 AT CAPACITY' : '🟢 Available'

    // Build course list
    const assignedCoursesText = (lecturerCourses[lecturer] || [])
      .map(c => `${c.code} - ${c.name || '—'} (${c.credits}cr)`)
      .join('\n')

    const summaryRow = summaryWs.addRow([
      lecturer,
      totalAssigned,
      maxCapacity || 'Unlimited',
      remaining || 'Unlimited',
      `${utilizationPercent}%`,
      status,
      assignedCoursesText || 'No courses assigned'
    ])
    summaryRow.height = Math.max(18, (assignedCoursesText.match(/\n/g) || []).length * 15 + 18)

    let fillColor = FILL_CORE
    if (isAtCapacity) {
      fillColor = FILL_AT_CAPACITY
    } else if (typeof utilizationPercent === 'number' && utilizationPercent >= 67) {
      fillColor = FILL_HIGH_UTIL
    }
    applyRowFill(summaryRow, fillColor, 'FF111827', false)

    summaryRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(7).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 2: Course Details (By Semester)
  // ════════════════════════════════════════════════════════════════════════════
  const courseWs = wb.addWorksheet('Course Details', { views: [{ state: 'frozen', ySplit: 1 }] })
  courseWs.columns = [
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 38 },
    { width: 12 },
    { width: 12 },
    { width: 40 },
    { width: 16 },
  ]

  const courseHeaderRow = courseWs.addRow([
    'Academic Year',
    'Semester',
    'Course Code',
    'Course Name',
    'Credits',
    'Type',
    'Assigned Lecturer',
    'Lecturer Total'
  ])
  courseHeaderRow.height = 22
  applyRowFill(courseHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

  for (const [groupKey, groupCourses] of sortedGroups) {
    const [ay, sem] = groupKey.split('||')

    const sectionRow = courseWs.addRow([`${ay}  —  Semester ${sem}`, '', '', '', '', '', '', ''])
    sectionRow.height = 18
    applyRowFill(sectionRow, FILL_SECTION, 'FF1E3A5F', true)
    courseWs.mergeCells(sectionRow.number, 1, sectionRow.number, 8)

    for (const course of groupCourses) {
      const assignedName = course.lecturer_name?.trim() || ''
      const isElective = course.code.toUpperCase().startsWith('U')
      const courseType = isElective ? 'Elective' : 'Core'
      const totalCredits = assignedName ? lecturerTotals[assignedName] || 0 : '—'

      const dataRow = courseWs.addRow([
        ay,
        sem,
        course.code,
        course.name || '',
        course.credits || 0,
        courseType,
        assignedName || '❌ Unassigned',
        totalCredits,
      ])
      dataRow.height = 16
      applyRowFill(
        dataRow,
        !assignedName ? FILL_UNASSIGNED : (isElective ? FILL_ELECTIVE : FILL_CORE),
        'FF111827',
        false
      )

      dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 3: Per-Lecturer Detailed Courses
  // ════════════════════════════════════════════════════════════════════════════
  const lecturerWs = wb.addWorksheet('Lecturer Courses', { views: [{ state: 'frozen', ySplit: 1 }] })
  lecturerWs.columns = [
    { width: 28 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 36 },
    { width: 12 },
    { width: 12 },
  ]

  const lecturerHeaderRow = lecturerWs.addRow([
    'Lecturer Name',
    'Academic Year',
    'Semester',
    'Course Code',
    'Course Name',
    'Credits',
    'Type'
  ])
  lecturerHeaderRow.height = 22
  applyRowFill(lecturerHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

  for (const lecturer of lecturerNames) {
    const courses = lecturerCourses[lecturer] || []
    if (courses.length === 0) continue

    for (const course of courses) {
      const isElective = course.code.toUpperCase().startsWith('U')
      const courseType = isElective ? 'Elective' : 'Core'

      const dataRow = lecturerWs.addRow([
        lecturer,
        course.academic_year || course.year || '—',
        course.semester || '—',
        course.code,
        course.name || '',
        course.credits || 0,
        courseType,
      ])
      dataRow.height = 16
      applyRowFill(dataRow, isElective ? FILL_ELECTIVE : FILL_CORE, 'FF111827', false)

      dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 4: Analytics & Statistics
  // ════════════════════════════════════════════════════════════════════════════
  const analyticsWs = wb.addWorksheet('Analytics', { views: [{ state: 'frozen', ySplit: 2 }] })
  analyticsWs.columns = [{ width: 40 }, { width: 20 }]

  // Header
  const analyticsTitle = analyticsWs.addRow(['TEACHING LOAD ANALYTICS & STATISTICS', ''])
  analyticsTitle.height = 24
  applyRowFill(analyticsTitle, FILL_STAT_HEADER, 'FFFFFFFF', true)

  // Key Metrics
  analyticsWs.addRow(['', ''])
  const metricsRow = analyticsWs.addRow(['KEY METRICS', ''])
  applyRowFill(metricsRow, FILL_HEADER, 'FFFFFFFF', true)

  const metrics = [
    ['Total Lecturers', lecturerNames.length],
    ['Total Courses', totalCourses],
    ['Assigned Courses', totalCourses - unassignedCourses.length],
    ['Unassigned Courses', unassignedCourses.length],
    ['Total Credits Assigned', totalAssignedCredits],
    ['Total Unassigned Credits', unassignedCredits],
    ['Average Credits per Lecturer', lecturerNames.length > 0 ? (totalAssignedCredits / lecturerNames.length).toFixed(2) : 0],
  ]

  for (const [label, value] of metrics) {
    const row = analyticsWs.addRow([label, value])
    row.height = 18
    row.getCell(1).font = { bold: true, color: { argb: 'FF374151' } }
    row.getCell(2).font = { bold: true, color: { argb: 'FF0F172A' } }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(1).border = BORDER_THIN
    row.getCell(2).border = BORDER_THIN
  }

  // Workload Distribution
  analyticsWs.addRow(['', ''])
  const distributionRow = analyticsWs.addRow(['WORKLOAD DISTRIBUTION', ''])
  applyRowFill(distributionRow, FILL_HEADER, 'FFFFFFFF', true)

  analyticsWs.addRow(['', ''])
  const capRow = analyticsWs.addRow(['Capacity Status', 'Count'])
  applyRowFill(capRow, FILL_SECTION, 'FF1E3A5F', true)

  const atCapacity = workloads.filter(w => w.is_full).length
  const highUtil = workloads.filter(w => !w.is_full && w.max_credits && w.used_credits / w.max_credits >= 0.67).length
  const available = lecturerNames.length - atCapacity - highUtil

  const statusData = [
    ['🟢 Available', available],
    ['🟡 High Utilization (67-99%)', highUtil],
    ['🔴 At Capacity', atCapacity],
  ]

  for (const [status, count] of statusData) {
    const row = analyticsWs.addRow([status, count])
    row.height = 18
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(1).border = BORDER_THIN
    row.getCell(2).border = BORDER_THIN
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 5: Unassigned Courses
  // ════════════════════════════════════════════════════════════════════════════
  if (unassignedCourses.length > 0) {
    const unassignedWs = wb.addWorksheet('Unassigned Courses', { views: [{ state: 'frozen', ySplit: 1 }] })
    unassignedWs.columns = [
      { width: 14 },
      { width: 10 },
      { width: 14 },
      { width: 40 },
      { width: 12 },
      { width: 12 },
    ]

    const unassignedHeaderRow = unassignedWs.addRow([
      'Academic Year',
      'Semester',
      'Course Code',
      'Course Name',
      'Credits',
      'Type'
    ])
    unassignedHeaderRow.height = 22
    applyRowFill(unassignedHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

    for (const course of unassignedCourses) {
      const isElective = course.code.toUpperCase().startsWith('U')
      const courseType = isElective ? 'Elective' : 'Core'

      const dataRow = unassignedWs.addRow([
        course.academic_year || course.year || '—',
        course.semester || '—',
        course.code,
        course.name || '',
        course.credits || 0,
        courseType,
      ])
      dataRow.height = 16
      applyRowFill(dataRow, FILL_UNASSIGNED, 'FF111827', false)

      dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
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
