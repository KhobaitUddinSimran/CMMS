'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Users, ClipboardList, Download, ExternalLink,
  GraduationCap, RefreshCw, TrendingUp, BookOpen,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { listAssessments } from '@/lib/api/assessments'
import { getCourseAllMarks } from '@/lib/api/marks'
import { downloadCsv, dateStamp } from '@/lib/utils/csv'

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
  const [totals, setTotals] = useState<Totals>({ courses: 0, enrollments: 0, assessments: 0 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState<FetchProgress | null>(null)
  const [lastExported, setLastExported] = useState<Record<string, string>>({})

  const loadTotals = useCallback(async () => {
    setLoading(true)
    try {
      const cRes = await listCourses({ limit: 500 })
      const courses: any[] = cRes.data || (cRes as any) || []
      const courseCount = (cRes as any).total ?? courses.length

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
      setTotals({ courses: courseCount, enrollments: enrollCount, assessments: assessCount })
    } catch {
      addToast('Failed to load report totals', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadTotals() }, [loadTotals])

  // ── Report 1: Enrollment Report ───────────────────────────────────────────
  async function downloadEnrollmentReport() {
    setBusy('enroll')
    try {
      const cRes = await listCourses({ limit: 500 })
      const courses: any[] = cRes.data || (cRes as any) || []
      setProgress({ current: 0, total: courses.length, label: 'Fetching enrollments' })
      const headers = ['Course Code', 'Course Name', 'Section', 'Lecturer', 'Student Email', 'Student Name', 'Matric Number', 'Enrolled Status']
      const rows: (string | number)[][] = []
      for (let i = 0; i < courses.length; i++) {
        const c = courses[i]
        setProgress({ current: i + 1, total: courses.length, label: c.code })
        try {
          const students = await getEnrolledStudents(c.id)
          for (const s of (students as any[]) || []) {
            rows.push([c.code, c.name || '', c.section || '', c.lecturer_name || '',
              s.email || '', s.full_name || '', s.matric_number || '', s.status || ''])
          }
        } catch { /* skip */ }
      }
      downloadCsv(`enrollment_report_${dateStamp()}.csv`, headers, rows)
      setLastExported(p => ({ ...p, enroll: new Date().toLocaleTimeString() }))
      addToast(`Exported ${rows.length} enrollment rows`, 'success')
    } catch {
      addToast('Failed to generate enrollment report', 'error')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  // ── Report 2: Assessment Report ───────────────────────────────────────────
  async function downloadAssessmentReport() {
    setBusy('assess')
    try {
      const cRes = await listCourses({ limit: 500 })
      const courses: any[] = cRes.data || (cRes as any) || []
      setProgress({ current: 0, total: courses.length, label: 'Fetching assessments' })
      const headers = ['Course Code', 'Course Name', 'Assessment Name', 'Type', 'Max Score', 'Weight %', 'Locked', 'Date']
      const rows: (string | number)[][] = []
      for (let i = 0; i < courses.length; i++) {
        const c = courses[i]
        setProgress({ current: i + 1, total: courses.length, label: c.code })
        try {
          const a = await listAssessments(c.id, { limit: 500 })
          for (const x of a.data || []) {
            rows.push([c.code, c.name || '', x.name || '', x.type || '',
              (x as any).max_score ?? '', (x as any).weight_percentage ?? (x as any).weight ?? '',
              (x as any).is_locked ? 'Yes' : 'No', (x as any).assessment_date || ''])
          }
        } catch { /* skip */ }
      }
      downloadCsv(`assessments_${dateStamp()}.csv`, headers, rows)
      setLastExported(p => ({ ...p, assess: new Date().toLocaleTimeString() }))
      addToast(`Exported ${rows.length} assessment rows`, 'success')
    } catch {
      addToast('Failed to generate assessment report', 'error')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  // ── Report 3: Grade Marks Report ──────────────────────────────────────────
  async function downloadGradeReport() {
    setBusy('grades')
    try {
      const cRes = await listCourses({ limit: 500 })
      const courses: any[] = cRes.data || (cRes as any) || []
      setProgress({ current: 0, total: courses.length, label: 'Fetching marks' })
      const headers = ['Course Code', 'Course Name', 'Student Email', 'Student Name',
        'Assessment Name', 'Assessment Type', 'Raw Score', 'Max Score', 'Weight %', 'Status']
      const rows: (string | number)[][] = []
      for (let i = 0; i < courses.length; i++) {
        const c = courses[i]
        setProgress({ current: i + 1, total: courses.length, label: c.code })
        try {
          const marks = await getCourseAllMarks(c.id)
          for (const m of marks) {
            rows.push([c.code, c.name || '',
              (m as any).student_email || (m as any).email || '',
              (m as any).student_name || '',
              (m as any).assessment_name || '',
              (m as any).assessment_type || '',
              m.raw_score ?? '', (m as any).max_score ?? '',
              (m as any).weight_percentage ?? '', m.status || ''])
          }
        } catch { /* skip */ }
      }
      downloadCsv(`grade_report_${dateStamp()}.csv`, headers, rows)
      setLastExported(p => ({ ...p, grades: new Date().toLocaleTimeString() }))
      addToast(`Exported ${rows.length} mark rows`, 'success')
    } catch {
      addToast('Failed to generate grade report', 'error')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  const statCards = [
    { label: 'Total Courses', value: totals.courses, icon: BookOpen, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]' },
    { label: 'Active Enrollments', value: totals.enrollments, icon: GraduationCap, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
    { label: 'Assessments Configured', value: totals.assessments, icon: ClipboardList, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
  ]

  const reportCards = [
    {
      key: 'enroll',
      title: 'Enrollment Report',
      description: 'Every enrolled student across every course — email, matric number, and enrolment status.',
      icon: Users, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]',
      fn: downloadEnrollmentReport,
      viewPath: '/courses',
    },
    {
      key: 'assess',
      title: 'Assessment Report',
      description: 'All configured assessments with type, weight, max score, and lock status per course.',
      icon: ClipboardList, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]',
      fn: downloadAssessmentReport,
      viewPath: '/assessment-config',
    },
    {
      key: 'grades',
      title: 'Grade Marks Report',
      description: 'All submitted marks across every course, student, and assessment — including status.',
      icon: TrendingUp, color: 'text-[#10B981]', bg: 'bg-[#D1FAE5]',
      fn: downloadGradeReport,
      viewPath: '/smart-grid',
    },
  ]

  return (
    <MainLayout>
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Reports</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Generate detailed reports across courses, enrollments, and assessments</p>
        </div>
        <button
          onClick={loadTotals}
          disabled={loading}
          className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280] disabled:opacity-50"
          title="Refresh totals"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Live totals */}
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

      {/* Progress bar during fetch */}
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

      {/* Report cards */}
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
                  disabled={!!busy}
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
