'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { CourseForm, type CourseFormData } from '@/components/course/CourseForm'
import { useToastStore } from '@/stores/toastStore'
import { createCourse, type CourseData } from '@/lib/api/courses'
import { ArrowLeft, CheckCircle, BookOpen, ArrowRight } from 'lucide-react'

export default function CreateCoursePage() {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [createdCourse, setCreatedCourse] = useState<CourseData | null>(null)

  const handleCreateCourse = async (data: CourseFormData) => {
    setLoading(true)
    try {
      const result = await createCourse(data)
      addToast('Course created successfully', 'success')
      setCreatedCourse(result)
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to create course',
        'error'
      )
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-8 px-4">
        {/* Header */}
        <div className="w-full max-w-2xl mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Fill in the course details to create a new course offering
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {createdCourse ? (
          <Card className="w-full max-w-2xl">
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Course Created!</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Your course has been created successfully.
                </p>
              </div>

              {/* Course summary */}
              <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-left mt-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#C90031]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827] text-sm">{createdCourse.name ?? createdCourse.code}</p>
                    <p className="text-xs text-[#6B7280]">{createdCourse.code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {createdCourse.academic_year && (
                    <div>
                      <p className="text-[#6B7280]">Academic Year</p>
                      <p className="font-medium text-[#111827]">{createdCourse.academic_year}</p>
                    </div>
                  )}
                  {createdCourse.semester && (
                    <div>
                      <p className="text-[#6B7280]">Semester</p>
                      <p className="font-medium text-[#111827]">{createdCourse.semester}</p>
                    </div>
                  )}
                  {createdCourse.credits && (
                    <div>
                      <p className="text-[#6B7280]">Credits</p>
                      <p className="font-medium text-[#111827]">{createdCourse.credits}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => router.push('/courses')}
                  className="flex-1 h-10 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-gray-50 transition-colors"
                >
                  Back to Courses
                </button>
                <button
                  onClick={() => router.push(`/courses/${createdCourse.id}/edit`)}
                  className="flex-1 h-10 bg-[#C90031] hover:bg-[#a8002a] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Manage Course
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setCreatedCourse(null)}
                className="text-xs text-[#6B7280] hover:text-[#374151] underline"
              >
                Create another course
              </button>
            </div>
          </Card>
        ) : (
          /* Form Card */
          <Card className="w-full max-w-2xl">
            <CourseForm onSubmit={handleCreateCourse} loading={loading} />
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
