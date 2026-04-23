'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { listCourses } from '@/lib/api/courses'
import { getStudentCarryTotal } from '@/lib/api/marks'
import { BookOpen, TrendingUp, AlertCircle, ChevronRight, FileText } from 'lucide-react'

interface CourseItem {
  id: string
  code: string
  name?: string
  section: string
  year: string
  semester: string
  credits?: number
  lecturer_name?: string
}

interface CarryData {
  carry_total: number
  max_possible: number
  percentage: number
  status: 'pass' | 'at_risk' | 'fail'
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [carry, setCarry] = useState<CarryData | null>(null)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [coursesData] = await Promise.all([
        listCourses({ limit: 500 }),
      ])
      const list: CourseItem[] = coursesData.data || (coursesData as any)
      setCourses(list)

      if (user?.id) {
        try {
          const carryData = await getStudentCarryTotal(user.id)
          setCarry(carryData)
        } catch {
          setCarry(null)
        }
      }
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const carryPct = carry?.percentage ?? null

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          Welcome back, {user?.name ?? user?.full_name}!
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Track your carry marks and academic performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Courses Available</p>
              {loading ? (
                <div className="mt-3"><Spinner /></div>
              ) : (
                <p className="text-[32px] font-bold text-[#111827] mt-2">{courses.length}</p>
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
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Overall Carry</p>
              {loading ? (
                <div className="mt-3"><Spinner /></div>
              ) : (
                <p className="text-[32px] font-bold text-[#111827] mt-2">
                  {carryPct !== null ? `${carryPct.toFixed(1)}%` : '—'}
                </p>
              )}
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Performance</p>
              {loading ? (
                <div className="mt-3"><Spinner /></div>
              ) : (
                <p className={`text-[20px] font-bold mt-2 ${
                  carry?.status === 'pass' ? 'text-[#10B981]' :
                  carry?.status === 'at_risk' ? 'text-[#F59E0B]' :
                  carry?.status === 'fail' ? 'text-[#EF4444]' :
                  'text-[#111827]'
                }`}>
                  {carry?.status === 'pass' ? 'Passing' :
                   carry?.status === 'at_risk' ? 'At Risk' :
                   carry?.status === 'fail' ? 'Below Pass' :
                   'No marks yet'}
                </p>
              )}
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/marks')}
          className="flex items-center gap-4 p-4 bg-white border border-[#E5E7EB] rounded-xl hover:shadow-md transition-all text-left"
        >
          <div className="w-12 h-12 bg-[#C90031] rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#111827]">My Carry Marks</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">View published assessment scores</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
        </button>
        <button
          onClick={() => router.push('/queries')}
          className="flex items-center gap-4 p-4 bg-white border border-[#E5E7EB] rounded-xl hover:shadow-md transition-all text-left"
        >
          <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#111827]">My Queries</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Track mark disputes and questions</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
        </button>
      </div>

      {/* Course List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#111827]">Available Courses</h2>
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center gap-1 text-[14px] font-medium text-[#C90031] hover:text-[#A80028] transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="font-medium text-[#6B7280]">No courses available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left py-4 px-4 font-semibold text-[#6B7280]">Code</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#6B7280]">Course Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#6B7280]">Section</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#6B7280]">Credits</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#6B7280]">Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 10).map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="py-4 px-4 font-mono font-semibold text-[#C90031]">{course.code}</td>
                    <td className="py-4 px-4 text-[#111827]">
                      {course.name || `${course.code} – Sec ${course.section}`}
                    </td>
                    <td className="py-4 px-4 text-[#6B7280]">{course.section}</td>
                    <td className="py-4 px-4 text-[#6B7280]">{course.credits ?? '—'}</td>
                    <td className="py-4 px-4 text-[#6B7280]">{course.lecturer_name ?? '—'}</td>
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
