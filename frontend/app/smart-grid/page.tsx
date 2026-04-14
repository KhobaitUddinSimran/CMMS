'use client'

import { Grid3x3, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SmartGridPage() {
  const router = useRouter()

  const courses = [
    { code: 'CS101', name: 'Programming 101', students: 45, pending: 12 },
    { code: 'CS201', name: 'Data Structures', students: 38, pending: 8 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Smart Grid</h1>
          </div>
          <p className="text-gray-600">Manage course grading grid</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.code} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">{course.code}</p>
                  <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                </div>
                <Grid3x3 className="text-blue-600" size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-gray-600"><span className="font-semibold">{course.students}</span> Students</p>
                <p className="text-yellow-600"><span className="font-semibold">{course.pending}</span> Pending Grades</p>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Open Grid
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
