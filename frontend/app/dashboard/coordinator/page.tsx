'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { listCourses, listLecturers } from '@/lib/api/courses'
import {
  BookOpen, Users, Plus, Upload, ClipboardList,
  BarChart3, ChevronRight, Settings
} from 'lucide-react'

interface CourseItem {
  id: string
  code: string
  name?: string
  section: string
  year: string
  semester: string
  credits?: number
  lecturer_id?: string
  lecturer_name?: string
}

export default function CoordinatorDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [totalCourses, setTotalCourses] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [data, staffList] = await Promise.allSettled([
        listCourses({ limit: 500 }),
        listLecturers(),
      ])

      // Build id → name map from teaching staff
      const nameMap: Record<string, string> = {}
      if (staffList.status === 'fulfilled') {
        for (const s of staffList.value) {
          if (s.id) nameMap[s.id] = s.full_name || s.email || s.id
        }
      }

      if (data.status === 'fulfilled') {
        const raw = data.value.data || (data.value as any)
        const list: CourseItem[] = raw.map((c: any) => ({
          ...c,
          lecturer_name: c.lecturer_name || (c.lecturer_id ? nameMap[c.lecturer_id] : undefined),
        }))
        setCourses(list)
        setTotalCourses(data.value.total ?? list.length)
      } else {
        setCourses([])
      }
    } finally {
      setLoading(false)
    }
  }

  const recentCourses = courses.slice(0, 5)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          Welcome, {user?.name ?? user?.full_name}!
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Coordinate courses and manage academic schedules
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Courses</p>
              {loading ? (
                <div className="mt-3"><Spinner /></div>
              ) : (
                <p className="text-[32px] font-bold text-[#111827] mt-2">{totalCourses}</p>
              )}
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Lecturers Assigned</p>
              {loading ? (
                <div className="mt-3"><Spinner /></div>
              ) : (
                <p className="text-[32px] font-bold text-[#111827] mt-2">
                  {courses.filter((c) => c.lecturer_name).length}
                </p>
              )}
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Courses Unassigned</p>
              {loading ? (
                <div className="mt-3"><Spinner /></div>
              ) : (
                <p className="text-[32px] font-bold text-[#111827] mt-2">
                  {courses.filter((c) => !c.lecturer_name).length}
                </p>
              )}
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Create Course', icon: Plus, color: 'bg-[#C90031]', href: '/courses/create' },
          { label: 'Upload Roster', icon: Upload, color: 'bg-[#2563EB]', href: '/roster' },
          { label: 'Assessment Config', icon: ClipboardList, color: 'bg-[#7C3AED]', href: '/assessment-config' },
          { label: 'View Reports', icon: BarChart3, color: 'bg-[#059669]', href: '/reports' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="flex items-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-xl hover:shadow-md transition-all text-left"
          >
            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-[14px] font-semibold text-[#111827]">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Course List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#111827]">Courses</h2>
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center gap-1 text-[14px] font-medium text-[#C90031] hover:text-[#A80028] transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentCourses.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-[#6B7280] font-medium">No courses yet</p>
            <button
              onClick={() => router.push('/courses/create')}
              className="mt-3 px-4 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] transition-colors"
            >
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
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Section</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Year / Sem</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Lecturer</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#C90031]">{course.code}</td>
                    <td className="py-3 px-4 text-[#111827]">
                      {course.name || `${course.code} Sec ${course.section}`}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">{course.section}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{course.year} / {course.semester}</td>
                    <td className="py-3 px-4">
                      {course.lecturer_name ? (
                        <span className="text-[#111827]">{course.lecturer_name}</span>
                      ) : (
                        <span className="text-[#F59E0B] text-xs font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/courses/${course.id}/manage`)}
                          className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50 rounded transition-colors"
                          title="Manage Roster"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/courses/${course.id}/edit`)}
                          className="p-1.5 text-[#6B7280] hover:text-[#C90031] hover:bg-red-50 rounded transition-colors"
                          title="Edit Course"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
