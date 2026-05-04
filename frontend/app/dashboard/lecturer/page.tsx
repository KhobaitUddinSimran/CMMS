'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { listCourses } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { listMessages } from '@/lib/api/messages'
import {
  BookOpen, Users, Grid3x3, ClipboardList, Upload,
  ChevronRight, ArrowRight,
  Shield, Mail
} from 'lucide-react'

interface CourseItem {
  id: string
  code: string
  name?: string
  section?: string
  year?: string
  academic_year?: string
  semester?: string | number
  lecturer_id?: string
  lecturer_name?: string
  student_count?: number
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  coordinator: { label: 'Coordinator', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  hod:         { label: 'HOD',         color: 'bg-red-100 text-[#C90031] border-red-200' },
  lecturer:    { label: 'Lecturer',    color: 'bg-blue-100 text-blue-800 border-blue-200' },
}

export default function LecturerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const specialRoles: string[] = user?.special_roles || []
  const isCoordinator = specialRoles.includes('coordinator')
  const isHOD = specialRoles.includes('hod')

  const [loading, setLoading] = useState(true)
  const [myCourses, setMyCourses] = useState<CourseItem[]>([])
  const [totalStudents, setTotalStudents] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      listMessages().then(d => setUnreadCount((d as any).unread_count || 0)).catch(() => {})
      const data = await listCourses({ limit: 500 })
      const list: CourseItem[] = data.data || (data as any)
      // Backend already scopes GET /courses to the current lecturer's assigned
      // courses, so the full list IS their courses.
      setMyCourses(list)

      if (list.length > 0) {
        let total = 0
        for (const course of list.slice(0, 5)) {
          try {
            const students = await getEnrolledStudents(course.id)
            const active = Array.isArray(students)
              ? students.filter((s: any) => s.status === 'active' || s.status === 'ACTIVE').length
              : 0
            course.student_count = active
            total += active
          } catch {
            course.student_count = 0
          }
        }
        setMyCourses([...list])
        setTotalStudents(total)
      } else {
        setTotalStudents(0)
      }
    } catch {
      setMyCourses([])
      setTotalStudents(0)
    } finally {
      setLoading(false)
    }
  }

  const effectiveRoleLabels = ['lecturer', ...specialRoles]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Unread Messages Banner */}
      {unreadCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-[#FFF0F3] border border-[#FECDD3] rounded-xl cursor-pointer hover:bg-[#FFE4E6] transition-colors"
          onClick={() => router.push('/messages')}
        >
          <Mail className="w-5 h-5 text-[#C90031] shrink-0" />
          <p className="text-[14px] font-medium text-[#C90031]">
            You have <span className="font-bold">{unreadCount}</span> unread {unreadCount === 1 ? 'message' : 'messages'}
          </p>
          <ChevronRight className="w-4 h-4 text-[#C90031] ml-auto" />
        </div>
      )}

      {/* Welcome + Role Badges */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">
            Welcome, {user?.name ?? user?.full_name}!
          </h1>
          <p className="text-[16px] text-[#6B7280] mt-1">
            {isCoordinator && isHOD
              ? 'Manage your courses, coordinate the department, and oversee academics'
              : isCoordinator
              ? 'Manage your courses and coordinate academic activities'
              : isHOD
              ? 'Manage your courses and oversee department performance'
              : 'Manage your courses and enter student carry marks'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {effectiveRoleLabels.map((r) => (
            <span
              key={r}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGE[r]?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              <Shield className="w-3 h-3" />
              {ROLE_BADGE[r]?.label ?? r}
            </span>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: LECTURER ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#C90031] rounded-full" />
          <h2 className="text-[18px] font-bold text-[#111827]">My Teaching</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Courses Teaching</p>
                {loading ? <div className="mt-3"><Spinner /></div>
                  : <p className="text-[28px] font-bold text-[#111827] mt-1.5">{myCourses.length}</p>}
              </div>
              <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-[#C90031]" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Students Enrolled</p>
                {loading ? <div className="mt-3"><Spinner /></div>
                  : <p className="text-[28px] font-bold text-[#111827] mt-1.5">{totalStudents ?? '—'}</p>}
              </div>
              <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-[#10B981]" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Assessments Set Up</p>
                {loading ? <div className="mt-3"><Spinner /></div>
                  : <p className="text-[28px] font-bold text-[#111827] mt-1.5">—</p>}
              </div>
              <div className="w-14 h-14 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-7 h-7 text-[#3B82F6]" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Mark Entry', desc: 'Enter & manage marks', icon: Grid3x3, color: 'bg-[#C90031]', href: '/smart-grid' },
            { label: 'Assessment Setup', desc: 'Configure grading schema', icon: ClipboardList, color: 'bg-[#7C3AED]', href: '/assessment-setup' },
            { label: 'Roster Upload', desc: 'Seed students via Excel', icon: Upload, color: 'bg-[#2563EB]', href: '/roster' },
          ].map((action) => (
            <button key={action.label} onClick={() => router.push(action.href)}
              className="flex items-center gap-4 p-4 bg-white border border-[#E5E7EB] rounded-xl hover:shadow-md transition-all text-left">
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#111827]">{action.label}</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
            </button>
          ))}
        </div>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[17px] font-bold text-[#111827]">My Courses</h3>
            <button onClick={() => router.push('/courses')}
              className="flex items-center gap-1 text-[14px] font-medium text-[#C90031] hover:text-[#A80028] transition-colors">
              All Courses <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : myCourses.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-medium text-[#6B7280]">No courses assigned to you yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[#C90031]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827]">{course.name || course.code}</p>
                      <p className="text-[12px] text-[#6B7280]">
                        {course.code} &nbsp;·&nbsp; {course.academic_year || course.year} Sem {course.semester}
                        {course.student_count !== undefined && ` · ${course.student_count} students`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/roster?course=${course.id}`)}
                      className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-[#BFDBFE] rounded-lg hover:bg-blue-50 transition-colors">
                      Roster
                    </button>
                    <button onClick={() => router.push(`/smart-grid?course=${course.id}`)}
                      className="px-3 py-1.5 text-xs font-medium text-[#C90031] border border-[#FECDD3] rounded-lg hover:bg-red-50 transition-colors">
                      Mark Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>


    </div>
  )
}
