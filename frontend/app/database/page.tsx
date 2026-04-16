'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DatabasePage() {
  const router = useRouter()

  const tables = [
    { name: 'users', records: '2,450', size: '12 MB', lastBackup: '2024-04-14' },
    { name: 'courses', records: '480', size: '25 MB', lastBackup: '2024-04-14' },
    { name: 'grades', records: '85,320', size: '48 MB', lastBackup: '2024-04-14' },
    { name: 'enrollments', records: '120,000', size: '89 MB', lastBackup: '2024-04-14' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Total Database Size</p>
            <p className="text-3xl font-bold text-gray-900">174 MB</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Last Backup</p>
            <p className="text-3xl font-bold text-gray-900">Today</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Table</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Records</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Size</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Last Backup</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tables.map((table, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{table.name}</td>
                  <td className="px-6 py-4 text-gray-600">{table.records}</td>
                  <td className="px-6 py-4">{table.size}</td>
                  <td className="px-6 py-4">{table.lastBackup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
