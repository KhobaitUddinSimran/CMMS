'use client'

import { Download, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ExportPage() {
  const router = useRouter()

  const exports = [
    { name: 'Student Enrollment List', format: 'CSV, PDF', date: '2024-04-10' },
    { name: 'Grade Report', format: 'Excel, PDF', date: '2024-04-08' },
    { name: 'Course Summary', format: 'CSV, PDF', date: '2024-04-05' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
        </div>

        <div className="space-y-4">
          {exports.map((exp, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{exp.name}</h3>
                <p className="text-sm text-gray-600">{exp.format}</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Download size={18} />
                Export
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
