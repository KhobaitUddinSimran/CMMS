'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { CourseForm, type CourseFormData } from '@/components/course/CourseForm'
import { LecturerSelector } from '@/components/course/LecturerSelector'
import { useToastStore } from '@/stores/toastStore'
import { getCourse, updateCourse, listLecturers, assignLecturer } from '@/lib/api/courses'
import { ArrowLeft, CheckCircle, UserCheck } from 'lucide-react'

interface CourseData extends Partial<CourseFormData> {
  id: string
  code: string
  section: string
  year: string
  semester: string
  lecturer_id?: string
}

interface Lecturer {
  id: string
  email: string
  full_name: string
}

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToastStore()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseData | null>(null)
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [selectedLecturer, setSelectedLecturer] = useState<string>('')
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [courseRes, lecturersRes] = await Promise.allSettled([
        getCourse(courseId),
        listLecturers(),
      ])

      if (courseRes.status === 'rejected') {
        addToast('Failed to load course data', 'error')
        router.push('/courses')
        return
      }

      const courseData = courseRes.value
      setCourse(courseData)
      setSelectedLecturer(courseData.lecturer_id || '')

      if (lecturersRes.status === 'fulfilled') {
        setLecturers(lecturersRes.value)
      } else {
        addToast('Could not load lecturer list', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCourse = async (data: CourseFormData) => {
    setLoadingUpdate(true)
    try {
      await updateCourse(courseId, data)
      addToast('Course updated successfully', 'success')
      
      // Refresh course data
      const updated = await getCourse(courseId)
      setCourse(updated)
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to update course',
        'error'
      )
      throw error
    } finally {
      setLoadingUpdate(false)
    }
  }

  const handleAssignLecturer = async () => {
    if (!selectedLecturer) {
      addToast('Please select a lecturer', 'error')
      return
    }

    setLoadingUpdate(true)
    try {
      await assignLecturer(courseId, selectedLecturer)
      addToast('Lecturer assigned successfully', 'success')
      
      // Refresh course data
      const updated = await getCourse(courseId)
      setCourse(updated)
      setAssignSuccess(true)
      setTimeout(() => setAssignSuccess(false), 4000)
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to assign lecturer',
        'error'
      )
    } finally {
      setLoadingUpdate(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </MainLayout>
    )
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Course not found</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600 mt-2">
              Update course details and assign lecturer
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Form */}
          <div className="lg:col-span-2">
            <Card>
              <CourseForm
                onSubmit={handleUpdateCourse}
                loading={loadingUpdate}
                initialData={course}
              />
            </Card>
          </div>

          {/* Sidebar - Lecturer Assignment */}
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Assign Lecturer</h3>

                {/* Currently assigned banner */}
                {course.lecturer_id && (() => {
                  const assigned = lecturers.find(l => l.id === course.lecturer_id)
                  return assigned ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-green-700 font-medium">Currently assigned</p>
                        <p className="text-sm font-semibold text-green-900 truncate">{assigned.full_name || assigned.email}</p>
                      </div>
                    </div>
                  ) : null
                })()}

                <LecturerSelector
                  value={selectedLecturer}
                  onChange={(val) => { setSelectedLecturer(val); setAssignSuccess(false) }}
                  lecturers={lecturers}
                  loading={loadingUpdate}
                />

                <Button
                  onClick={handleAssignLecturer}
                  loading={loadingUpdate}
                  variant="primary"
                  className="w-full"
                >
                  {assignSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Assigned!
                    </span>
                  ) : 'Save Assignment'}
                </Button>

                {assignSuccess && (() => {
                  const justAssigned = lecturers.find(l => l.id === selectedLecturer)
                  return justAssigned ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg animate-pulse">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">{justAssigned.full_name || justAssigned.email}</span> assigned successfully
                      </p>
                    </div>
                  ) : null
                })()}
              </div>
            </Card>

            {/* Info Box */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Course Info</p>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>
                    <strong>Code:</strong> {course.code}
                  </p>
                  <p>
                    <strong>Section:</strong> {course.section}
                  </p>
                  <p>
                    <strong>Year:</strong> {course.year}
                  </p>
                  <p>
                    <strong>Semester:</strong> {course.semester}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
