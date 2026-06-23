'use client'

import { useEffect, useState } from 'react'
import { Download, Users, BookOpen, FileText, GraduationCap, Flag, CalendarDays, Filter } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { getAuditLogs } from '@/lib/api/admin'
import { listCourses, listLecturers as _listFacultyUsers } from '@/lib/api/courses'
import { apiClient } from '@/lib/api/client'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { getFlaggedMarks } from '@/lib/api/marks'
import { listAcademicYears, getActiveAcademicYear } from '@/lib/api/semester'
import {
  generateReportCsv, buildGroupedCsv, buildGroupedYearCsv,
  type CourseBlock, type SemesterGroup,
  dateStamp,
} from '@/lib/utils/csv-enhanced'
import {
  buildReportHeader,
  formatDateTimeLocal,
  formatDateLocal,
  calculateDaysSince,
  auditActionCategory,
  auditDetails,
  matchesYearSemester,
} from '@/lib/utils/reports'

interface ExportItem {
  key: string
  title: string
  description: string
  icon: typeof Users
  color: string
  bg: string
  scoped: boolean
  fn: () => Promise<{ rows: number }>
}

export default function ExportPage() {
  const { addToast } = useToastStore()
  const [busy, setBusy] = useState<string | null>(null)
  const [lastExported, setLastExported] = useState<Record<string, { time: string; rows: number }>>({})

  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; is_active: boolean }[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedSemester, setSelectedSemester] = useState<string>('1')
  const [filterLoading, setFilterLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const [years, active] = await Promise.all([listAcademicYears(), getActiveAcademicYear()])
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

  // Export 1: All Students (global — not scoped by year)
  async function exportStudents() {
    const res = await apiClient.get('/users', { params: { role: 'student', limit: 2000 } })
    const students: any[] = res.data.users || res.data.data || []
    const rows = students.map((u) => [
      u.id, u.email, u.full_name, u.matric_number || '', u.approval_status || '',
      u.is_active ? 'Yes' : 'No', formatDateLocal(u.created_at) || '',
    ])
    generateReportCsv(`students_${dateStamp()}.csv`, {
      titleRow: buildReportHeader('MarksDesk Student List'),
      headers: ['ID', 'Email', 'Full Name', 'Matric Number', 'Approval Status', 'Active', 'Created At'],
      rows,
      summaryRows: [['', '', '', '', '', 'Total Students:', rows.length]],
    })
    return { rows: rows.length }
  }

  // Export 2: Faculty Directory (global — not scoped by year)
  async function exportLecturers() {
    const lecturers = await _listFacultyUsers()
    const rows = (lecturers || []).map((l: any) => [
      l.id, l.email, l.full_name, l.role,
      (l.special_roles || []).join('; '), l.is_active ? 'Yes' : 'No',
      l.max_teaching_credits ?? '', formatDateLocal(l.created_at) || '',
    ])
    generateReportCsv(`faculty_directory_${dateStamp()}.csv`, {
      titleRow: buildReportHeader('MarksDesk Faculty Directory'),
      headers: ['ID', 'Email', 'Full Name', 'Base Role', 'Special Roles', 'Active', 'Max Teaching Credits', 'Created At'],
      rows,
      summaryRows: [['', '', '', '', '', '', 'Total Faculty:', rows.length]],
    })
    return { rows: rows.length }
  }

  // ── Shared helpers ────────────────────────────────────────────────────────────

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

  function lecturerName(c: any, map: Map<string, string>): string {
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

  // Export 3: Course Summary (scoped by year + semester, grouped per course)
  async function exportCourseSummary() {
    const isFullYear = selectedSemester === 'all'
    const [cRes, lecMap] = await Promise.all([listCourses({ limit: 2000 }), buildLecturerMap()])
    const allCourses = cRes.data || (cRes as any) || []
    const courses = allCourses.filter((c: any) => matchesYearSemester(c, selectedYear, selectedSemester))

    type CSD = { course: any; enrolled: number }
    const courseData: CSD[] = await Promise.all(
      courses.map(async (c: any) => {
        try {
          const students = await getEnrolledStudents(c.id)
          const enrolled = Array.isArray(students)
            ? students.filter((s: any) => (s.status || '').toLowerCase() === 'active').length
            : 0
          return { course: c, enrolled }
        } catch { return { course: c, enrolled: 0 } }
      })
    )

    const totalEnrolled = courseData.reduce((s, d) => s + d.enrolled, 0)
    function makeSummaryBlock(cd: CSD): CourseBlock {
      const c = cd.course
      const max = c.max_students ?? 0
      const fillRate = max > 0 ? `${Math.round((cd.enrolled / max) * 100)}%` : '—'
      return {
        courseHeader: [[
          `${c.code || ''}  ${c.name || ''}`,
          `Section: ${c.section || '—'}`, `Semester: ${c.semester || '—'}`,
          `Credits: ${c.credits ?? '—'}`, `Lecturer: ${lecturerName(c, lecMap)}`,
          `Enrolled: ${cd.enrolled} / Max: ${max || '—'}`, `Fill Rate: ${fillRate}`,
        ]],
        subHeaders: [],
        rows: [],
      }
    }

    const semLabel = isFullYear ? 'Full Year' : `Semester ${selectedSemester}`
    const filename = isFullYear
      ? `course_summary_${selectedYear}_fullyear_${dateStamp()}.csv`
      : `course_summary_${selectedYear}_S${selectedSemester}_${dateStamp()}.csv`
    const titleRow = buildReportHeader('MarksDesk Course Summary', selectedYear, semLabel)
    const overall: (string | number)[][] = [
      ['OVERALL SUMMARY'],
      ['', 'Total Courses:', courses.length, '', 'Total Active Enrolments:', totalEnrolled],
    ]

    if (isFullYear) {
      const semGroups = groupBySemester(courses)
      const groups: SemesterGroup[] = []
      for (const [sem, semCourses] of semGroups) {
        const semEnrolled = semCourses.reduce((s, c) => s + (courseData.find((d) => d.course.id === c.id)?.enrolled ?? 0), 0)
        const blocks: CourseBlock[] = []
        for (const c of semCourses) {
          const cd = courseData.find((d) => d.course.id === c.id)
          if (cd) blocks.push(makeSummaryBlock(cd))
        }
        groups.push({
          groupLabel: `SEMESTER ${sem}`,
          blocks,
          groupSummary: [['', `Semester ${sem} — ${semCourses.length} courses`, '', 'Enrolled:', semEnrolled]],
        })
      }
      buildGroupedYearCsv(filename, titleRow, groups, overall)
    } else {
      buildGroupedCsv(filename, titleRow, courseData.map(makeSummaryBlock), overall)
    }

    return { rows: courses.length }
  }

  // Export 4: Flagged Marks — grouped per course
  async function exportFlaggedMarks() {
    const isFullYear = selectedSemester === 'all'
    const [flagRes, cRes, lecMap] = await Promise.all([
      getFlaggedMarks(),
      listCourses({ limit: 2000 }),
      buildLecturerMap(),
    ])
    const allFlagged = flagRes.flagged_marks || []
    const allCourses = cRes.data || (cRes as any) || []
    const scopedCourses = allCourses.filter((c: any) => matchesYearSemester(c, selectedYear, selectedSemester))
    const courseMap = new Map<string, any>()
    for (const c of scopedCourses) courseMap.set(c.id, c)

    const flagsByCourse = new Map<string, any[]>()
    for (const m of allFlagged) {
      const ma = m as any
      const cid = ma.course_id || ma.courses?.id || ma.assessments?.courses?.id || ''
      if (!courseMap.has(cid)) continue
      if (!flagsByCourse.has(cid)) flagsByCourse.set(cid, [])
      flagsByCourse.get(cid)!.push(m)
    }

    const subHeaders = ['Student Email', 'Student Name', 'Assessment', 'Raw Score', 'Max Score', 'Flag Note', 'Days Since Flagged']

    function makeFlagBlock(c: any): CourseBlock {
      const flags = flagsByCourse.get(c.id) || []
      return {
        courseHeader: [[
          `${c.code || ''}  ${c.name || ''}`,
          `Section: ${c.section || '—'}`, `Semester: ${c.semester || '—'}`,
          `Lecturer: ${lecturerName(c, lecMap)}`,
        ]],
        subHeaders,
        rows: flags.map((m) => [
          m.student_email || m.student?.email || '',
          m.student_name || m.student?.full_name || '',
          m.assessment_name || m.assessments?.name || '',
          m.raw_score ?? '', m.max_score ?? '',
          m.flag_note || '',
          calculateDaysSince(m.updated_at || m.created_at),
        ]),
        subtotals: flags.length > 0 ? [['', '', '', '', '', 'Course Flags:', flags.length]] : [['', 'No flags for this course']],
      }
    }

    const totalFlags = allFlagged.filter((m) => {
      const ma = m as any
      const cid = ma.course_id || ma.courses?.id || ma.assessments?.courses?.id || ''
      return courseMap.has(cid)
    }).length

    const semLabel = isFullYear ? 'Full Year' : `Semester ${selectedSemester}`
    const filename = isFullYear
      ? `flagged_marks_${selectedYear}_fullyear_${dateStamp()}.csv`
      : `flagged_marks_${selectedYear}_S${selectedSemester}_${dateStamp()}.csv`
    const titleRow = buildReportHeader('MarksDesk Flagged Marks Report', selectedYear, semLabel)
    const overall: (string | number)[][] = [
      ['OVERALL SUMMARY'],
      ['', 'Courses with flags:', flagsByCourse.size, '', 'Total Flags:', totalFlags],
    ]

    if (isFullYear) {
      const semGroups = groupBySemester(scopedCourses)
      const groups: SemesterGroup[] = []
      for (const [sem, semCourses] of semGroups) {
        const semFlags = semCourses.reduce((s, c) => s + (flagsByCourse.get(c.id)?.length ?? 0), 0)
        groups.push({
          groupLabel: `SEMESTER ${sem}`,
          blocks: semCourses.map(makeFlagBlock),
          groupSummary: semFlags > 0
            ? [['', `Semester ${sem} — ${semCourses.length} courses`, '', 'Flags:', semFlags]]
            : [['', `Semester ${sem} — ${semCourses.length} courses (no flags)`, '', '']],
        })
      }
      buildGroupedYearCsv(filename, titleRow, groups, overall)
    } else {
      buildGroupedCsv(filename, titleRow, scopedCourses.map(makeFlagBlock), overall)
    }

    return { rows: totalFlags }
  }

  // Export 5: Audit Log (global — not scoped by year)
  async function exportAuditLog() {
    const res = await getAuditLogs({ limit: 2000, offset: 0 })
    const rows = (res.logs || []).map((l: any) => [
      formatDateTimeLocal(l.created_at) || '', l.action || '', auditActionCategory(l.action || ''),
      l.actor_email || '', l.actor_name || '', l.entity_type || '', l.entity_id || '',
      l.ip_address || '', auditDetails(l.old_values, l.new_values),
    ])
    generateReportCsv(`audit_log_${dateStamp()}.csv`, {
      titleRow: buildReportHeader('MarksDesk Audit Log'),
      headers: ['Timestamp', 'Action', 'Category', 'Actor Email', 'Actor Name', 'Entity Type', 'Entity ID', 'IP Address', 'Changes'],
      rows,
      summaryRows: [['', '', '', '', '', '', '', 'Total Entries:', rows.length]],
    })
    return { rows: rows.length }
  }

  const items: ExportItem[] = [
    {
      key: 'students', title: 'Student List',
      description: 'All registered students with email, matric number, and approval status.',
      icon: GraduationCap, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]',
      scoped: false, fn: exportStudents,
    },
    {
      key: 'lecturers', title: 'Faculty Directory',
      description: 'All lecturers, coordinators, and HODs with special roles and teaching credit limits.',
      icon: Users, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]',
      scoped: false, fn: exportLecturers,
    },
    {
      key: 'courses', title: 'Course Summary',
      description: 'All courses for the selected academic year & semester with lecturer and enrolment count.',
      icon: BookOpen, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]',
      scoped: true, fn: exportCourseSummary,
    },
    {
      key: 'flagged', title: 'Flagged Marks',
      description: 'Flagged marks for the selected academic year & semester with course and flag note.',
      icon: Flag, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]',
      scoped: true, fn: exportFlaggedMarks,
    },
    {
      key: 'audit', title: 'Audit Log (last 500)',
      description: 'Recent system activity — actions, actors, entities, and IP addresses.',
      icon: FileText, color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]',
      scoped: false, fn: exportAuditLog,
    },
  ]

  async function handleExport(item: ExportItem) {
    setBusy(item.key)
    try {
      const { rows } = await item.fn()
      setLastExported((p) => ({ ...p, [item.key]: { time: new Date().toLocaleTimeString(), rows } }))
      addToast(`Exported ${rows} rows — ${item.title}`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || `Failed to export ${item.title}`, 'error')
    } finally {
      setBusy(null)
    }
  }

  const canExport = !!selectedYear && !filterLoading

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="pt-2">
          <h1 className="text-[32px] font-bold text-[#111827]">Export Data</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Download CSV reports for record-keeping and compliance</p>
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

        {busy && (
          <Card>
            <div className="flex items-center gap-3 text-[13px] text-[#374151]">
              <Spinner size="sm" />
              <span>Generating export, please wait…</span>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((item) => {
            const Icon = item.icon
            const isBusy = busy === item.key
            const last = lastExported[item.key]
            return (
              <Card key={item.key} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#111827] text-[15px]">{item.title}</h3>
                      {item.scoped && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5E7EB] text-[#6B7280] font-medium">Scoped</span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#6B7280] mt-1">{item.description}</p>
                    {last && (
                      <p className="text-[11px] text-[#10B981] mt-1.5">
                        Last exported at {last.time} · {last.rows} rows
                      </p>
                    )}
                    <button
                      onClick={() => handleExport(item)}
                      disabled={!!busy || (item.scoped && !canExport)}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBusy ? <><Spinner size="sm" /> Generating…</> : <><Download className="w-4 h-4" /> Download CSV</>}
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#6B7280] flex-shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#6B7280]">
              <p className="font-medium text-[#374151]">CSV format notes</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Files use UTF-8 with BOM — open cleanly in Excel and Numbers</li>
                <li>Fields containing commas, quotes, or newlines are properly escaped</li>
                <li>Per-course grade reports are available from each course&apos;s detail page</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
