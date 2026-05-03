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
  ChevronRight, ArrowRight, Plus, BarChart3, Settings,
  TrendingUp, AlertCircle, Download, Shield, Mail
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
  const [allCourses, setAllCourses] = useState<CourseItem[]>([])
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
      setAllCourses(list)

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
                <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Courses Teaching</p>
                {loading ? <div className="mt-3"><Spinner /></div>
                  : <p className="text-[32px] font-bold text-[#111827] mt-2">{myCourses.length}</p>}
              </div>
              <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-[#C90031]" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Students Enrolled</p>
                {loading ? <div className="mt-3"><Spinner /></div>
                  : <p className="text-[32px] font-bold text-[#111827] mt-2">{totalStudents ?? '—'}</p>}
              </div>
              <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-[#10B981]" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Assessments Set Up</p>
                {loading ? <div className="mt-3"><Spinner /></div>
                  : <p className="text-[32px] font-bold text-[#111827] mt-2">—</p>}
              </div>
              <div className="w-14 h-14 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-7 h-7 text-[#3B82F6]" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Smart Grid', desc: 'Enter & manage marks', icon: Grid3x3, color: 'bg-[#C90031]', href: '/smart-grid' },
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
                      Smart Grid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ── SECTION 2: COORDINATOR (conditional) ── */}
      {isCoordinator && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-purple-600 rounded-full" />
            <h2 className="text-[18px] font-bold text-[#111827]">Coordinator — Course Management</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Coordinator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Courses</p>
                  {loading ? <div className="mt-3"><Spinner /></div>
                    : <p className="text-[32px] font-bold text-[#111827] mt-2">{allCourses.length}</p>}
                </div>
                <div className="w-14 h-14 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Lecturers Assigned</p>
                  {loading ? <div className="mt-3"><Spinner /></div>
                    : <p className="text-[32px] font-bold text-[#111827] mt-2">{allCourses.filter((c) => c.lecturer_id).length}</p>}
                </div>
                <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-[#10B981]" />
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Unassigned</p>
                  {loading ? <div className="mt-3"><Spinner /></div>
                    : <p className="text-[32px] font-bold text-[#111827] mt-2">{allCourses.filter((c) => !c.lecturer_id).length}</p>}
                </div>
                <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 text-[#F59E0B]" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Create Course', icon: Plus, color: 'bg-[#C90031]', href: '/courses/create' },
              { label: 'Roster Management', icon: Upload, color: 'bg-[#2563EB]', href: '/roster' },
              { label: 'Assessment Config', icon: ClipboardList, color: 'bg-purple-600', href: '/assessment-config' },
              { label: 'View Reports', icon: BarChart3, color: 'bg-[#059669]', href: '/reports' },
            ].map((a) => (
              <button key={a.label} onClick={() => router.push(a.href)}
                className="flex items-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-xl hover:shadow-md transition-all text-left">
                <div className={`w-10 h-10 ${a.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{a.label}</span>
              </button>
            ))}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#111827]">All Courses</h3>
              <button onClick={() => router.push('/courses')}
                className="flex items-center gap-1 text-[14px] font-medium text-purple-600 hover:text-purple-800 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : allCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <p className="text-[#6B7280] font-medium">No courses yet</p>
                <button onClick={() => router.push('/courses/create')}
                  className="mt-3 px-4 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] transition-colors">
                  Create First Course
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Year / Sem</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Lecturer</th>
                      <th className="text-right py-3 px-4 font-semibold text-[#6B7280]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.slice(0, 6).map((course) => (
                      <tr key={course.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#C90031]">{course.code}</td>
                        <td className="py-3 px-4 text-[#111827]">{course.name || course.code}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{course.academic_year || course.year} / {course.semester}</td>
                        <td className="py-3 px-4">
                          {course.lecturer_name
                            ? <span className="text-[#111827]">{course.lecturer_name}</span>
                            : <span className="text-[#F59E0B] text-xs font-medium">Unassigned</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => router.push(`/courses/${course.id}/edit`)}
                            className="p-1.5 text-[#6B7280] hover:text-[#C90031] hover:bg-red-50 rounded transition-colors">
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* ── SECTION 3: HOD (conditional) ── */}
      {isHOD && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-[#C90031] rounded-full" />
            <h2 className="text-[18px] font-bold text-[#111827]">HOD — Department Oversight</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-[#C90031]">HOD</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              { label: 'Total Students', value: '—', icon: Users, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]' },
              { label: 'Avg Performance', value: '—', icon: TrendingUp, bg: 'bg-[#ECFDF5]', color: 'text-[#10B981]' },
              { label: 'Active Courses', value: String(allCourses.length || '—'), icon: BookOpen, bg: 'bg-[#EFF6FF]', color: 'text-[#3B82F6]' },
              { label: 'Critical Issues', value: '—', icon: AlertCircle, bg: 'bg-[#FEF3C7]', color: 'text-[#F59E0B]' },
            ].map((s) => (
              <Card key={s.label} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                    {loading ? <div className="mt-3"><Spinner /></div>
                      : <p className="text-[32px] font-bold text-[#111827] mt-2">{s.value}</p>}
                  </div>
                  <div className={`w-14 h-14 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`w-7 h-7 ${s.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Analytics', icon: BarChart3, color: 'bg-[#7C3AED]', href: '/analytics' },
              { label: 'Export Data', icon: Download, color: 'bg-[#059669]', href: '/export' },
              { label: 'Audit Log', icon: ClipboardList, color: 'bg-[#C90031]', href: '/audit-log' },
            ].map((a) => (
              <button key={a.label} onClick={() => router.push(a.href)}
                className="flex items-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-xl hover:shadow-md transition-all text-left">
                <div className={`w-10 h-10 ${a.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{a.label}</span>
              </button>
            ))}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#111827]">Department Overview</h3>
            </div>
            <div className="space-y-3">
              {[
                { metric: 'Faculty Members', value: '—' },
                { metric: 'Active Courses', value: String(allCourses.length || '—') },
                { metric: 'Courses with Unassigned Lecturers', value: String(allCourses.filter((c) => !c.lecturer_id).length) },
                { metric: 'Student Queries', value: '—' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                  <span className="text-[#111827] text-[14px]">{item.metric}</span>
                  <span className="text-[14px] font-semibold text-[#111827]">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}
