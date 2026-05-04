'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { MainLayout } from '@/components/layout/MainLayout'
import { getAuditLogs, type AuditLogEntry } from '@/lib/api/admin'

const ACTION_COLORS: Record<string, string> = {
  USER_APPROVED: 'bg-green-100 text-green-700',
  USER_REJECTED: 'bg-red-100 text-red-700',
  USER_ACTIVATED: 'bg-green-100 text-green-700',
  USER_DEACTIVATED: 'bg-orange-100 text-orange-700',
  SPECIAL_ROLE_ASSIGNED: 'bg-purple-100 text-purple-700',
  SPECIAL_ROLE_REVOKED: 'bg-pink-100 text-pink-700',
  COURSE_CREATED: 'bg-blue-100 text-blue-700',
  COURSE_UPDATED: 'bg-blue-100 text-blue-700',
  ENROLLMENT_ADDED: 'bg-cyan-100 text-cyan-700',
  ENROLLMENT_DROPPED: 'bg-gray-100 text-gray-700',
  MARK_PUBLISHED: 'bg-indigo-100 text-indigo-700',
  MARK_UPDATED: 'bg-indigo-100 text-indigo-700',
}

export default function SystemLogsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await getAuditLogs({
        limit: 100,
        action: actionFilter || undefined,
      })
      setLogs(data.logs)
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, actionFilter])

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)))

  if (!isAuthenticated || user?.role !== 'admin') return null

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">System Audit Logs</h1>
            <p className="text-gray-600 mt-1">Complete record of all administrative and user actions</p>
          </div>
          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-3 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <span className="ml-auto text-sm text-gray-500">{logs.length} entries</span>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No audit log entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{log.actor_name || 'System'}</div>
                        <div className="text-xs text-gray-500">{log.actor_email || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.new_values && Object.keys(log.new_values).length > 0 ? (
                          <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
