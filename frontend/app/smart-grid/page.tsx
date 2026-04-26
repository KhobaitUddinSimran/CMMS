'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Select } from '@/components/common/Select'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses } from '@/lib/api/courses'
import { listAssessments } from '@/lib/api/assessments'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { getCourseAllMarks, createMark, updateMark, publishMarkIds, unpublishMarkIds } from '@/lib/api/marks'
import { Save, CheckCircle, Grid3x3, Users, ClipboardList, Lock, LockOpen, TrendingUp, RefreshCw } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CourseOption { id: string; label: string }
interface Student { id: string; email: string; full_name: string }
interface Assessment { id: string; name: string; max_score: number; weight: number; assessment_type?: string }

interface CellState {
  markId: string | null
  score: string
  status: 'draft' | 'published'
  dirty: boolean
}

type GridState = Record<string, Record<string, CellState>>

// ── Per-student carry total (published marks only) ─────────────────────────
function calcCarry(studentId: string, assessments: Assessment[], grid: GridState): number {
  let total = 0
  for (const a of assessments) {
    const cell = grid[studentId]?.[a.id]
    if (cell?.status === 'published' && cell.score !== '') {
      const sc = parseFloat(cell.score)
      if (!isNaN(sc) && a.max_score > 0) total += (sc / a.max_score) * a.weight
    }
  }
  return total
}

// ── Column stats (all entered scores, draft + published) ───────────────────
function colStats(assessmentId: string, students: Student[], grid: GridState) {
  const scores = students
    .map((s) => grid[s.id]?.[assessmentId])
    .filter((c) => c?.score !== '' && c?.score !== undefined)
    .map((c) => parseFloat(c!.score))
    .filter((v) => !isNaN(v))
  if (scores.length === 0) return { avg: '—', hi: '—', lo: '—', count: 0 }
  return {
    avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    hi: String(Math.max(...scores)),
    lo: String(Math.min(...scores)),
    count: scores.length,
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SmartGridPage() {
  const { addToast } = useToastStore()
  const searchParams = useSearchParams()

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [loadingGrid, setLoadingGrid] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [grid, setGrid] = useState<GridState>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [unpublishing, setUnpublishing] = useState<string | null>(null)

  // ── Load courses ───────────────────────────────────────────────
  useEffect(() => {
    const preselect = searchParams.get('course')
    listCourses({ limit: 200 })
      .then((res) => {
        const list = res.data || (res as any)
        setCourseOptions(
          list.map((c: any) => ({
            id: c.id,
            label: `${c.code} – Sec ${c.section} (${c.year ?? c.academic_year}, Sem ${c.semester})`,
          }))
        )
        if (preselect) setSelectedCourseId(preselect)
      })
      .catch(() => addToast('Failed to load courses', 'error'))
      .finally(() => setLoadingCourses(false))
  }, [])

  // ── Load grid when course changes ─────────────────────────────
  useEffect(() => {
    if (!selectedCourseId) return
    loadGrid(selectedCourseId)
  }, [selectedCourseId])

  const loadGrid = async (courseId: string) => {
    setLoadingGrid(true)
    setGrid({}); setStudents([]); setAssessments([])
    try {
      const [studentsData, assessmentsRes, marksData] = await Promise.all([
        getEnrolledStudents(courseId),
        listAssessments(courseId),
        getCourseAllMarks(courseId),
      ])
      const assessmentList: Assessment[] = (
        Array.isArray(assessmentsRes) ? assessmentsRes : (assessmentsRes as any).data || []
      ).map((a: any) => ({
        id: a.id,
        name: a.name,
        max_score: a.max_score ?? 100,
        weight: a.weight ?? a.weight_percentage ?? 0,
        assessment_type: a.assessment_type ?? a.type ?? '',
      }))
      const newGrid: GridState = {}
      for (const s of studentsData) {
        newGrid[s.id] = {}
        for (const a of assessmentList) {
          newGrid[s.id][a.id] = { markId: null, score: '', status: 'draft', dirty: false }
        }
      }
      for (const m of marksData) {
        if (newGrid[m.student_id]?.[m.assessment_id] !== undefined) {
          newGrid[m.student_id][m.assessment_id] = {
            markId: m.id,
            score: m.score != null ? String(m.score) : '',
            status: (m.status as 'draft' | 'published') ?? 'draft',
            dirty: false,
          }
        }
      }
      setStudents(studentsData.filter((s: any) => s.status === 'active' || !s.status))
      setAssessments(assessmentList)
      setGrid(newGrid)
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to load grade grid', 'error')
    } finally {
      setLoadingGrid(false)
    }
  }

  // ── Cell change ───────────────────────────────────────────────
  const handleCellChange = useCallback((studentId: string, assessmentId: string, value: string) => {
    setGrid((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentId]: { ...prev[studentId][assessmentId], score: value, dirty: true },
      },
    }))
  }, [])

  // ── Save all dirty cells ──────────────────────────────────────
  const handleSaveAll = async () => {
    const dirtyCells: { studentId: string; assessmentId: string; cell: CellState }[] = []
    for (const [sid, row] of Object.entries(grid)) {
      for (const [aid, cell] of Object.entries(row)) {
        if (cell.dirty && cell.status !== 'published') dirtyCells.push({ studentId: sid, assessmentId: aid, cell })
      }
    }
    if (dirtyCells.length === 0) { addToast('No changes to save', 'info'); return }
    setSaving(true)
    let saved = 0, failed = 0
    const updatedGrid = { ...grid }
    for (const { studentId, assessmentId, cell } of dirtyCells) {
      const scoreVal = cell.score.trim() === '' ? null : parseFloat(cell.score)
      try {
        if (cell.markId) {
          const updated = await updateMark(cell.markId, { raw_score: scoreVal })
          const sc = updated.score ?? updated.raw_score
          updatedGrid[studentId] = { ...updatedGrid[studentId], [assessmentId]: { ...cell, score: sc != null ? String(sc) : '', dirty: false } }
        } else {
          const created = await createMark({ student_id: studentId, assessment_id: assessmentId, score: scoreVal })
          const sc = created.score ?? (created as any).raw_score
          updatedGrid[studentId] = { ...updatedGrid[studentId], [assessmentId]: { markId: created.id, score: sc != null ? String(sc) : '', status: 'draft', dirty: false } }
        }
        saved++
      } catch { failed++ }
    }
    setGrid(updatedGrid)
    setSaving(false)
    if (failed === 0) addToast(`Saved ${saved} mark${saved !== 1 ? 's' : ''}`, 'success')
    else addToast(`Saved ${saved}, failed ${failed}`, 'error')
  }

  // ── Publish column ────────────────────────────────────────────
  const handlePublish = async (assessmentId: string) => {
    const draftIds = students
      .map((s) => grid[s.id]?.[assessmentId])
      .filter((c) => c?.markId && c.status === 'draft')
      .map((c) => c!.markId!)
    if (draftIds.length === 0) { addToast('No draft marks to publish for this assessment', 'info'); return }
    setPublishing(assessmentId)
    try {
      const res = await publishMarkIds(draftIds)
      setGrid((prev) => {
        const next = { ...prev }
        for (const s of students) {
          const cell = next[s.id]?.[assessmentId]
          if (cell?.markId && draftIds.includes(cell.markId))
            next[s.id] = { ...next[s.id], [assessmentId]: { ...cell, status: 'published' } }
        }
        return next
      })
      addToast(res.message || `Published ${draftIds.length} marks`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to publish', 'error')
    } finally { setPublishing(null) }
  }

  // ── Unpublish column → revert to draft ───────────────────────
  const handleUnpublish = async (assessmentId: string) => {
    const pubIds = students
      .map((s) => grid[s.id]?.[assessmentId])
      .filter((c) => c?.markId && c.status === 'published')
      .map((c) => c!.markId!)
    if (pubIds.length === 0) { addToast('No published marks to revert', 'info'); return }
    setUnpublishing(assessmentId)
    try {
      const res = await unpublishMarkIds(pubIds)
      setGrid((prev) => {
        const next = { ...prev }
        for (const s of students) {
          const cell = next[s.id]?.[assessmentId]
          if (cell?.markId && pubIds.includes(cell.markId))
            next[s.id] = { ...next[s.id], [assessmentId]: { ...cell, status: 'draft' } }
        }
        return next
      })
      addToast(res.message || `Reverted ${pubIds.length} marks to draft`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to unpublish', 'error')
    } finally { setUnpublishing(null) }
  }

  // ── Publish ALL drafts across every column ────────────────────
  const handlePublishAll = async () => {
    const allDraftIds = Object.values(grid)
      .flatMap(Object.values)
      .filter((c) => c.markId && c.status === 'draft')
      .map((c) => c.markId!)
    if (allDraftIds.length === 0) { addToast('No draft marks to publish', 'info'); return }
    setPublishing('__all__')
    try {
      const res = await publishMarkIds(allDraftIds)
      setGrid((prev) => {
        const next = { ...prev }
        for (const [sid, row] of Object.entries(next)) {
          for (const [aid, cell] of Object.entries(row)) {
            if (cell.markId && allDraftIds.includes(cell.markId))
              next[sid] = { ...next[sid], [aid]: { ...cell, status: 'published' } }
          }
        }
        return next
      })
      addToast(res.message || `Published all ${allDraftIds.length} marks`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to publish all', 'error')
    } finally { setPublishing(null) }
  }

  // ── Derived stats ─────────────────────────────────────────────
  const allCells = Object.values(grid).flatMap(Object.values)
  const draftCount = allCells.filter((c) => c.markId && c.status === 'draft').length
  const publishedCount = allCells.filter((c) => c.status === 'published').length
  const dirtyCount = allCells.filter((c) => c.dirty).length

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Smart Grid</h1>
          <p className="text-[#6B7280] mt-1">Enter and publish marks for your courses</p>
        </div>

        {/* Course Selector */}
        <Card>
          <div className="space-y-3">
            <h2 className="font-semibold text-[#111827]">Select Course</h2>
            {loadingCourses ? (
              <div className="flex items-center gap-2 text-[#6B7280]"><Spinner /><span className="text-sm">Loading courses…</span></div>
            ) : (
              <Select
                label=""
                value={selectedCourseId}
                onChange={setSelectedCourseId}
                options={courseOptions.map((c) => ({ label: c.label, value: c.id }))}
                placeholder="Choose a course to open its grade grid…"
              />
            )}
          </div>
        </Card>

        {!selectedCourseId && !loadingCourses && (
          <Card>
            <div className="text-center py-12">
              <Grid3x3 className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-medium text-[#6B7280]">Select a course above to open its grade grid</p>
            </div>
          </Card>
        )}

        {selectedCourseId && loadingGrid && (
          <Card><div className="flex items-center justify-center py-16"><Spinner /></div></Card>
        )}

        {selectedCourseId && !loadingGrid && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Students',    value: students.length,  icon: Users,         color: 'bg-blue-50 text-blue-600' },
                { label: 'Assessments', value: assessments.length, icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
                { label: 'Draft Marks', value: draftCount,       icon: Grid3x3,       color: 'bg-amber-50 text-amber-600' },
                { label: 'Published',   value: publishedCount,   icon: CheckCircle,   color: 'bg-green-50 text-green-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">{label}</p>
                      <p className="text-xl font-bold text-[#111827]">{value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {students.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="font-medium text-[#6B7280]">No students enrolled in this course yet</p>
                </div>
              </Card>
            ) : assessments.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <ClipboardList className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="font-medium text-[#6B7280]">No assessments configured for this course</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">Go to Assessment Setup to add assessment components first</p>
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden !p-0">
                {/* Action bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <p className="text-sm">
                    {dirtyCount > 0
                      ? <span className="text-amber-600 font-medium">{dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}</span>
                      : <span className="text-[#6B7280]">All changes saved</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Reload */}
                    <button
                      onClick={() => loadGrid(selectedCourseId)}
                      disabled={loadingGrid}
                      title="Reload marks from database"
                      className="flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reload
                    </button>
                    {/* Publish All Drafts */}
                    <button
                      onClick={handlePublishAll}
                      disabled={!!publishing || draftCount === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {publishing === '__all__' ? <Spinner /> : <CheckCircle className="w-4 h-4" />}
                      Publish All Drafts
                    </button>
                    {/* Save */}
                    <button
                      onClick={handleSaveAll}
                      disabled={saving || dirtyCount === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#a8002a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {saving ? <Spinner /> : <Save className="w-4 h-4" />}
                      Save All Changes
                    </button>
                  </div>
                </div>

                {/* Scrollable grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        {/* Student column */}
                        <th className="sticky left-0 z-10 bg-[#F9FAFB] text-left px-4 py-3 font-semibold text-[#374151] min-w-[180px] border-r border-[#E5E7EB]">
                          Student
                        </th>

                        {/* Per-assessment columns */}
                        {assessments.map((a) => {
                          const allPublished = students.every((s) => grid[s.id]?.[a.id]?.status === 'published')
                          const hasDraft     = students.some((s) => grid[s.id]?.[a.id]?.markId && grid[s.id]?.[a.id]?.status === 'draft')
                          const hasPublished = students.some((s) => grid[s.id]?.[a.id]?.status === 'published')
                          const { count }    = colStats(a.id, students, grid)
                          return (
                            <th key={a.id} className="px-3 py-3 text-center min-w-[155px] border-r border-[#E5E7EB]">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold text-[#374151] leading-tight">{a.name}</span>
                                <span className="text-[10px] text-[#9CA3AF]">Max {a.max_score} · {a.weight}%</span>
                                <span className="text-[10px] text-[#9CA3AF]">{count}/{students.length} entered</span>
                                {allPublished && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                                    <CheckCircle className="w-3 h-3" /> All Published
                                  </span>
                                )}
                                <div className="flex items-center gap-1 mt-0.5">
                                  {/* Publish draft marks */}
                                  {!allPublished && (
                                    <button
                                      onClick={() => handlePublish(a.id)}
                                      disabled={!!publishing || !hasDraft}
                                      className="flex items-center gap-0.5 px-2 py-0.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-[10px] font-medium transition-colors"
                                    >
                                      {publishing === a.id ? <Spinner /> : <Lock className="w-2.5 h-2.5" />}
                                      Publish
                                    </button>
                                  )}
                                  {/* Unpublish → revert to draft */}
                                  {hasPublished && (
                                    <button
                                      onClick={() => handleUnpublish(a.id)}
                                      disabled={!!unpublishing}
                                      title="Revert published marks to draft so scores can be corrected"
                                      className="flex items-center gap-0.5 px-2 py-0.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-[10px] font-medium transition-colors"
                                    >
                                      {unpublishing === a.id ? <Spinner /> : <LockOpen className="w-2.5 h-2.5" />}
                                      Unpublish
                                    </button>
                                  )}
                                </div>
                              </div>
                            </th>
                          )
                        })}

                        {/* Carry % column */}
                        <th className="px-3 py-3 text-center min-w-[90px] bg-[#F9FAFB]">
                          <div className="flex flex-col items-center gap-0.5">
                            <TrendingUp className="w-4 h-4 text-[#C90031]" />
                            <span className="font-semibold text-[#C90031] text-xs">Carry %</span>
                            <span className="text-[9px] text-[#9CA3AF]">published</span>
                          </div>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {students.map((student, si) => {
                        const carry = calcCarry(student.id, assessments, grid)
                        return (
                          <tr
                            key={student.id}
                            className={`border-b border-[#E5E7EB] last:border-0 ${si % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                          >
                            <td className="sticky left-0 z-10 px-4 py-2.5 border-r border-[#E5E7EB] bg-inherit">
                              <p className="font-medium text-[#111827] truncate max-w-[160px]">{student.full_name || student.email}</p>
                              <p className="text-[10px] text-[#9CA3AF] truncate">{student.email}</p>
                            </td>

                            {assessments.map((a) => {
                              const cell        = grid[student.id]?.[a.id]
                              const isPublished = cell?.status === 'published'
                              const scNum       = cell?.score !== '' ? parseFloat(cell?.score ?? '') : NaN
                              const isOverMax   = !isNaN(scNum) && scNum > a.max_score
                              return (
                                <td key={a.id} className="px-3 py-2 text-center border-r border-[#E5E7EB]">
                                  {isPublished ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-semibold text-green-700">{cell.score !== '' ? cell.score : '—'}</span>
                                      <span className="text-[10px] text-green-500">✓ published</span>
                                    </div>
                                  ) : (
                                    <div className="relative inline-block">
                                      <input
                                        type="number"
                                        min={0}
                                        max={a.max_score}
                                        step="0.5"
                                        value={cell?.score ?? ''}
                                        onChange={(e) => handleCellChange(student.id, a.id, e.target.value)}
                                        placeholder="—"
                                        className={`w-20 text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 transition-colors ${
                                          isOverMax
                                            ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400'
                                            : cell?.dirty
                                            ? 'border-amber-400 bg-amber-50 focus:ring-[#C90031]'
                                            : 'border-[#E5E7EB] bg-white focus:ring-[#C90031]'
                                        }`}
                                      />
                                      {isOverMax && (
                                        <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-red-500 whitespace-nowrap">
                                          exceeds max {a.max_score}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              )
                            })}

                            {/* Carry % */}
                            <td className="px-3 py-2 text-center">
                              {carry > 0 ? (
                                <span className={`font-bold text-sm ${
                                  carry >= 70 ? 'text-green-600' : carry >= 50 ? 'text-amber-600' : 'text-red-500'
                                }`}>
                                  {carry.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-[#D1D5DB] text-base">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    {/* Stats footer */}
                    <tfoot>
                      {(['avg', 'hi', 'lo'] as const).map((key, i) => (
                        <tr key={key} className={`border-t border-[#E5E7EB] ${i === 0 ? 'border-t-2' : ''} bg-[#F9FAFB]`}>
                          <td className="sticky left-0 bg-[#F9FAFB] px-4 py-1.5 border-r border-[#E5E7EB] text-xs font-semibold text-[#6B7280]">
                            {key === 'avg' ? 'Avg' : key === 'hi' ? 'High' : 'Low'}
                          </td>
                          {assessments.map((a) => {
                            const stats = colStats(a.id, students, grid)
                            return (
                              <td key={a.id} className="px-3 py-1.5 text-center text-xs font-medium text-[#6B7280] border-r border-[#E5E7EB]">
                                {stats[key]}
                              </td>
                            )
                          })}
                          <td className="px-3 py-1.5 text-center text-xs text-[#D1D5DB]">—</td>
                        </tr>
                      ))}
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}
