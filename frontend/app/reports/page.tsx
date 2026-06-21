'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Users, ClipboardList, Download, ExternalLink,
  GraduationCap, RefreshCw, TrendingUp, BookOpen, CalendarDays, Filter,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses, listLecturers as _listFacultyUsers } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { listAssessments } from '@/lib/api/assessments'
import { getCourseAllMarks } from '@/lib/api/marks'
import { listAcademicYears, getActiveAcademicYear, listTimelines } from '@/lib/api/semester'
import {
  buildGroupedCsv, buildGroupedYearCsv,
  type CourseBlock, type SemesterGroup,
  dateStamp,
} from '@/lib/utils/csv-enhanced'
import {
  buildReportHeader,
  calculateGradeBand,
  formatDateLocal,
  daysUntilDeadline,
  matchesYearSemester,
} from '@/lib/utils/reports'

interface Totals {
  courses: number
  enrollments: number
  assessments: number
}

interface FetchProgress {
  current: number
  total: number
  label: string
}

export default function ReportsPage() {
  const router = useRouter()
  const { addToast } = useToastStore()

  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; is_active: boolean }[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedSemester, setSelectedSemester] = useState<string>('1')
  const [filterLoading, setFilterLoading] = useState(true)

  const [totals, setTotals] = useState<Totals>({ courses: 0, enrollments: 0, assessments: 0 })
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState<FetchProgress | null>(null)
  const [lastExported, setLastExported] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const [years, active] = await Promise.all([
          listAcademicYears(),
          getActiveAcademicYear(),
        ])
        if (cancelled) return
        setAcademicYears(years)
        setSelectedYear(active?.name || years[0]?.name || '')
      } catch {
        addToast('Failed to load academic years', 'error')
      } finally {
        if (!cancelled) setFilterLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [addToast])

  const loadTotals = useCallback(async () => {
    if (!selectedYear) return
    setLoading(true)
    try {
      const cRes = await listCourses({ limit: 500 })
      const allCourses: any[] = cRes.data || (cRes as any) || []
      const courses = allCourses.filter((c) => matchesYearSemester(c, selectedYear, selectedSemester))
      let enrollCount = 0
      let assessCount = 0
      await Promise.allSettled(
        courses.map(async (c) => {
          try {
            const [students, aRes] = await Promise.all([
              getEnrolledStudents(c.id),
              listAssessments(c.id, { limit: 500 }),
            ])
            enrollCount += Array.isArray(students) ? students.filter((s: any) => s.status === 'active' || s.status === 'ACTIVE').length : 0
            assessCount += aRes.data?.length ?? 0
          } catch { /* skip */ }
        })
      )
      setTotals({ courses: courses.length, enrollments: enrollCount, assessments: assessCount })
    } catch {
      addToast('Failed to load report totals', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, selectedYear, selectedSemester])

  useEffect(() => { loadTotals() }, [loadTotals])

  // ── Shared helpers ──────────────────────────────────────────────────────────

  async function buildLecturerMap(): Promise<Map<string, string>> {
    try {
      const lecturers = await _listFacultyUsers()
      const map = new Map<string, string>()
      for (const l of (lecturers || [])) {
        if (l.id) map.set(l.id, l.full_name || l.email || '')
      }
      return map
    } catch { return new Map() }
  }

  function lecturerDisplay(c: any, map: Map<string, string>): string {
    return c.lecturer_name || map.get(c.lecturer_id || '') || '—'
  }

  function groupBySemester(courses: any[]): Map<string, any[]> {
    const m = new Map<string, any[]>()
    for (const c of courses) {
      const k = String(c.semester || 'Unknown')
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(c)
    }
    return new Map([...m.entries()].sort())
  }

  // ── Enrollment Report ───────────────────────────────────────────────────────

  async function downloadEnrollmentReport() {
    if (!selectedYear) return
    setBusy('enroll')
    const isFullYear = selectedSemester === 'all'
    try {
      const [cRes, lecturerMap] = await Promise.all([listCourses({ limit: 2000 }), buildLecturerMap()])
      const allCourses: any[] = cRes.data || (cRes as any) || []
      const courses = allCourses.filter((c) => matchesYearSemester(c, selectedYear, selectedSemester))
      setProgress({ current: 0, total: courses.length, label: 'Fetching enrollments' })

      let totalEnrolled = 0, totalActive = 0, totalDropped = 0

      type ECD = { course: any; students: any[]; active: number; dropped: number }
      const courseData: ECD[] = []

      for (let i = 0; i < courses.length; i++) {
        const c = courses[i]
        setProgress({ current: i + 1, total: courses.length, label: c.code })
        try {
          const students = (await getEnrolledStudents(c.id)) as any[]
          const active = students.filter((s) => (s.status || '').toLowerCase() === 'active').length
          const dropped = students.length - active
          totalEnrolled += students.length; totalActive += active; totalDropped += dropped
          courseData.push({ course: c, students, active, dropped })
        } catch { courseData.push({ course: c, students: [], active: 0, dropped: 0 }) }
      }

      const subHeaders = ['Student Email', 'Student Name', 'Status', 'Enrolled Date']

      function makeEnrollBlock(cd: ECD): CourseBlock {
        const c = cd.course
        return {
          courseHeader: [[
            c.code || '', c.name || '',
            `Section: ${c.section || '—'}`, `Credits: ${c.credits ?? '—'}`,
            `Lecturer: ${lecturerDisplay(c, lecturerMap)}`, `Max Students: ${c.max_students ?? '—'}`,
          ]],
          subHeaders,
          rows: cd.students.map((s) => [
            s.email || '', s.full_name || '', s.status || '', formatDateLocal(s.enrollment_date) || '',
          ]),
          subtotals: [['', 'Active:', cd.active, '', 'Dropped:', cd.dropped, '', 'Total:', cd.students.length]],
        }
      }

      const semLabel = isFullYear ? 'Full Year' : `Semester ${selectedSemester}`
      const filename = isFullYear
        ? `enrollment_report_${selectedYear}_fullyear_${dateStamp()}.csv`
        : `enrollment_report_${selectedYear}_S${selectedSemester}_${dateStamp()}.csv`
      const titleRow = buildReportHeader('MarkDesk Enrollment Report', selectedYear, semLabel)
      const overall: (string | number)[][] = [
        ['OVERALL SUMMARY'],
        ['', 'Total Courses:', courses.length, '', 'Total Enrolled:', totalEnrolled],
        ['', 'Active:', totalActive, '', 'Dropped:', totalDropped],
      ]

      if (isFullYear) {
        const semGroups = groupBySemester(courses)
        const groups: SemesterGroup[] = []
        for (const [sem, semCourses] of semGroups) {
          const semEnrolled = semCourses.reduce((s, c) => {
            const cd = courseData.find((d) => d.course.id === c.id)
            return s + (cd?.students.length ?? 0)
          }, 0)
          groups.push({
            groupLabel: `SEMESTER ${sem}`,
            blocks: semCourses
              .map((c) => courseData.find((d) => d.course.id === c.id))
              .filter((cd): cd is ECD => !!cd)
              .map(makeEnrollBlock),
            groupSummary: [['', `Semester ${sem} — ${semCourses.length} courses`, '', 'Enrolled:', semEnrolled]],
          })
        }
        buildGroupedYearCsv(filename, titleRow, groups, overall)
      } else {
        buildGroupedCsv(filename, titleRow, courseData.map(makeEnrollBlock), overall)
      }

      setLastExported((p) => ({ ...p, enroll: new Date().toLocaleTimeString() }))
      addToast(`Exported ${totalEnrolled} enrollments across ${courses.length} courses`, 'success')
    } catch {
      addToast('Failed to generate enrollment report', 'error')
    } finally { setBusy(null); setProgress(null) }
  }

  // ── Assessment Report ────────────────────────────────────────────────────────

  async function downloadAssessmentReport() {
    if (!selectedYear) return
    setBusy('assess')
    const isFullYear = selectedSemester === 'all'
    try {
      const [cRes, lecturerMap, timelines] = await Promise.all([
        listCourses({ limit: 2000 }),
        buildLecturerMap(),
        listTimelines().catch(() => []),
      ])
      const allCourses: any[] = cRes.data || (cRes as any) || []
      const courses = allCourses.filter((c) => matchesYearSemester(c, selectedYear, selectedSemester))
      setProgress({ current: 0, total: courses.length, label: 'Fetching assessments' })

      let totalAssessments = 0, completeCourses = 0, incompleteCourses = 0, noMarksCourses = 0

      type ACD = {
        course: any; assessments: any[]; cumulativeWeight: number
        publishedMarks: number; totalMarkEntries: number; finalStatus: string; deadline: string | null
      }
      const courseData: ACD[] = []

      for (let i = 0; i < courses.length; i++) {
        const c = courses[i]
        setProgress({ current: i + 1, total: courses.length, label: c.code })
        try {
          const sem = String(c.semester || '')
          const timeline = timelines.find((t) => t.academic_year === selectedYear && String(t.semester) === sem)
          const deadline = timeline?.grade_submission_deadline || null
          const [aRes, marks] = await Promise.all([listAssessments(c.id, { limit: 500 }), getCourseAllMarks(c.id)])
          const assessments: any[] = (aRes as any).data || (Array.isArray(aRes) ? (aRes as any) : [])
          const cumulativeWeight = Math.round(
            assessments.reduce((s, a) => s + (a.weight ?? a.weight_percentage ?? 0), 0) * 10
          ) / 10
          const publishedMarks = (marks || []).filter((m: any) => m.status === 'published').length
          const totalMarkEntries = (marks || []).length
          const publicationPct = totalMarkEntries > 0 ? Math.round((publishedMarks / totalMarkEntries) * 100) : 0
          const weightStatus = cumulativeWeight > 100 ? 'Overweight' : cumulativeWeight < 100 && assessments.length > 0 ? 'Underweight' : 'Weight OK'
          let pubStatus = 'No Marks'
          if (totalMarkEntries > 0) {
            pubStatus = publicationPct === 100 ? 'All Published' : `${publicationPct}% Published`
            if (publicationPct === 100) completeCourses++; else incompleteCourses++
          } else { noMarksCourses++ }
          const finalStatus = weightStatus === 'Weight OK' ? pubStatus : `${pubStatus} | ${weightStatus}`
          totalAssessments += assessments.length
          courseData.push({ course: c, assessments, cumulativeWeight, publishedMarks, totalMarkEntries, finalStatus, deadline })
        } catch {
          courseData.push({ course: c, assessments: [], cumulativeWeight: 0, publishedMarks: 0, totalMarkEntries: 0, finalStatus: 'Error', deadline: null })
        }
      }

      const subHeaders = ['Assessment Name', 'Type', 'Max Score', 'Weight', 'Cumulative Weight', 'Locked', 'Assessment Date', 'Days Until Grade Deadline']

      function makeAssessBlock(cd: ACD): CourseBlock {
        const c = cd.course
        let runningWeight = 0
        return {
          courseHeader: [
            [c.code || '', c.name || '', `Section: ${c.section || '—'}`, `Credits: ${c.credits ?? '—'}`, `Lecturer: ${lecturerDisplay(c, lecturerMap)}`],
            ['', `Status: ${cd.finalStatus}`, `Cumulative Weight: ${cd.cumulativeWeight}%`, `Mark Entries: ${cd.publishedMarks}/${cd.totalMarkEntries} published`],
          ],
          subHeaders,
          rows: cd.assessments.map((x) => {
            const w = x.weight ?? x.weight_percentage ?? 0
            runningWeight = Math.round((runningWeight + w) * 10) / 10
            return [
              x.name || '', x.type || '', x.max_score ?? '',
              `${w}%`, `${runningWeight}%`,
              x.is_locked === true ? 'Yes' : 'No',
              formatDateLocal(x.assessment_date) || '',
              cd.deadline ? (daysUntilDeadline(cd.deadline) ?? 'N/A') : 'No deadline',
            ]
          }),
          subtotals: cd.assessments.length > 0
            ? [['', `Total: ${cd.assessments.length} assessment${cd.assessments.length !== 1 ? 's' : ''}`, '', `Weight: ${cd.cumulativeWeight}%`]]
            : [['', 'No assessments configured']],
        }
      }

      const semLabel = isFullYear ? 'Full Year' : `Semester ${selectedSemester}`
      const filename = isFullYear
        ? `assessment_report_${selectedYear}_fullyear_${dateStamp()}.csv`
        : `assessment_report_${selectedYear}_S${selectedSemester}_${dateStamp()}.csv`
      const titleRow = buildReportHeader('MarkDesk Assessment Configuration Report', selectedYear, semLabel)
      const overall: (string | number)[][] = [
        ['OVERALL SUMMARY'],
        ['', 'Total Courses:', courses.length, '', 'Total Assessments:', totalAssessments],
        ['', 'All Published:', completeCourses, '', 'Partial / No Marks:', incompleteCourses + noMarksCourses],
      ]

      if (isFullYear) {
        const semGroups = groupBySemester(courses)
        const groups: SemesterGroup[] = []
        for (const [sem, semCourses] of semGroups) {
          const semA = semCourses.reduce((s, c) => s + (courseData.find((d) => d.course.id === c.id)?.assessments.length ?? 0), 0)
          groups.push({
            groupLabel: `SEMESTER ${sem}`,
            blocks: semCourses
              .map((c) => courseData.find((d) => d.course.id === c.id))
              .filter((cd): cd is ACD => !!cd)
              .map(makeAssessBlock),
            groupSummary: [['', `Semester ${sem} — ${semCourses.length} courses`, '', 'Assessments:', semA]],
          })
        }
        buildGroupedYearCsv(filename, titleRow, groups, overall)
      } else {
        buildGroupedCsv(filename, titleRow, courseData.map(makeAssessBlock), overall)
      }

      setLastExported((p) => ({ ...p, assess: new Date().toLocaleTimeString() }))
      addToast(`Exported ${courses.length} courses, ${totalAssessments} assessments`, 'success')
    } catch {
      addToast('Failed to generate assessment report', 'error')
    } finally { setBusy(null); setProgress(null) }
  }

  // ── Grade Marks Report ───────────────────────────────────────────────────────
  // Three-level nesting (Course → Assessment → Student) requires manual CSV builder.

  async function downloadGradeReport() {
    if (!selectedYear) return
    setBusy('grades')
    const isFullYear = selectedSemester === 'all'
    try {
      const [cRes, lecturerMap] = await Promise.all([listCourses({ limit: 2000 }), buildLecturerMap()])
      const allCourses: any[] = cRes.data || (cRes as any) || []
      const courses = allCourses.filter((c) => matchesYearSemester(c, selectedYear, selectedSemester))
      setProgress({ current: 0, total: courses.length, label: 'Fetching marks' })

      let totalMarkEntries = 0

      const esc = (v: string | number | null | undefined) => {
        if (v === null || v === undefined) return ''
        const s = String(v)
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }

      type ABlock = { assessment: any; rows: (string | number | null)[][]; mean: number | null; passCount: number }
      type GCD = { course: any; blocks: ABlock[]; totalEntries: number }
      const courseData: GCD[] = []

      for (let i = 0; i < courses.length; i++) {
        const c = courses[i]
        setProgress({ current: i + 1, total: courses.length, label: c.code })
        try {
          const [aRes, students, marks] = await Promise.all([
            listAssessments(c.id, { limit: 500 }),
            getEnrolledStudents(c.id),
            getCourseAllMarks(c.id),
          ])
          const aData: any[] = (aRes as any).data || (Array.isArray(aRes) ? (aRes as any) : [])
          const aMap = new Map<string, any>()
          for (const a of aData) aMap.set(a.id, a)
          const sMap = new Map<string, any>()
          for (const s of students as any[]) sMap.set(s.id, s)

          const byAssessment = new Map<string, any[]>()
          for (const m of marks || []) {
            if (!byAssessment.has(m.assessment_id)) byAssessment.set(m.assessment_id, [])
            byAssessment.get(m.assessment_id)!.push(m)
          }

          const blocks: ABlock[] = []
          let courseEntries = 0
          for (const a of aData) {
            const mArr = byAssessment.get(a.id) || []
            const maxScore = a.max_score ?? 100
            const weight = a.weight ?? a.weight_percentage ?? 0
            let normSum = 0, normCount = 0, passCount = 0
            const rows: (string | number | null)[][] = mArr.map((m) => {
              const student = sMap.get(m.student_id) || {}
              const raw: number | null = m.raw_score ?? null
              const band = raw !== null ? calculateGradeBand(raw, maxScore) : null
              if (band) {
                normSum += band.percentage; normCount++
                if (band.pass) passCount++
              }
              const weighted = band ? Math.round((band.percentage * (weight / 100)) * 100) / 100 : ''
              return [
                student.email || (m as any).student_email || '',
                student.full_name || (m as any).student_name || '',
                raw ?? '', maxScore,
                band ? band.percentage : '', weighted,
                m.status || '',
                band ? band.letter : '', band ? band.gpa : '',
                band ? (band.pass ? 'Pass' : 'Fail') : '',
              ]
            })
            courseEntries += rows.length
            blocks.push({ assessment: a, rows, mean: normCount > 0 ? Math.round((normSum / normCount) * 10) / 10 : null, passCount })
          }
          totalMarkEntries += courseEntries
          courseData.push({ course: c, blocks, totalEntries: courseEntries })
        } catch { courseData.push({ course: c, blocks: [], totalEntries: 0 }) }
      }

      const markHeaders = ['Student Email', 'Student Name', 'Raw Score', 'Max Score', 'Normalised %', 'Weighted Marks', 'Status', 'Letter Grade', 'GPA Point', 'Pass/Fail']

      const lines: string[] = []
      const semLabel = isFullYear ? 'Full Year' : `Semester ${selectedSemester}`
      lines.push(esc(buildReportHeader('MarkDesk Grade Marks Report', selectedYear, semLabel)))
      lines.push('')

      function renderGradeCourse(cd: GCD) {
        const c = cd.course
        lines.push([c.code || '', c.name || '', `Section: ${c.section || '—'}`, `Credits: ${c.credits ?? '—'}`, `Lecturer: ${lecturerDisplay(c, lecturerMap)}`].map(esc).join(','))
        if (cd.blocks.length === 0) {
          lines.push(['', 'No assessments configured'].map(esc).join(','))
        }
        for (const blk of cd.blocks) {
          const a = blk.assessment
          const w = a.weight ?? a.weight_percentage ?? 0
          lines.push(['', `[${a.name || ''}  —  ${a.type || ''}  |  Max: ${a.max_score ?? ''}  |  Weight: ${w}%]`].map(esc).join(','))
          lines.push(['', '', ...markHeaders].map(esc).join(','))
          for (const row of blk.rows) lines.push(['', '', ...row].map(esc).join(','))
          if (blk.rows.length > 0) {
            const passRate = Math.round((blk.passCount / blk.rows.length) * 100)
            lines.push(['', '', '', '', '', 'Mean:', blk.mean !== null ? `${blk.mean}%` : 'N/A', 'Pass Rate:', `${passRate}%`, `(${blk.passCount}/${blk.rows.length})`].map(esc).join(','))
          } else {
            lines.push(['', '', 'No marks entered'].map(esc).join(','))
          }
          lines.push('')
        }
      }

      if (isFullYear) {
        for (const [sem, semCourses] of groupBySemester(courses)) {
          lines.push(esc(`\u2500\u2500\u2500 SEMESTER ${sem} \u2500\u2500\u2500`))
          lines.push('')
          for (const c of semCourses) {
            const cd = courseData.find((d) => d.course.id === c.id)
            if (cd) renderGradeCourse(cd)
          }
          const semEntries = semCourses.reduce((s, c) => s + (courseData.find((d) => d.course.id === c.id)?.totalEntries ?? 0), 0)
          lines.push(['', `Semester ${sem} — ${semCourses.length} courses`, '', 'Mark Entries:', semEntries].map(esc).join(','))
          lines.push('')
        }
      } else {
        for (const cd of courseData) renderGradeCourse(cd)
      }

      lines.push(['OVERALL SUMMARY'].map(esc).join(','))
      lines.push(['', 'Total Courses:', courses.length, '', 'Total Mark Entries:', totalMarkEntries].map(esc).join(','))

      const csv = lines.join('\r\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = isFullYear
        ? `grade_marks_report_${selectedYear}_fullyear_${dateStamp()}.csv`
        : `grade_marks_report_${selectedYear}_S${selectedSemester}_${dateStamp()}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      setLastExported((p) => ({ ...p, grades: new Date().toLocaleTimeString() }))
      addToast(`Exported ${totalMarkEntries} mark entries across ${courses.length} courses`, 'success')
    } catch {
      addToast('Failed to generate grade report', 'error')
    } finally { setBusy(null); setProgress(null) }
  }

  const statCards = [
    { label: 'Total Courses', value: totals.courses, icon: BookOpen, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]' },
    { label: 'Active Enrollments', value: totals.enrollments, icon: GraduationCap, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
    { label: 'Assessments Configured', value: totals.assessments, icon: ClipboardList, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
  ]

  const reportCards = [
    { key: 'enroll', title: 'Enrollment Report', description: 'All enrolled students per course with email, enrollment status, and enrollment date. Active and dropped students are included.', icon: Users, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]', fn: downloadEnrollmentReport, viewPath: '/courses' },
    { key: 'assess', title: 'Assessment Report', description: 'Two-section CSV: Section A shows per-course lecturer mapping, assessment counts, cumulative weight, and marks publication status. Section B lists every assessment with weight breakdown and grade deadline.', icon: ClipboardList, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]', fn: downloadAssessmentReport, viewPath: '/assessment-config' },
    { key: 'grades', title: 'Grade Marks Report', description: 'Every submitted mark with normalised %, weighted contribution, letter grade, GPA point, and Pass/Fail result — strictly scoped to the selected year and semester.', icon: TrendingUp, color: 'text-[#10B981]', bg: 'bg-[#D1FAE5]', fn: downloadGradeReport, viewPath: '/smart-grid' },
  ]

  const canExport = !!selectedYear && !filterLoading

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="pt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-[#111827]">Reports</h1>
            <p className="text-[16px] text-[#6B7280] mt-1">Generate detailed reports across courses, enrollments, and assessments</p>
          </div>
          <button onClick={loadTotals} disabled={loading}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280] disabled:opacity-50"
            title="Refresh totals">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <Card className="bg-[#F9FAFB]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[#374151]">
              <Filter className="w-4 h-4 text-[#6B7280]" />
              <span className="text-sm font-medium">Filter by Academic Year & Semester</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={filterLoading}
                className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#C90031] disabled:opacity-50"
              >
                {filterLoading && <option>Loading…</option>}
                {academicYears.map((y) => (
                  <option key={y.id} value={y.name}>{y.name}{y.is_active ? ' (Active)' : ''}</option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#C90031]"
              >
                <option value="all">All Semesters (Full Year)</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
              </select>
              {selectedYear && (
                <span className="text-xs text-[#6B7280] bg-white px-2 py-1 rounded border border-[#E5E7EB]">
                  <CalendarDays className="w-3 h-3 inline mr-1" />
                  {selectedYear} · {selectedSemester === 'all' ? 'Full Year' : `Semester ${selectedSemester}`}
                </span>
              )}
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                    <p className={`text-[28px] font-bold mt-1 ${s.color}`}>
                      {loading ? <Spinner size="sm" /> : s.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        {progress && (
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-[#374151]">{progress.label}</span>
                <span className="text-[#9CA3AF] tabular-nums">{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C90031] transition-all duration-300 rounded-full"
                  style={{ width: `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%` }}
                />
              </div>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reportCards.map((item) => {
            const Icon = item.icon
            const isBusy = busy === item.key
            return (
              <Card key={item.key} className="hover:shadow-md transition-shadow flex flex-col">
                <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="font-bold text-[#111827] text-[15px]">{item.title}</h3>
                <p className="text-[13px] text-[#6B7280] mt-1.5 flex-1">{item.description}</p>
                {lastExported[item.key] && (
                  <p className="text-[11px] text-[#10B981] mt-2">Last exported at {lastExported[item.key]}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={item.fn}
                    disabled={!!busy || !canExport}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBusy ? <><Spinner size="sm" /> Generating…</> : <><Download className="w-4 h-4" /> CSV</>}
                  </button>
                  <button
                    onClick={() => router.push(item.viewPath)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-[#E5E7EB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
        <Card>
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-[#6B7280] flex-shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#6B7280]">
              <p className="font-medium text-[#374151]">Per-course grade sheet</p>
              <p className="mt-1">
                Open any course from{' '}
                <button onClick={() => router.push('/courses')} className="text-[#C90031] hover:underline font-medium">My Courses</button>
                {' '}and use the &quot;Grade Sheet&quot; export to download grades for a single course.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
