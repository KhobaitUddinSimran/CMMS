'use client'

import { useState, useCallback, useEffect } from 'react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RosterUpload } from '@/components/roster/RosterUpload'
import { RosterPreview } from '@/components/roster/RosterPreview'
import { RosterConfirmation } from '@/components/roster/RosterConfirmation'
import { Toast } from '@/components/notification/Toast'
import { listCourses } from '@/lib/api/courses'
import { uploadRoster } from '@/lib/api/enrollments'

interface CourseItem {
  id: string
  name: string
  code: string
  year: string
  semester: string
  section: string
  status: string
}

export default function RosterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)
  
  // Upload workflow states
  const [previewData, setPreviewData] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoadingCourses(true)
      const result = await listCourses()
      const mapped = (result.data || []).map((c: any) => ({
        id: c.id,
        name: c.name || c.code,
        code: c.code,
        year: c.year || c.academic_year || '',
        semester: c.semester || '',
        section: c.section || '',
        status: 'Active',
      }))
      setCourses(mapped)

      // Auto-select course from ?course= query param
      const preselect = searchParams.get('course')
      if (preselect && mapped.some((c: CourseItem) => c.id === preselect)) {
        setSelectedCourse(preselect)
        setActiveTab('upload')
      }
    } catch {
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleError = useCallback((error: string) => {
    setErrorMessage(error)
    setShowErrorToast(true)
    setTimeout(() => setShowErrorToast(false), 5000)
  }, [])

  const handleUploadStart = useCallback(() => {
    setShowPreview(false)
    setPreviewData(null)
  }, [])

  const handleUploadComplete = useCallback((data: any, file: File) => {
    setPreviewData(data)
    setUploadedFile(file)
    setShowPreview(true)
  }, [])

  const handleConfirmImport = useCallback(async () => {
    if (!selectedCourse || !uploadedFile) return

    setIsConfirming(true)
    try {
      const result = await uploadRoster(selectedCourse, uploadedFile)
      setConfirmationResult(result)
      setShowConfirmation(true)
      setShowPreview(false)
      setPreviewData(null)
      setUploadedFile(null)
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to confirm import')
    } finally {
      setIsConfirming(false)
    }
  }, [selectedCourse, uploadedFile, handleError])

  const handleConfirmationClose = useCallback(() => {
    setShowConfirmation(false)
    setConfirmationResult(null)
    setActiveTab('list')
    setSelectedCourse(null)
  }, [])

  const startUpload = (courseId: string) => {
    setSelectedCourse(courseId)
    setActiveTab('upload')
    setPreviewData(null)
    setShowPreview(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Roster Management</h1>
          </div>
          <p className="text-gray-600">Upload Excel files to create student lists for your courses</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Courses
          </button>
          {selectedCourse && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload Roster
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'list' ? (
          // Courses List
          loadingCourses ? (
            <div className="text-center py-12 text-gray-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No courses found</div>
          ) :
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{course.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{course.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{course.year}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => startUpload(course.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Upload Roster
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Upload Tab
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Roster for {courses.find(c => c.id === selectedCourse)?.code || courses.find(c => c.id === selectedCourse)?.name}
              </h2>
              <RosterUpload
                courseId={selectedCourse || ''}
                onUploadStart={handleUploadStart}
                onUploadComplete={handleUploadComplete}
                onError={handleError}
              />
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">Excel File Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>File must be in .xlsx or .xls format</li>
                    <li>Maximum file size: 5MB</li>
                    <li>Column headers required (row 1): student_id, email, first_name, last_name</li>
                    <li>Email must be @utm.my or @graduate.utm.my</li>
                    <li>Student ID and email must be unique in the file</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <RosterPreview
        open={showPreview}
        data={previewData}
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setShowPreview(false)
          setPreviewData(null)
        }}
        isConfirming={isConfirming}
      />

      {/* Confirmation Modal */}
      <RosterConfirmation
        open={showConfirmation}
        result={confirmationResult}
        onClose={handleConfirmationClose}
      />

      {/* Error Toast */}
      {showErrorToast && errorMessage && (
        <Toast
          type="error"
          message={errorMessage}
          onClose={() => setShowErrorToast(false)}
        />
      )}
    </div>
  )
}
