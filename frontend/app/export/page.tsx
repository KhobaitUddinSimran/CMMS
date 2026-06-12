'use client'

import { useState } from 'react'
import { Download, Users, BookOpen, FileText, GraduationCap, Flag } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { getAllUsers, listLecturers, getAuditLogs } from '@/lib/api/admin'
import { listCourses } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { getFlaggedMarks } from '@/lib/api/marks'
import { downloadCsv, dateStamp } from '@/lib/utils/csv'

interface ExportItem {
  key: string
  title: string
  description: string
  icon: typeof Users
  color: string
  bg: string
  fn: () => Promise<{ rows: number }>
}

export default function ExportPage() {
  const { addToast } = useToastStore()
  const [busy, setBusy] = useState<string | null>(null)
  const [lastExported, setLastExported] = useState<Record<string, { time: string; rows: number }>>({})

  // ── Export 1: All Students ────────────────────────────────────────────────
  async function exportStudents() {
    const res = await getAllUsers({ role: 'student' })
    const headers = ['ID', 'Email', 'Full Name', 'Matric Number', 'Approval Status', 'Active', 'Created At']
    const rows = (res.users || []).map((u: any) => [
      u.id, u.email, u.full_name, u.matric_number || '',
      u.approval_status || '', u.is_active ? 'Yes' : 'No', u.created_at || '',
    ])
    downloadCsv(`students_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 2: All Lecturers + Special Roles ───────────────────────────────
  async function exportLecturers() {
    const res = await listLecturers()
    const headers = ['ID', 'Email', 'Full Name', 'Base Role', 'Special Roles', 'Active', 'Max Teaching Credits']
    const rows = (res.lecturers || []).map((l: any) => [
      l.id, l.email, l.full_name, l.role,
      (l.special_roles || []).join('; '),
      l.is_active ? 'Yes' : 'No',
      l.max_teaching_credits ?? '',
    ])
    downloadCsv(`lecturers_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 3: Course Summary (with enrolled count) ────────────────────────
  async function exportCourseSummary() {
    const res = await listCourses({ limit: 500 })
    const courses = res.data || (res as any) || []
    const enrollmentCounts = await Promise.all(
      courses.map(async (c: any) => {
        try {
          const students = await getEnrolledStudents(c.id)
          return Array.isArray(students)
            ? students.filter((s: any) => s.status === 'active' || s.status === 'ACTIVE').length
            : 0
        } catch { return 0 }
      })
    )
    const headers = ['Code', 'Name', 'Section', 'Year', 'Semester', 'Credits', 'Lecturer', 'Active Enrolments']
    const rows = courses.map((c: any, i: number) => [
      c.code, c.name || '', c.section || '', c.academic_year || c.year || '',
      c.semester || '', c.credits ?? '', c.lecturer_name || '', enrollmentCounts[i],
    ])
    downloadCsv(`course_summary_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 4: Audit Log (last 500) ────────────────────────────────────────
  async function exportAuditLog() {
    const res = await getAuditLogs({ limit: 500, offset: 0 })
    const headers = ['Timestamp', 'Action', 'Actor Email', 'Actor Name', 'Entity Type', 'Entity ID', 'IP Address']
    const rows = (res.logs || []).map((l: any) => [
      l.created_at || '', l.action || '', l.actor_email || '',
      l.actor_name || '', l.entity_type || '', l.entity_id || '', l.ip_address || '',
    ])
    downloadCsv(`audit_log_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 5: Flagged Marks ───────────────────────────────────────────────
  async function exportFlaggedMarks() {
    const res = await getFlaggedMarks()
    const headers = ['Mark ID', 'Student Email', 'Student Name', 'Course Code', 'Assessment Name', 'Raw Score', 'Max Score', 'Flag Note', 'Modified At']
    const rows = (res.flagged_marks || []).map((m: any) => [
      m.id || '', m.student_email || '', m.student_name || '',
      m.course_code || '', m.assessment_name || '',
      m.raw_score ?? '', m.max_score ?? '', m.flag_note || '', m.updated_at || '',
    ])
    downloadCsv(`flagged_marks_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  const items: ExportItem[] = [
    {
      key: 'students',
      title: 'Student List',
      description: 'All registered students with email, matric number, and approval status.',
      icon: GraduationCap, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]',
      fn: exportStudents,
    },
    {
      key: 'lecturers',
      title: 'Faculty Directory',
      description: 'All lecturers, coordinators, and HODs with special roles and teaching credit limits.',
      icon: Users, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]',
      fn: exportLecturers,
    },
    {
      key: 'courses',
      title: 'Course Summary',
      description: 'All courses with assigned lecturer and live active enrolment count.',
      icon: BookOpen, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]',
      fn: exportCourseSummary,
    },
    {
      key: 'flagged',
      title: 'Flagged Marks',
      description: 'All currently flagged marks with student, course, score, and flag note.',
      icon: Flag, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]',
      fn: exportFlaggedMarks,
    },
    {
      key: 'audit',
      title: 'Audit Log (last 500)',
      description: 'Recent system activity — actions, actors, entities, and IP addresses.',
      icon: FileText, color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]',
      fn: exportAuditLog,
    },
  ]

  async function handleExport(item: ExportItem) {
    setBusy(item.key)
    try {
      const { rows } = await item.fn()
      setLastExported(p => ({ ...p, [item.key]: { time: new Date().toLocaleTimeString(), rows } }))
      addToast(`Exported ${rows} rows — ${item.title}`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || `Failed to export ${item.title}`, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <MainLayout>
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="pt-2">
        <h1 className="text-[32px] font-bold text-[#111827]">Export Data</h1>
        <p className="text-[16px] text-[#6B7280] mt-1">Download CSV reports for record-keeping and compliance</p>
      </div>

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
                  <h3 className="font-semibold text-[#111827] text-[15px]">{item.title}</h3>
                  <p className="text-[13px] text-[#6B7280] mt-1">{item.description}</p>
                  {last && (
                    <p className="text-[11px] text-[#10B981] mt-1.5">
                      Last exported at {last.time} · {last.rows} rows
                    </p>
                  )}
                  <button
                    onClick={() => handleExport(item)}
                    disabled={!!busy}
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
