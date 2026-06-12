'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, Search, Download, ChevronDown, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { getAuditLogs, type AuditLogEntry } from '@/lib/api/admin'
import { downloadCsv, dateStamp } from '@/lib/utils/csv'

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

const PAGE_SIZE = 50

export default function AuditLogPage() {
  const { addToast } = useToastStore()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setVisibleCount(PAGE_SIZE)
    try {
      const res = await getAuditLogs({ limit: 500, action: actionFilter || undefined })
      setLogs(res.logs)
    } catch {
      addToast('Failed to load audit logs', 'error')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, addToast])

  useEffect(() => { loadLogs() }, [loadLogs])

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))).sort(), [logs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return logs
    return logs.filter(l =>
      (l.actor_name || '').toLowerCase().includes(q) ||
      (l.actor_email || '').toLowerCase().includes(q) ||
      (l.entity_type || '').toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    )
  }, [logs, search])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function exportCurrentView() {
    const headers = ['Timestamp', 'Action', 'Actor Email', 'Actor Name', 'Entity Type', 'Entity ID', 'IP Address', 'Details']
    const rows = filtered.map(l => [
      l.created_at || '', l.action || '', l.actor_email || '', l.actor_name || '',
      l.entity_type || '', l.entity_id || '', (l as any).ip_address || '',
      l.new_values ? JSON.stringify(l.new_values) : '',
    ])
    downloadCsv(`audit_log_${dateStamp()}.csv`, headers, rows)
    addToast(`Exported ${rows.length} audit entries`, 'success')
  }

  return (
    <MainLayout>
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Audit Log</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">System-wide record of all significant actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCurrentView}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280] disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter + search bar */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <label className="text-[13px] font-medium text-[#374151] whitespace-nowrap">Action:</label>
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

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actor, entity, action…"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]"
            />
          </div>

          <span className="ml-auto text-[13px] text-[#9CA3AF] whitespace-nowrap">
            {filtered.length} / {logs.length} entries
          </span>
        </div>
      </Card>

      {/* Log table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[#6B7280]">
            {search ? `No entries matching "${search}"` : 'No audit log entries found'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Action</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Actor</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Entity</th>
                    <th className="py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {visible.map(log => {
                    const hasDetails = log.new_values && Object.keys(log.new_values).length > 0
                    const isExpanded = expanded.has(log.id)
                    return (
                      <>
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
                          <td className="py-3 px-3 text-[13px]">
                            {log.entity_type ? (
                              <>
                                <span className="font-medium text-[#374151]">{log.entity_type}</span>
                                {log.entity_id && <p className="text-[11px] font-mono text-[#9CA3AF] truncate max-w-[120px]">{log.entity_id}</p>}
                              </>
                            ) : <span className="text-[#D1D5DB]">—</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {hasDetails ? (
                              <button
                                onClick={() => toggleExpand(log.id)}
                                className="inline-flex items-center gap-1 text-[12px] text-[#C90031] hover:underline"
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                {isExpanded ? 'Hide' : 'View'}
                              </button>
                            ) : <span className="text-[#D1D5DB]">—</span>}
                          </td>
                        </tr>
                        {isExpanded && hasDetails && (
                          <tr key={`${log.id}-detail`} className="bg-[#F9FAFB]">
                            <td colSpan={5} className="px-6 pb-4 pt-2">
                              <pre className="text-[11px] text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 overflow-x-auto max-h-48">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="px-5 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
            <p className="mt-3 text-center text-[12px] text-[#9CA3AF]">
              Showing {visible.length} of {filtered.length} entries
            </p>
          </>
        )}
      </Card>
    </div>
    </MainLayout>
  )
}
