'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flag, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { getFlaggedMarks, unflagMark, type FlaggedMark } from '@/lib/api/marks'

export default function FlaggedMarksPage() {
  useAuth()
  const { addToast } = useToastStore()

  const [marks, setMarks] = useState<FlaggedMark[]>([])
  const [loading, setLoading] = useState(true)
  const [unflagging, setUnflagging] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFlaggedMarks()
      setMarks(res.flagged_marks)
    } catch {
      addToast('Failed to load flagged marks', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const handleUnflag = async (markId: string) => {
    setUnflagging(markId)
    try {
      await unflagMark(markId)
      addToast('Flag cleared successfully', 'success')
      setMarks(prev => prev.filter(m => m.id !== markId))
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to clear flag', 'error')
    } finally {
      setUnflagging(null)
    }
  }

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Flagged Marks</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Review and resolve marks flagged for attention</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280]"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
      ) : marks.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-[16px] font-semibold text-[#111827]">No Flagged Marks</p>
            <p className="text-[14px] text-[#6B7280] mt-1">All marks are clear — nothing needs review.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-[14px] font-semibold text-[#111827]">{marks.length} flagged mark{marks.length !== 1 ? 's' : ''} require review</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Course</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Assessment</th>
                  <th className="text-right py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Score</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Flag Reason</th>
                  <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Modified</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {marks.map(m => (
                  <tr key={m.id} className="hover:bg-[#FFFBFB]">
                    <td className="py-3 px-3">
                      <p className="font-medium text-[#111827]">{m.student?.full_name || '—'}</p>
                      <p className="text-[12px] text-[#9CA3AF]">{m.student?.email || ''}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[13px] text-[#374151]">{m.courses?.code || '—'}</span>
                      <p className="text-[12px] text-[#9CA3AF]">{m.courses?.name || ''}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-[#374151]">{m.assessments?.name || '—'}</p>
                      <p className="text-[12px] text-[#9CA3AF] capitalize">{m.assessments?.type || ''}</p>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold text-[#111827]">
                        {m.raw_score !== null ? m.raw_score : '—'}
                      </span>
                      {m.assessments?.max_score && (
                        <span className="text-[#9CA3AF]"> / {m.assessments.max_score}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {m.flag_note ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[12px] rounded">
                          <Flag className="w-3 h-3" />
                          {m.flag_note}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[12px] text-[#9CA3AF]">{fmt(m.updated_at)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleUnflag(m.id)}
                        disabled={unflagging === m.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[12px] font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {unflagging === m.id ? (
                          <Spinner />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Clear Flag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
