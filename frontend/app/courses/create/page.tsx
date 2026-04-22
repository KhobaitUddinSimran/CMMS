'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { CourseForm, type CourseFormData } from '@/components/course/CourseForm'
import { useToastStore } from '@/stores/toastStore'
import { createCourse } from '@/lib/api/courses'
import { ArrowLeft } from 'lucide-react'

export default function CreateCoursePage() {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)

  const handleCreateCourse = async (data: CourseFormData) => {
    setLoading(true)
    try {
      const result = await createCourse(data)
      addToast('Course created successfully', 'success')
      
      // Navigate to the course management page
      router.push(`/courses/${result.id}/manage`)
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
            <p className="text-gray-600 mt-2">
              Fill in the course details to create a new course offering
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="max-w-2xl">
          <CourseForm onSubmit={handleCreateCourse} loading={loading} />
        </Card>
      </div>
    </MainLayout>
  )
}
