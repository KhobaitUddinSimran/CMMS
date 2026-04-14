'use client'

import { BarChart3, ArrowLeft, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">View detailed course and enrollment reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Enrollment Report', icon: <Users className="w-8 h-8" /> },
            { title: 'Performance Report', icon: <BarChart3 className="w-8 h-8" /> },
            { title: 'Assessment Report', icon: <BarChart3 className="w-8 h-8" /> },
          ].map((report, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-blue-600 mb-4">{report.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-4">Generate detailed analytics</p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Generate →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
