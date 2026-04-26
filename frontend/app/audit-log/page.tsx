'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
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
  MARK_UNFLAGGED: 'bg-teal-100 text-teal-700',
  QUERY_SUBMITTED: 'bg-yellow-100 text-yellow-700',
  QUERY_RESPONDED: 'bg-blue-100 text-blue-700',
  QUERY_STATUS_CHANGED: 'bg-gray-100 text-gray-700',
}

export default function AuditLogPage() {
  const { addToast } = useToastStore()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAuditLogs({ limit: 100, action: actionFilter || undefined })
      setLogs(res.logs)
    } catch {
      addToast('Failed to load audit logs', 'error')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, addToast])

  useEffect(() => { loadLogs() }, [loadLogs])

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Audit Log</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">System-wide record of all significant actions</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280]"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter bar */}
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[13px] font-medium text-[#374151]">Filter by action:</label>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C90031] bg-white"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <span className="ml-auto text-[13px] text-[#9CA3AF]">{logs.length} entries</span>
        </div>
      </Card>

      {/* Log table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-[#6B7280]">No audit log entries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Action</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Actor</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-3 font-mono text-[12px] text-[#6B7280] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-MY')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-[#111827]">{log.actor_name || 'System'}</p>
                      <p className="text-[12px] text-[#9CA3AF]">{log.actor_email || ''}</p>
                    </td>
                    <td className="py-3 px-3 text-[#6B7280]">
                      {log.new_values && Object.keys(log.new_values).length > 0 ? (
                        <pre className="text-[11px] bg-[#F9FAFB] px-2 py-1 rounded max-w-xs overflow-x-auto">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-[#D1D5DB]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
