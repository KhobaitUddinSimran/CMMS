'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Flag, CheckCircle, RefreshCw, AlertTriangle, Search, ArrowUpDown } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { MainLayout } from '@/components/layout/MainLayout'
import { useToastStore } from '@/stores/toastStore'
import { getFlaggedMarks, unflagMark, type FlaggedMark } from '@/lib/api/marks'

type SortKey = 'date' | 'score' | 'course'

function scorePct(raw: number | null, max?: number): number | null {
  if (raw === null || raw === undefined || !max) return null
  return Math.round((raw / max) * 100)
}

function pctColor(pct: number): string {
  if (pct >= 70) return 'bg-green-100 text-green-700'
  if (pct >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export default function FlaggedMarksPage() {
  useAuth()
  const { addToast } = useToastStore()

  const [marks, setMarks] = useState<FlaggedMark[]>([])
  const [loading, setLoading] = useState(true)
  const [unflagging, setUnflagging] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)

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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let list = q
      ? marks.filter(m =>
          (m.student?.full_name || '').toLowerCase().includes(q) ||
          (m.student?.email || '').toLowerCase().includes(q) ||
          (m.courses?.code || '').toLowerCase().includes(q) ||
          (m.courses?.name || '').toLowerCase().includes(q) ||
          (m.flag_note || '').toLowerCase().includes(q)
        )
      : [...marks]

    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = (a.updated_at || '').localeCompare(b.updated_at || '')
      else if (sortKey === 'score') cmp = (a.raw_score ?? -1) - (b.raw_score ?? -1)
      else if (sortKey === 'course') cmp = (a.courses?.code || '').localeCompare(b.courses?.code || '')
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [marks, search, sortKey, sortAsc])

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 hover:text-[#111827] transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? 'text-[#C90031]' : 'text-[#D1D5DB]'}`} />
    </button>
  )

  return (
    <MainLayout>
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Flagged Marks</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Review and resolve marks flagged for attention</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280] disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student, course, reason…"
                className="w-full pl-9 pr-3 py-2 text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]"
              />
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-[13px] font-medium text-[#374151]">
                {filtered.length} / {marks.length} flagged mark{marks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center py-8 text-[14px] text-[#9CA3AF]">No results match &quot;{search}&quot;</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      <SortBtn col="course" label="Course" />
                    </th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Assessment</th>
                    <th className="text-right py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      <SortBtn col="score" label="Score" />
                    </th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Flag Reason</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      <SortBtn col="date" label="Modified" />
                    </th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {filtered.map(m => {
                    const pct = scorePct(m.raw_score, m.assessments?.max_score)
                    return (
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
                          <div className="flex items-center justify-end gap-2">
                            {pct !== null && (
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pctColor(pct)}`}>
                                {pct}%
                              </span>
                            )}
                            <span className="font-semibold text-[#111827]">
                              {m.raw_score !== null ? m.raw_score : '—'}
                              {m.assessments?.max_score && (
                                <span className="font-normal text-[#9CA3AF]"> / {m.assessments.max_score}</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {m.flag_note ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[12px] rounded max-w-[180px] truncate">
                              <Flag className="w-3 h-3 flex-shrink-0" />
                              {m.flag_note}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[12px] text-[#9CA3AF] whitespace-nowrap">{fmt(m.updated_at)}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleUnflag(m.id)}
                            disabled={unflagging === m.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[12px] font-medium rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {unflagging === m.id ? <Spinner /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Clear
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
    </MainLayout>
  )
}
