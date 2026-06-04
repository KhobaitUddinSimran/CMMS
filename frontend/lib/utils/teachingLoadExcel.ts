import ExcelJS from 'exceljs'
import type { LecturerWorkload } from '@/lib/api/courses'
import {
  buildTeachingLoadReport,
  type TeachingLoadCourseRow,
} from '@/lib/utils/teachingLoadReport'

function dateStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

const FILL_HEADER: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
const FILL_SECTION: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
const FILL_ELECTIVE: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }
const FILL_CORE: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }
const FILL_AT_CAPACITY: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } }
const FILL_HIGH_UTIL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8DC' } }
const FILL_MISMATCH: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD7B5' } }
const FILL_UNASSIGNED: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } }
const FILL_STAT_HEADER: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } }

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
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
  courses: TeachingLoadCourseRow[],
  workloads: LecturerWorkload[],
  options?: { scopeLabel?: string }
): Promise<void> {
  const report = buildTeachingLoadReport(courses, workloads)
  const scopeLabel = options?.scopeLabel || 'All courses'

  const wb = new ExcelJS.Workbook()
  wb.creator = 'CMMS Teaching Load Report'

  const summaryWs = wb.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 2 }] })
  summaryWs.columns = [
    { width: 30 },
    { width: 16 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 15 },
    { width: 50 },
    { width: 14 },
  ]

  const summaryTitleRow = summaryWs.addRow([`TEACHING LOAD SUMMARY - ${scopeLabel}`, '', '', '', '', '', '', '', '', ''])
  summaryTitleRow.height = 24
  applyRowFill(summaryTitleRow, FILL_STAT_HEADER, 'FFFFFFFF', true)
  summaryWs.mergeCells(summaryTitleRow.number, 1, summaryTitleRow.number, 10)

  const summaryHeaderRow = summaryWs.addRow([
    'Lecturer Name',
    'Backend Credits',
    'Recomputed Credits',
    'Delta',
    'Max Capacity',
    'Remaining',
    'Utilization %',
    'Status',
    'Assigned Courses (Code - Name - Credits)',
    'Check',
  ])
  summaryHeaderRow.height = 24
  applyRowFill(summaryHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

  for (const lecturer of report.lecturer_summaries) {
    const maxCapacity = lecturer.max_credits
    const remaining = lecturer.remaining_credits
    const utilizationPercent = maxCapacity ? Math.round((lecturer.backend_credits / maxCapacity) * 100) : 'N/A'
    const status = lecturer.mismatch
      ? '🟠 REVIEW NEEDED'
      : lecturer.is_full
        ? '🔴 AT CAPACITY'
        : '🟢 Available'

    const assignedCoursesText = lecturer.assigned_courses
      .map((course) => `${course.code} - ${course.name || '—'} (${course.credits}cr)`)
      .join('\n')

    const summaryRow = summaryWs.addRow([
      lecturer.full_name,
      lecturer.backend_credits,
      lecturer.recomputed_credits,
      lecturer.delta_credits,
      maxCapacity ?? 'Unlimited',
      remaining ?? 'Unlimited',
      `${utilizationPercent}%`,
      status,
      assignedCoursesText || 'No courses assigned',
      lecturer.mismatch ? 'Mismatch' : 'OK',
    ])
    summaryRow.height = Math.max(18, (assignedCoursesText.match(/\n/g) || []).length * 15 + 18)

    let fillColor = FILL_CORE
    if (lecturer.mismatch) fillColor = FILL_MISMATCH
    else if (lecturer.is_full) fillColor = FILL_AT_CAPACITY
    else if (typeof utilizationPercent === 'number' && utilizationPercent >= 67) fillColor = FILL_HIGH_UTIL
    applyRowFill(summaryRow, fillColor, 'FF111827', false)

    summaryRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
    summaryRow.getCell(9).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
    summaryRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }
  }

  const courseWs = wb.addWorksheet('Course Details', { views: [{ state: 'frozen', ySplit: 1 }] })
  courseWs.columns = [
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 38 },
    { width: 12 },
    { width: 12 },
    { width: 40 },
    { width: 12 },
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
    'Match Source',
    'Lecturer Total',
  ])
  courseHeaderRow.height = 22
  applyRowFill(courseHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

  for (const group of report.groups) {
    const sectionRow = courseWs.addRow([`${group.academic_year}  —  Semester ${group.semester}`, '', '', '', '', '', '', '', ''])
    sectionRow.height = 18
    applyRowFill(sectionRow, FILL_SECTION, 'FF1E3A5F', true)
    courseWs.mergeCells(sectionRow.number, 1, sectionRow.number, 9)

    for (const course of group.courses) {
      const isElective = course.code.toUpperCase().startsWith('U')
      const courseType = isElective ? 'Elective' : 'Core'
      const matchSource = report.course_assignment_source_by_id[course.id] ?? 'unassigned'
      const lecturerSummary = report.lecturer_summaries.find((entry) =>
        entry.assigned_courses.some((assignedCourse) => assignedCourse.id === course.id)
      )

      const dataRow = courseWs.addRow([
        group.academic_year,
        group.semester,
        course.code,
        course.name || '',
        course.credits || 0,
        courseType,
        course.lecturer_name?.trim() || (matchSource === 'unassigned' ? '❌ Unassigned' : '—'),
        matchSource === 'unmatched' ? 'Unmatched' : matchSource === 'name' ? 'Name' : matchSource === 'id' ? 'ID' : 'Missing',
        lecturerSummary?.backend_credits ?? '—',
      ])
      dataRow.height = 16
      applyRowFill(
        dataRow,
        matchSource === 'missing' ? FILL_UNASSIGNED : (isElective ? FILL_ELECTIVE : FILL_CORE),
        'FF111827',
        false
      )

      dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }

  const lecturerWs = wb.addWorksheet('Lecturer Courses', { views: [{ state: 'frozen', ySplit: 1 }] })
  lecturerWs.columns = [
    { width: 28 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 36 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
  ]

  const lecturerHeaderRow = lecturerWs.addRow([
    'Lecturer Name',
    'Academic Year',
    'Semester',
    'Course Code',
    'Course Name',
    'Credits',
    'Type',
    'Backend Total',
    'Match Source',
  ])
  lecturerHeaderRow.height = 22
  applyRowFill(lecturerHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

  for (const lecturer of report.lecturer_summaries) {
    if (lecturer.assigned_courses.length === 0) continue

    for (const course of lecturer.assigned_courses) {
      const isElective = course.code.toUpperCase().startsWith('U')
      const courseType = isElective ? 'Elective' : 'Core'

      const dataRow = lecturerWs.addRow([
        lecturer.full_name,
        course.academic_year || course.year || '—',
        course.semester || '—',
        course.code,
        course.name || '',
        course.credits || 0,
        courseType,
        lecturer.backend_credits,
        report.course_assignment_source_by_id[course.id] === 'unmatched' ? 'Unmatched' : report.course_assignment_source_by_id[course.id] === 'name' ? 'Name' : 'ID',
      ])
      dataRow.height = 16
      applyRowFill(dataRow, isElective ? FILL_ELECTIVE : FILL_CORE, 'FF111827', false)

      dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
      dataRow.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }

  const analyticsWs = wb.addWorksheet('Analytics', { views: [{ state: 'frozen', ySplit: 2 }] })
  analyticsWs.columns = [{ width: 40 }, { width: 20 }]

  const analyticsTitle = analyticsWs.addRow([`TEACHING LOAD ANALYTICS & STATISTICS - ${scopeLabel}`, ''])
  analyticsTitle.height = 24
  applyRowFill(analyticsTitle, FILL_STAT_HEADER, 'FFFFFFFF', true)

  analyticsWs.addRow(['', ''])
  const metricsRow = analyticsWs.addRow(['KEY METRICS', ''])
  applyRowFill(metricsRow, FILL_HEADER, 'FFFFFFFF', true)

  const metrics = [
    ['Total Lecturers', report.metrics.lecturer_count],
    ['Total Courses', report.metrics.total_courses],
    ['Assigned Courses', report.metrics.assigned_courses],
    ['Unassigned Courses', report.metrics.unassigned_courses],
    ['Unmatched Assigned Courses', report.metrics.unmatched_assigned_courses],
    ['Backend Assigned Credits', report.metrics.backend_assigned_credits],
    ['Recomputed Assigned Credits', report.metrics.recomputed_assigned_credits],
    ['Unassigned Credits', report.metrics.unassigned_credits],
    ['Unmatched Assigned Credits', report.metrics.unmatched_assigned_credits],
    ['Mismatch Lecturers', report.metrics.mismatch_count],
    ['Average Backend Credits per Lecturer', report.metrics.lecturer_count > 0 ? (report.metrics.backend_assigned_credits / report.metrics.lecturer_count).toFixed(2) : 0],
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

  analyticsWs.addRow(['', ''])
  const distributionRow = analyticsWs.addRow(['WORKLOAD DISTRIBUTION', ''])
  applyRowFill(distributionRow, FILL_HEADER, 'FFFFFFFF', true)

  analyticsWs.addRow(['', ''])
  const capRow = analyticsWs.addRow(['Capacity Status', 'Count'])
  applyRowFill(capRow, FILL_SECTION, 'FF1E3A5F', true)

  const atCapacity = report.lecturer_summaries.filter((summary) => summary.is_full && !summary.mismatch).length
  const highUtil = report.lecturer_summaries.filter(
    (summary) => !summary.is_full && !summary.mismatch && summary.max_credits && summary.backend_credits / summary.max_credits >= 0.67
  ).length
  const available = report.lecturer_summaries.length - atCapacity - highUtil - report.metrics.mismatch_count

  const statusData = [
    ['🟢 Available', available],
    ['🟡 High Utilization (67-99%)', highUtil],
    ['🔴 At Capacity', atCapacity],
    ['🟠 Review Needed', report.metrics.mismatch_count],
  ]

  for (const [status, count] of statusData) {
    const row = analyticsWs.addRow([status, count])
    row.height = 18
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(1).border = BORDER_THIN
    row.getCell(2).border = BORDER_THIN
  }

  if (report.unassigned_courses.length > 0) {
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
      'Type',
    ])
    unassignedHeaderRow.height = 22
    applyRowFill(unassignedHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

    for (const course of report.unassigned_courses) {
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

  if (report.unmatched_assigned_courses.length > 0) {
    const issueWs = wb.addWorksheet('Data Issues', { views: [{ state: 'frozen', ySplit: 1 }] })
    issueWs.columns = [
      { width: 14 },
      { width: 10 },
      { width: 14 },
      { width: 40 },
      { width: 12 },
      { width: 28 },
    ]

    const issueHeaderRow = issueWs.addRow([
      'Academic Year',
      'Semester',
      'Course Code',
      'Course Name',
      'Credits',
      'Issue',
    ])
    issueHeaderRow.height = 22
    applyRowFill(issueHeaderRow, FILL_HEADER, 'FFFFFFFF', true)

    for (const course of report.unmatched_assigned_courses) {
      const issueRow = issueWs.addRow([
        course.academic_year || course.year || '—',
        course.semester || '—',
        course.code,
        course.name || '',
        course.credits || 0,
        course.lecturer_id ? 'Lecturer ID not found in workload data' : 'Lecturer name not found in workload data',
      ])
      issueRow.height = 16
      applyRowFill(issueRow, FILL_MISMATCH, 'FF111827', false)
      issueRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
      issueRow.getCell(6).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `teaching_load_${dateStamp()}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}