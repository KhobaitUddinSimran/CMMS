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
import { Plus, Settings, Users, BookOpen } from 'lucide-react'

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-2">
              {userRole === 'student' ? 'View your enrolled courses' : 'Manage course offerings'}
            </p>
          </div>
          {canCreateCourses && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/courses/create')}
            >
              Create Course
            </Button>
          )}
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No courses available</p>
              {canCreateCourses && (
                <Button
                  variant="primary"
                  className="mt-4"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => router.push('/courses/create')}
                >
                  Create First Course
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="pb-4 border-b border-[#E5E7EB]">
                  <p className="text-sm font-semibold text-[#C90031]">{course.code}</p>
                  <h3 className="font-semibold text-[#111827] mt-1">
                    {course.name || `${course.code} – Sec ${course.section}`}
                  </h3>
                </div>

                {/* Details */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Section</span>
                    <span className="font-medium text-[#111827]">{course.section}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Year</span>
                    <span className="font-medium text-[#111827]">{course.year}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Semester</span>
                    <span className="font-medium text-[#111827]">{course.semester}</span>
                  </div>
                  {course.credits && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Credits</span>
                      <span className="font-medium text-[#111827]">{course.credits}</span>
                    </div>
                  )}
                  {course.lecturer_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Lecturer</span>
                      <span className="font-medium text-[#111827] truncate max-w-[140px]">{course.lecturer_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canManageCourses && (
                  <div className="pt-4 border-t border-[#E5E7EB] flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Users className="w-4 h-4" />}
                      onClick={() => router.push(`/courses/${course.id}/manage`)}
                      className="flex-1"
                    >
                      Roster
                    </Button>
                    {(userRole === 'admin' || userRole === 'coordinator') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Settings className="w-4 h-4" />}
                        onClick={() => router.push(`/courses/${course.id}/edit`)}
                        className="flex-1"
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
