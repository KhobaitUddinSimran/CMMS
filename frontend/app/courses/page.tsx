'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { useAuth } from '@/lib/contexts/auth-context'
import { listCourses } from '@/lib/api/courses'
import { Plus, Settings, Users, BookOpen, Search, GraduationCap, Calendar, Award } from 'lucide-react'

interface Course {
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

export default function CoursesPage() {
  const router = useRouter()
  const { addToast } = useToastStore()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await listCourses()
      setCourses(data.data || (data as any))
    } catch (error) {
      addToast('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const userRole = user?.role
  const canCreateCourses = userRole === 'admin' || userRole === 'coordinator'
  const canManageCourses = userRole === 'admin' || userRole === 'coordinator' || userRole === 'lecturer'

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </MainLayout>
    )
  }

  const filtered = courses.filter(c =>
    !search ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.lecturer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const CARD_COLORS = [
    'from-red-500 to-rose-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-violet-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Courses</h1>
            <p className="text-[#6B7280] mt-1 text-sm">
              {userRole === 'student' ? 'Your enrolled courses' : `${courses.length} course${courses.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031] focus:border-transparent bg-white"
              />
            </div>
            {canCreateCourses && (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => router.push('/courses/create')}
              >
                New Course
              </Button>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#C90031]" />
              </div>
              <p className="text-[#111827] font-semibold text-lg">No courses yet</p>
              <p className="text-[#6B7280] text-sm mt-1">Get started by creating your first course</p>
              {canCreateCourses && (
                <Button
                  variant="primary"
                  className="mt-5"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => router.push('/courses/create')}
                >
                  Create First Course
                </Button>
              )}
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[#6B7280]">No courses match &ldquo;{search}&rdquo;</p>
              <button onClick={() => setSearch('')} className="text-sm text-[#C90031] mt-2 hover:underline">Clear search</button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course, idx) => (
              <div
                key={course.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group"
                onClick={() => router.push(`/courses/${course.id}`)}
              >
                {/* Colour header */}
                <div className={`bg-gradient-to-r ${CARD_COLORS[idx % CARD_COLORS.length]} p-5`}>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{course.code}</p>
                  <h3 className="text-white font-bold text-base mt-1 leading-snug">
                    {course.name || `${course.code} – Sec ${course.section}`}
                  </h3>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  {course.semester && (
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Sem {course.semester}{course.year ? ` · ${course.year}` : ''}</span>
                    </div>
                  )}
                  {course.credits && (
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <Award className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{course.credits} Credits</span>
                    </div>
                  )}
                  {course.lecturer_name && (
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{course.lecturer_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canManageCourses && (
                  <div className="px-4 pb-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Users className="w-3.5 h-3.5" />}
                      onClick={() => router.push(`/courses/${course.id}/manage`)}
                      className="flex-1 text-xs"
                    >
                      Roster
                    </Button>
                    {(userRole === 'admin' || userRole === 'coordinator') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Settings className="w-3.5 h-3.5" />}
                        onClick={() => router.push(`/courses/${course.id}/edit`)}
                        className="flex-1 text-xs"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
