'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { StudentRoster, type EnrolledStudent } from '@/components/course/StudentRoster'
import { useToastStore } from '@/stores/toastStore'
import { getCourse } from '@/lib/api/courses'
import { getEnrolledStudents, addStudent, dropStudent } from '@/lib/api/enrollments'
import { ArrowLeft, Settings } from 'lucide-react'

interface CourseData {
  id: string
  code: string
  section: string
  year: string
  semester: string
  lecturer_id?: string
  lecturer_name?: string
}

export default function ManageCoursePage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToastStore()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseData | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      const [courseData, studentsData] = await Promise.all([
        getCourse(courseId),
        getEnrolledStudents(courseId),
      ])
      setCourse(courseData)
      setStudents(studentsData)
    } catch (error) {
      addToast('Failed to load course data', 'error')
      router.push('/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (email: string) => {
    try {
      const result = await addStudent(courseId, email)
      setStudents([...students, result])
      addToast('Student added successfully', 'success')
    } catch (error) {
      throw error
    }
  }

  const handleDropStudent = async (studentId: string) => {
    try {
      await dropStudent(courseId, studentId)
      setStudents(
        students.map((s) => (s.id === studentId ? { ...s, status: 'dropped' } : s))
      )
      addToast('Student dropped successfully', 'success')
    } catch (error) {
      throw error
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {course.code}-{course.section} ({course.year}, Sem {course.semester})
              </h1>
              {course.lecturer_name && (
                <p className="text-gray-600 mt-1">Lecturer: {course.lecturer_name}</p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            icon={<Settings className="w-4 h-4" />}
            onClick={() => router.push(`/courses/${courseId}/edit`)}
          >
            Edit Course
          </Button>
        </div>

        {/* Student Roster */}
        <Card>
          <StudentRoster
            courseId={courseId}
            students={students}
            onAddStudent={handleAddStudent}
            onDropStudent={handleDropStudent}
          />
        </Card>
      </div>
    </MainLayout>
  )
}
