'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AssessmentConfigPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Configuration</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Global Grading Scale</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: &lt;60</option>
              <option>A+: 95-100, A: 90-94, B+: 85-89, B: 80-84</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Late Submission Penalty</label>
            <input type="number" placeholder="%" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Carry Mark Pass Score</label>
            <input type="number" placeholder="%" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <button className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
