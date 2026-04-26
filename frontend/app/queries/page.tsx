'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus, X, Send, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
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

  // Load courses for student new-query modal
  useEffect(() => {
    if (isStudent && showNewQuery) {
      listCourses().then(res => setCourses(res.data || res)).catch(() => {})
    }
  }, [isStudent, showNewQuery])

  // Load assessments when course selected
  useEffect(() => {
    if (newQuery.course_id) {
      listAssessments(newQuery.course_id).then(res => setAssessments(res.data || [])).catch(() => setAssessments([]))
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

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
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
                  onChange={e => setNewQuery(p => ({ ...p, course_id: e.target.value, assessment_id: '', query_text: p.query_text }))}
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
              <button
                onClick={() => setShowNewQuery(false)}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#374151] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuery}
                disabled={submittingQuery}
                className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg disabled:opacity-50"
              >
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
      ) : queries.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-[#6B7280]">No queries yet</p>
            {isStudent && (
              <button
                onClick={() => setShowNewQuery(true)}
                className="mt-4 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg"
              >
                Submit your first query
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {queries.map(q => (
            <Card key={q.id}>
              {/* Query header row */}
              <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">{fmt(q.created_at)}</p>
                </div>
                <div className="flex-shrink-0 text-[#9CA3AF]">
                  {expanded === q.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === q.id && (
                <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-4">
                  {/* Full question */}
                  <div className="bg-[#F9FAFB] rounded-lg p-3">
                    <p className="text-[12px] font-medium text-[#6B7280] mb-1">Question</p>
                    <p className="text-[14px] text-[#111827]">{q.query_text}</p>
                  </div>

                  {/* Lecturer response */}
                  {q.lecturer_response && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-[12px] text-blue-600 font-medium mb-1">Staff Response</p>
                      <p className="text-[14px] text-[#111827]">{q.lecturer_response}</p>
                      {q.resolved_at && (
                        <p className="text-[11px] text-[#9CA3AF] mt-1">Resolved {fmt(q.resolved_at)}</p>
                      )}
                    </div>
                  )}

                  {/* Respond form (lecturer / coordinator / admin) */}
                  {!isStudent && (
                    <>
                      {respondingId === q.id ? (
                        <div className="space-y-2">
                          <textarea
                            autoFocus
                            rows={3}
                            value={responseText}
                            onChange={e => setResponseText(e.target.value)}
                            placeholder="Type your response…"
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031] resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setRespondingId(null); setResponseText('') }}
                              className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[13px] text-[#374151] hover:bg-[#F9FAFB]"
                            >Cancel</button>
                            <button
                              onClick={() => handleRespond(q.id)}
                              disabled={submittingResponse || !responseText.trim()}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C90031] hover:bg-[#A80028] text-white text-[13px] font-medium rounded-lg disabled:opacity-50"
                            >
                              {submittingResponse ? <Spinner /> : <Send className="w-3.5 h-3.5" />}
                              Send
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {q.status === 'OPEN' && (
                            <button
                              onClick={() => { setRespondingId(q.id); setResponseText('') }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C90031] hover:bg-[#A80028] text-white text-[13px] font-medium rounded-lg"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Respond
                            </button>
                          )}
                          {q.status === 'RESOLVED' && (
                            <button
                              onClick={() => handleStatusChange(q.id, 'OPEN')}
                              className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] text-[13px] font-medium rounded-lg"
                            >Reopen</button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Student reopen */}
                  {isStudent && q.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusChange(q.id, 'OPEN')}
                      className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] text-[13px] font-medium rounded-lg"
                    >Reopen Query</button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
