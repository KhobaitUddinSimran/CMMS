'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AssessmentSetupPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Setup</h1>
          </div>
          <p className="text-gray-600">Configure course assessments</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="border-b pb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assessment Type</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Continuous</option>
              <option>Semester</option>
              <option>Mixed</option>
            </select>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Weightage Distribution</label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-24">Participation</span>
                <input type="number" placeholder="%" className="flex-1 px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24">Assignments</span>
                <input type="number" placeholder="%" className="flex-1 px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24">Exams</span>
                <input type="number" placeholder="%" className="flex-1 px-3 py-2 border border-gray-300 rounded" />
              </div>
            </div>
          </div>

          <button className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
