'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, BarChart3, Users, ClipboardList, Download, ExternalLink, Flag,
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { listAssessments } from '@/lib/api/assessments'
import { getFlaggedMarks } from '@/lib/api/marks'
import { downloadCsv, dateStamp } from '@/lib/utils/csv'

interface Totals {
  courses: number
  enrollments: number
  assessments: number
  flagged: number
}

export default function ReportsPage() {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [totals, setTotals] = useState<Totals>({ courses: 0, enrollments: 0, assessments: 0, flagged: 0 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cRes = await listCourses({ limit: 500 })
        const courses = cRes.data || (cRes as any) || []

        const [enrCounts, assCounts, flaggedRes] = await Promise.all([
          Promise.all(courses.map(async (c: any) => {
            try {
              const s = await getEnrolledStudents(c.id)
              return Array.isArray(s) ? s.length : 0
            } catch { return 0 }
          })),
          Promise.all(courses.map(async (c: any) => {
            try {
              const a = await listAssessments(c.id, { limit: 500 })
              return (a.data || []).length
            } catch { return 0 }
          })),
          getFlaggedMarks().catch(() => ({ count: 0, flagged_marks: [] })),
        ])

        if (cancelled) return
        setTotals({
          courses: courses.length,
          enrollments: enrCounts.reduce((a: number, b: number) => a + b, 0),
          assessments: assCounts.reduce((a: number, b: number) => a + b, 0),
          flagged: flaggedRes.count || 0,
        })
      } catch (err) {
        if (!cancelled) addToast('Failed to load report totals', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [addToast])

  // ── Report 1: Enrollment Report ───────────────────────────────────────────
  async function downloadEnrollmentReport() {
    setBusy('enroll')
    try {
      const cRes = await listCourses({ limit: 500 })
      const courses = cRes.data || (cRes as any) || []
      const headers = ['Course Code', 'Course Name', 'Section', 'Lecturer', 'Student Email', 'Student Name', 'Matric Number', 'Status']
      const rows: (string | number)[][] = []
      for (const c of courses) {
        try {
          const students = await getEnrolledStudents(c.id)
          for (const s of (students as any[]) || []) {
            rows.push([
              c.code, c.name || '', c.section || '', c.lecturer_name || '',
              s.email || '', s.full_name || '', s.matric_number || '', s.status || '',
            ])
          }
        } catch { /* skip course on error */ }
      }
      downloadCsv(`enrollment_report_${dateStamp()}.csv`, headers, rows)
      addToast(`Exported ${rows.length} enrollments`, 'success')
    } catch {
      addToast('Failed to generate enrollment report', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ── Report 2: Performance Report (flagged marks across all courses) ───────
  async function downloadPerformanceReport() {
    setBusy('perf')
    try {
      const res = await getFlaggedMarks()
      const headers = [
        'Course Code', 'Course Name', 'Assessment', 'Type',
        'Student Email', 'Student Name',
        'Raw Score', 'Max Score', 'Weight %', 'Flag Reason', 'Updated At',
      ]
      const rows = (res.flagged_marks || []).map((m: any) => [
        m.courses?.code || '', m.courses?.name || '',
        m.assessments?.name || '', m.assessments?.type || '',
        m.student?.email || '', m.student?.full_name || '',
        m.raw_score ?? '', m.assessments?.max_score ?? '',
        m.assessments?.weight_percentage ?? '',
        m.flag_note || '', m.updated_at || '',
      ])
      downloadCsv(`flagged_marks_${dateStamp()}.csv`, headers, rows)
      addToast(`Exported ${rows.length} flagged marks`, 'success')
    } catch {
      addToast('Failed to generate performance report', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ── Report 3: Assessment Report ───────────────────────────────────────────
  async function downloadAssessmentReport() {
    setBusy('assess')
    try {
      const cRes = await listCourses({ limit: 500 })
      const courses = cRes.data || (cRes as any) || []
      const headers = ['Course Code', 'Course Name', 'Assessment Name', 'Type', 'Max Score', 'Weight %', 'Locked', 'Date']
      const rows: (string | number)[][] = []
      for (const c of courses) {
        try {
          const a = await listAssessments(c.id, { limit: 500 })
          for (const x of a.data || []) {
            rows.push([
              c.code, c.name || '',
              x.name || '', x.type || '',
              (x as any).max_score ?? '',
              (x as any).weight_percentage ?? (x as any).weight ?? '',
              (x as any).is_locked ? 'Yes' : 'No',
              (x as any).assessment_date || '',
            ])
          }
        } catch { /* skip course on error */ }
      }
      downloadCsv(`assessments_${dateStamp()}.csv`, headers, rows)
      addToast(`Exported ${rows.length} assessments`, 'success')
    } catch {
      addToast('Failed to generate assessment report', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Reports</h1>
          <p className="text-[#6B7280] mt-1">Generate detailed reports across courses, enrollments, and assessments</p>
        </div>
      </div>

      {/* Top totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Courses', value: totals.courses, color: 'text-[#C90031]' },
          { label: 'Enrollments', value: totals.enrollments, color: 'text-[#3B82F6]' },
          { label: 'Assessments', value: totals.assessments, color: 'text-[#7C3AED]' },
          { label: 'Flagged Marks', value: totals.flagged, color: 'text-[#F59E0B]' },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</p>
            <p className={`text-[26px] font-bold mt-1 ${s.color}`}>
              {loading ? <Spinner size="sm" /> : s.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Enrollment Report */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-[#FEE2E2] flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-[#C90031]" />
          </div>
          <h3 className="font-bold text-[#111827]">Enrollment Report</h3>
          <p className="text-[13px] text-[#6B7280] mt-1.5 mb-4">
            Every enrolled student across every course with status and matric number.
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadEnrollmentReport}
              disabled={busy === 'enroll'}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] disabled:opacity-50 transition-colors"
            >
              {busy === 'enroll' ? <Spinner size="sm" /> : <Download className="w-4 h-4" />} CSV
            </button>
            <button
              onClick={() => router.push('/courses')}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-[#E5E7EB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> View
            </button>
          </div>
        </Card>

        {/* 2. Performance / Flagged Report */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] flex items-center justify-center mb-4">
            <Flag className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h3 className="font-bold text-[#111827]">Flagged Marks Report</h3>
          <p className="text-[13px] text-[#6B7280] mt-1.5 mb-4">
            All marks flagged for review with student, course, score, and reason.
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadPerformanceReport}
              disabled={busy === 'perf'}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] disabled:opacity-50 transition-colors"
            >
              {busy === 'perf' ? <Spinner size="sm" /> : <Download className="w-4 h-4" />} CSV
            </button>
            <button
              onClick={() => router.push('/flagged-marks')}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-[#E5E7EB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> View
            </button>
          </div>
        </Card>

        {/* 3. Assessment Report */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-[#F5F3FF] flex items-center justify-center mb-4">
            <ClipboardList className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <h3 className="font-bold text-[#111827]">Assessment Report</h3>
          <p className="text-[13px] text-[#6B7280] mt-1.5 mb-4">
            Every configured assessment with type, weight, max score, and lock status.
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadAssessmentReport}
              disabled={busy === 'assess'}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] disabled:opacity-50 transition-colors"
            >
              {busy === 'assess' ? <Spinner size="sm" /> : <Download className="w-4 h-4" />} CSV
            </button>
            <button
              onClick={() => router.push('/assessment-config')}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-[#E5E7EB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> View
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-[#6B7280] flex-shrink-0 mt-0.5" />
          <div className="text-[13px] text-[#6B7280]">
            <p className="font-medium text-[#374151]">Need a per-course grade report?</p>
            <p className="mt-1">
              Open a course from <button onClick={() => router.push('/courses')} className="text-[#C90031] hover:underline font-medium">My Courses</button> and use the &quot;Smart Grid&quot; export to download grades for that specific course.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
