'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, ChevronDown, ChevronUp, ArrowUpDown, RefreshCw, Plus, X, Search } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import {
  listQueries, submitQuery, respondToQuery, updateQueryStatus,
  type QueryData,
} from '@/lib/api/queries'
import { listCourses } from '@/lib/api/courses'
import { listAssessments } from '@/lib/api/assessments'

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
}

export default function QueriesPage() {
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const isStudent = user?.role === 'student'

  const [queries, setQueries] = useState<QueryData[]>([])
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  // New query modal state
  const [showNewQuery, setShowNewQuery] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [newQuery, setNewQuery] = useState({ course_id: '', assessment_id: '', query_text: '' })
  const [submittingQuery, setSubmittingQuery] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listQueries()
      setQueries(res.queries)
    } catch {
      addToast('Failed to load queries', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isStudent && showNewQuery) {
      listCourses().then(res => setCourses((res as any).data || res)).catch(() => {})
    }
  }, [isStudent, showNewQuery])

  useEffect(() => {
    if (newQuery.course_id) {
      listAssessments(newQuery.course_id).then(res => setAssessments((res as any).data || [])).catch(() => setAssessments([]))
    } else {
      setAssessments([])
    }
  }, [newQuery.course_id])

  const handleSubmitQuery = async () => {
    if (!newQuery.assessment_id || !newQuery.query_text.trim()) {
      addToast('Please select an assessment and enter your question', 'error')
      return
    }
    setSubmittingQuery(true)
    try {
      await submitQuery({ assessment_id: newQuery.assessment_id, query_text: newQuery.query_text })
      addToast('Query submitted successfully', 'success')
      setShowNewQuery(false)
      setNewQuery({ course_id: '', assessment_id: '', query_text: '' })
      load()
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to submit query', 'error')
    } finally {
      setSubmittingQuery(false)
    }
  }

  const handleRespond = async (queryId: string) => {
    if (!responseText.trim()) return
    setSubmittingResponse(true)
    try {
      await respondToQuery(queryId, { response: responseText })
      addToast('Response sent', 'success')
      setRespondingId(null)
      setResponseText('')
      load()
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to send response', 'error')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const handleStatusChange = async (queryId: string, newStatus: string) => {
    try {
      await updateQueryStatus(queryId, newStatus)
      addToast(`Status updated to ${newStatus}`, 'success')
      load()
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to update status', 'error')
    }
  }

  const fmt = (dateStr: string | null | undefined): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isUnread = (q: QueryData): boolean => {
    if (isStudent) return !q.is_read_by_student && !!q.lecturer_response
    return !q.is_read_by_lecturer
  }

  const filtered = queries
    .filter(q => filter === 'ALL' || q.status === filter)
    .filter(q => {
      const q_lower = search.trim().toLowerCase()
      if (!q_lower) return true
      return (
        (q.student?.full_name ?? '').toLowerCase().includes(q_lower) ||
        (q.student?.email ?? '').toLowerCase().includes(q_lower) ||
        (q.courses?.code ?? '').toLowerCase().includes(q_lower) ||
        (q.courses?.name ?? '').toLowerCase().includes(q_lower) ||
        (q.query_text ?? '').toLowerCase().includes(q_lower)
      )
    })
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="pt-4 flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-[#111827]">
              {isStudent ? 'My Queries' : 'Student Queries'}
            </h1>
            <p className="text-[16px] text-[#6B7280] mt-1">
              {isStudent ? 'Track your questions and concerns' : 'Review and respond to student queries'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280]"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {isStudent && (
              <button
                onClick={() => setShowNewQuery(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Query
              </button>
            )}
          </div>
        </div>

        {/* Filter + Sort + Search bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-lg p-1">
              {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    filter === f ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  {f !== 'ALL' && (
                    <span className="ml-1.5 text-[11px] text-[#9CA3AF]">
                      ({queries.filter(q => q.status === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] bg-white rounded-lg text-[13px] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
            <span className="text-[13px] text-[#9CA3AF] ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by student name, course code, or query text…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]"
            />
          </div>
        </div>

        {/* New Query Modal (student) */}
        {showNewQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[#111827]">Submit New Query</h2>
                <button onClick={() => setShowNewQuery(false)} className="text-[#9CA3AF] hover:text-[#111827]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Course</label>
                  <select
                    value={newQuery.course_id}
                    onChange={e => setNewQuery(p => ({ ...p, course_id: e.target.value, assessment_id: '' }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C90031]"
                  >
                    <option value="">Select a course…</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Assessment</label>
                  <select
                    value={newQuery.assessment_id}
                    onChange={e => setNewQuery(p => ({ ...p, assessment_id: e.target.value }))}
                    disabled={!newQuery.course_id}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C90031] disabled:opacity-50"
                  >
                    <option value="">Select an assessment…</option>
                    {assessments.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Your Question</label>
                  <textarea
                    rows={4}
                    value={newQuery.query_text}
                    onChange={e => setNewQuery(p => ({ ...p, query_text: e.target.value }))}
                    placeholder="Describe your query in detail…"
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C90031] resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowNewQuery(false)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#374151] hover:bg-[#F9FAFB]">
                  Cancel
                </button>
                <button onClick={handleSubmitQuery} disabled={submittingQuery}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg disabled:opacity-50">
                  {submittingQuery ? <Spinner /> : <Send className="w-4 h-4" />}
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queries List */}
        {loading ? (
          <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-[#6B7280]">{queries.length === 0 ? 'No queries yet' : 'No queries match the current filter'}</p>
              {isStudent && queries.length === 0 && (
                <button onClick={() => setShowNewQuery(true)}
                  className="mt-4 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg">
                  Submit your first query
                </button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => (
              <Card key={q.id}>
                <div className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnread(q) && (
                        <span className="w-2 h-2 rounded-full bg-[#C90031] flex-shrink-0" title="Unread" />
                      )}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_STYLES[q.status] || 'bg-gray-100 text-gray-600'}`}>
                        {q.status.replace('_', ' ')}
                      </span>
                      {q.courses && (
                        <span className="text-[12px] text-[#6B7280] font-mono">{q.courses.code}</span>
                      )}
                      {q.assessments && (
                        <span className="text-[12px] text-[#6B7280]">· {q.assessments.name}</span>
                      )}
                      {!isStudent && q.student && (
                        <span className="text-[12px] text-[#9CA3AF]">by {q.student.full_name || q.student.email}</span>
                      )}
                    </div>
                    <p className="text-[14px] text-[#111827] font-medium mt-1 truncate">{q.query_text}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">Submitted: {fmt(q.created_at)}</p>
                  </div>
                  <div className="flex-shrink-0 text-[#9CA3AF]">
                    {expanded === q.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {expanded === q.id && (
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-4">
                    <div className="bg-[#F9FAFB] rounded-lg p-3">
                      <p className="text-[12px] font-medium text-[#6B7280] mb-1">Question</p>
                      <p className="text-[14px] text-[#111827]">{q.query_text}</p>
                    </div>

                    {q.lecturer_response && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-[12px] text-blue-600 font-medium mb-1">Staff Response</p>
                        <p className="text-[14px] text-[#111827]">{q.lecturer_response}</p>
                        {q.resolved_at && (
                          <p className="text-[11px] text-[#9CA3AF] mt-1">Resolved: {fmt(q.resolved_at)}</p>
                        )}
                      </div>
                    )}

                    {!isStudent && (
                      <>
                        {respondingId === q.id ? (
                          <div className="space-y-2">
                            <textarea autoFocus rows={3} value={responseText}
                              onChange={e => setResponseText(e.target.value)}
                              placeholder="Type your response…"
                              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031] resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setRespondingId(null); setResponseText('') }}
                                className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[13px] text-[#374151] hover:bg-[#F9FAFB]">
                                Cancel
                              </button>
                              <button onClick={() => handleRespond(q.id)}
                                disabled={submittingResponse || !responseText.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C90031] hover:bg-[#A80028] text-white text-[13px] font-medium rounded-lg disabled:opacity-50">
                                {submittingResponse ? <Spinner /> : <Send className="w-3.5 h-3.5" />}
                                Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {q.status === 'OPEN' && (
                              <button onClick={() => { setRespondingId(q.id); setResponseText('') }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C90031] hover:bg-[#A80028] text-white text-[13px] font-medium rounded-lg">
                                <MessageSquare className="w-3.5 h-3.5" /> Respond
                              </button>
                            )}
                            {q.status === 'RESOLVED' && (
                              <button onClick={() => handleStatusChange(q.id, 'OPEN')}
                                className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] text-[13px] font-medium rounded-lg">
                                Reopen
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {isStudent && q.status === 'RESOLVED' && (
                      <button onClick={() => handleStatusChange(q.id, 'OPEN')}
                        className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] text-[13px] font-medium rounded-lg">
                        Reopen Query
                      </button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
