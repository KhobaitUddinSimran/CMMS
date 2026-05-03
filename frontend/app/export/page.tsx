'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Users, BookOpen, FileText, GraduationCap } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { getAllUsers, listLecturers, getAuditLogs } from '@/lib/api/admin'
import { listCourses } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
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
  const router = useRouter()
  const { addToast } = useToastStore()
  const [busy, setBusy] = useState<string | null>(null)

  // ── Export 1: All Students ────────────────────────────────────────────────
  async function exportStudents() {
    const res = await getAllUsers({ role: 'student' })
    const headers = ['ID', 'Email', 'Full Name', 'Matric Number', 'Approval Status', 'Active', 'Created At']
    const rows = (res.users || []).map((u: any) => [
      u.id,
      u.email,
      u.full_name,
      u.matric_number || '',
      u.approval_status || '',
      u.is_active ? 'Yes' : 'No',
      u.created_at || '',
    ])
    downloadCsv(`students_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 2: All Lecturers + Special Roles ───────────────────────────────
  async function exportLecturers() {
    const res = await listLecturers()
    const headers = ['ID', 'Email', 'Full Name', 'Base Role', 'Special Roles', 'Active']
    const rows = (res.lecturers || []).map((l: any) => [
      l.id,
      l.email,
      l.full_name,
      l.role,
      (l.special_roles || []).join('; '),
      l.is_active ? 'Yes' : 'No',
    ])
    downloadCsv(`lecturers_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 3: Course Summary (with enrolled count) ────────────────────────
  async function exportCourseSummary() {
    const res = await listCourses({ limit: 500 })
    const courses = res.data || (res as any) || []
    // Fetch enrollments in parallel
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
      c.code,
      c.name || '',
      c.section || '',
      c.academic_year || c.year || '',
      c.semester || '',
      c.credits ?? '',
      c.lecturer_name || '',
      enrollmentCounts[i],
    ])
    downloadCsv(`course_summary_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  // ── Export 4: Audit Log (last 500) ────────────────────────────────────────
  async function exportAuditLog() {
    const res = await getAuditLogs({ limit: 500, offset: 0 })
    const headers = ['Timestamp', 'Action', 'Actor Email', 'Actor Name', 'Entity Type', 'Entity ID', 'IP Address']
    const rows = (res.logs || []).map((l: any) => [
      l.created_at || '',
      l.action || '',
      l.actor_email || '',
      l.actor_name || '',
      l.entity_type || '',
      l.entity_id || '',
      l.ip_address || '',
    ])
    downloadCsv(`audit_log_${dateStamp()}.csv`, headers, rows)
    return { rows: rows.length }
  }

  const items: ExportItem[] = [
    {
      key: 'students',
      title: 'Student Roster',
      description: 'All registered students with email, matric number, approval status',
      icon: GraduationCap,
      color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]',
      fn: exportStudents,
    },
    {
      key: 'lecturers',
      title: 'Faculty Directory',
      description: 'All lecturers, coordinators, and HODs with their special roles',
      icon: Users,
      color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]',
      fn: exportLecturers,
    },
    {
      key: 'courses',
      title: 'Course Summary',
      description: 'All courses with assigned lecturer and active enrolment count',
      icon: BookOpen,
      color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]',
      fn: exportCourseSummary,
    },
    {
      key: 'audit',
      title: 'Audit Log (last 500)',
      description: 'Recent system activity for compliance and review',
      icon: FileText,
      color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]',
      fn: exportAuditLog,
    },
  ]

  async function handleExport(item: ExportItem) {
    setBusy(item.key)
    try {
      const { rows } = await item.fn()
      addToast(`Exported ${rows} rows to ${item.title}`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || `Failed to export ${item.title}`, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Export Data</h1>
          <p className="text-[#6B7280] mt-1">Download CSV reports for record-keeping and compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {items.map((item) => {
          const Icon = item.icon
          const isBusy = busy === item.key
          return (
            <Card key={item.key} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#111827] text-[15px]">{item.title}</h3>
                  <p className="text-[13px] text-[#6B7280] mt-1">{item.description}</p>
                  <button
                    onClick={() => handleExport(item)}
                    disabled={isBusy}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  )
}
