'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SystemLogsPage() {
  const router = useRouter()

  const logs = [
    { timestamp: '2024-04-14 14:32:15', level: 'INFO', service: 'API', message: 'User logged in successfully' },
    { timestamp: '2024-04-14 14:25:48', level: 'INFO', service: 'Database', message: 'Backup completed' },
    { timestamp: '2024-04-14 14:18:22', level: 'WARNING', service: 'API', message: 'High API response time' },
    { timestamp: '2024-04-14 14:10:05', level: 'INFO', service: 'System', message: 'Database optimization completed' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Service</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.level === 'INFO' ? 'bg-blue-100 text-blue-700' :
                      log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{log.service}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
