'use client'

import { MessageSquare, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function QueriesPage() {
  const router = useRouter()

  const queries = [
    { id: 1, subject: 'Clarification on Assignment 3', date: '2024-04-10', status: 'Resolved', instructor: 'Dr. Smith' },
    { id: 2, subject: 'Grade Appeal for Midterm', date: '2024-04-08', status: 'In Progress', instructor: 'Prof. Johnson' },
    { id: 3, subject: 'Extension Request', date: '2024-04-05', status: 'Pending', instructor: 'Dr. Williams' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Queries</h1>
          </div>
          <p className="text-gray-600">Track your questions and concerns</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Instructor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {queries.map((query) => (
                <tr key={query.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{query.subject}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{query.instructor}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{query.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      query.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                      query.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {query.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          New Query
        </button>
      </div>
    </div>
  )
}
