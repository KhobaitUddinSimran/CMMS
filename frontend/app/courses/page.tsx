'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses } from '@/lib/api/courses'
import { Plus, Settings, Users, BookOpen } from 'lucide-react'

interface Course {
  id: string
  code: string
  section: string
  year: string
  semester: string
  lecturer_id?: string
  lecturer_name?: string
}

export default function CoursesPage() {
  const router = useRouter()
  const { addToast } = useToastStore()

  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [userRole, setUserRole] = useState<'student' | 'lecturer' | 'admin' | null>(null)

  useEffect(() => {
    loadCourses()
    // Get user role from localStorage or auth context
    const role = localStorage.getItem('userRole') as any
    setUserRole(role)
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await listCourses()
      setCourses(data.data || data)
    } catch (error) {
      addToast('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const canCreateCourses = userRole === 'admin' || userRole === 'lecturer'

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
          <Card className="bg-gray-50 text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No courses available</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (userRole === 'student') {
                    router.push(`/courses/${course.id}`)
                  }
                }}
              >
                {/* Header */}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-semibold text-blue-600">{course.code}</p>
                  <h3 className="font-semibold text-gray-900 mt-1">
                    {course.code}-{course.section}
                  </h3>
                </div>

                {/* Details */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Year:</span>
                    <span className="font-medium text-gray-900">{course.year}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Semester:</span>
                    <span className="font-medium text-gray-900">{course.semester}</span>
                  </div>
                  {course.lecturer_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Lecturer:</span>
                      <span className="font-medium text-gray-900">{course.lecturer_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(userRole === 'admin' || userRole === 'lecturer') && (
                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Users className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/courses/${course.id}/manage`)
                      }}
                      className="flex-1"
                    >
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Settings className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/courses/${course.id}/edit`)
                      }}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
