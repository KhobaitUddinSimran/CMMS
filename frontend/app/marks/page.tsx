'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { listCourses } from '@/lib/api/courses'
import { getStudentMarksSummary, type StudentCourseSummary } from '@/lib/api/marks'
import { BookOpen, CheckCircle, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'

interface CourseInfo { id: string; code: string; name?: string; section: string }

function statusLabel(pct: number) {
  if (pct >= 80) return { text: 'Excellent', cls: 'bg-green-100 text-green-700' }
  if (pct >= 70) return { text: 'Good', cls: 'bg-blue-100 text-blue-700' }
  if (pct >= 60) return { text: 'Pass', cls: 'bg-amber-100 text-amber-700' }
  return { text: 'At Risk', cls: 'bg-red-100 text-red-700' }
}

export default function MarksPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<StudentCourseSummary[]>([])
  const [courseMap, setCourseMap] = useState<Record<string, CourseInfo>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [summaryData, coursesRes] = await Promise.all([
          getStudentMarksSummary(user.id),
          listCourses({ limit: 500 }),
        ])
        setSummary(summaryData)

        const courseList: CourseInfo[] = coursesRes.data || (coursesRes as any)
        const map: Record<string, CourseInfo> = {}
        for (const c of courseList) map[c.id] = c
        setCourseMap(map)
      } catch {
        setSummary([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const toggleExpand = (courseId: string) =>
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }))

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">My Carry Marks</h1>
        <p className="text-[#6B7280] mt-1">Published assessment scores and carry totals per course</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Courses with Marks</p>
              <p className="text-3xl font-bold text-[#111827] mt-2">
                {loading ? <Spinner /> : summary.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Passing Courses</p>
              <p className="text-3xl font-bold text-[#111827] mt-2">
                {loading ? <Spinner /> : `${summary.filter((s) => s.carry_total >= 60).length}/${summary.length}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#3B82F6]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
      )}

      {/* No marks yet */}
      {!loading && summary.length === 0 && (
        <Card>
          <div className="text-center py-14">
            <AlertCircle className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <p className="font-semibold text-[#6B7280]">No published marks yet</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Your marks will appear here once your lecturer publishes them</p>
          </div>
        </Card>
      )}

      {/* Per-course breakdown */}
      {!loading && summary.length > 0 && (
        <div className="space-y-4">
          {summary.map((course) => {
            const info = courseMap[course.course_id]
            const { text, cls } = statusLabel(course.carry_total)
            const isOpen = expanded[course.course_id]

            return (
              <Card key={course.course_id} className="!p-0 overflow-hidden">
                {/* Course header row */}
                <button
                  onClick={() => toggleExpand(course.course_id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[#C90031]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827]">
                        {info ? `${info.code}${info.section ? ` – Sec ${info.section}` : ''}` : course.course_id}
                      </p>
                      {info?.name && <p className="text-xs text-[#6B7280]">{info.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#111827]">{course.carry_total.toFixed(1)}%</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
                    </div>
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                      : <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />}
                  </div>
                </button>

                {/* Expanded: per-assessment breakdown */}
                {isOpen && (
                  <div className="border-t border-[#E5E7EB]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F9FAFB] text-[#6B7280] text-xs">
                          <th className="text-left px-5 py-2 font-medium">Assessment</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-right px-4 py-2 font-medium">Score</th>
                          <th className="text-right px-4 py-2 font-medium">Weight</th>
                          <th className="text-right px-5 py-2 font-medium">Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {course.marks.map((m, i) => (
                          <tr key={i} className="border-t border-[#E5E7EB] hover:bg-[#F9FAFB]">
                            <td className="px-5 py-3 font-medium text-[#111827]">{m.assessment_name}</td>
                            <td className="px-4 py-3 text-[#6B7280] capitalize">{m.assessment_type || '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                              {m.score}/{m.max_score}
                            </td>
                            <td className="px-4 py-3 text-right text-[#6B7280]">{m.weight_percentage}%</td>
                            <td className="px-5 py-3 text-right font-semibold text-[#C90031]">
                              +{m.weighted_contribution.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F9FAFB] border-t-2 border-[#E5E7EB]">
                          <td colSpan={4} className="px-5 py-3 font-semibold text-[#374151]">Carry Total</td>
                          <td className="px-5 py-3 text-right font-bold text-[#111827] text-base">
                            {course.carry_total.toFixed(2)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
