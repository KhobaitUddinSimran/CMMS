'use client'

import { Mail, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CoursesPage() {
  const router = useRouter()

  const courses = [
    { id: 1, code: 'CS101', name: 'Introduction to Programming', semester: 'Spring 2024', credits: 3, grade: 'A' },
    { id: 2, code: 'CS201', name: 'Data Structures', semester: 'Spring 2024', credits: 4, grade: 'A-' },
    { id: 3, code: 'CS301', name: 'Algorithms', semester: 'Fall 2023', credits: 3, grade: 'B+' },
    { id: 4, code: 'CS401', name: 'Software Engineering', semester: 'Fall 2023', credits: 4, grade: 'A' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-gray-600">View your enrolled courses and progress</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <p className="text-sm font-semibold text-blue-100">{course.code}</p>
                <h3 className="text-xl font-bold">{course.name}</h3>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">SEMESTER</label>
                    <p className="text-gray-900">{course.semester}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <label className="text-xs font-semibold text-gray-500">CREDITS</label>
                      <p className="text-gray-900">{course.credits}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500">GRADE</label>
                      <p className="text-lg font-bold text-green-600">{course.grade}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-4">
            <Mail className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Need Help?</h3>
              <p className="text-blue-700 text-sm">
               Contact your course instructor or visit the help section for more information about your courses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
