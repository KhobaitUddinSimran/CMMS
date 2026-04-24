'use client'

import { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Select } from '@/components/common/Select'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses } from '@/lib/api/courses'
import { listAssessments } from '@/lib/api/assessments'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { getCourseAllMarks, createMark, updateMark, publishMarkIds } from '@/lib/api/marks'
import { Save, CheckCircle, Grid3x3, Users, ClipboardList, Lock } from 'lucide-react'

interface CourseOption { id: string; label: string }
interface Student { id: string; email: string; full_name: string }
interface Assessment { id: string; name: string; max_score: number; weight: number; assessment_type?: string }

interface CellState {
  markId: string | null
  score: string          // string so input stays controlled
  status: 'draft' | 'published'
  dirty: boolean
}

type GridState = Record<string, Record<string, CellState>>  // [studentId][assessmentId]

export default function SmartGridPage() {
  const { addToast } = useToastStore()

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [loadingGrid, setLoadingGrid] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [grid, setGrid] = useState<GridState>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)  // assessmentId being published

  // ── Load courses ──────────────────────────────────────────────
  useEffect(() => {
    listCourses({ limit: 200 })
      .then((res) => {
        const list = res.data || (res as any)
        setCourseOptions(
          list.map((c: any) => ({
            id: c.id,
            label: `${c.code} – Sec ${c.section} (${c.year ?? c.academic_year}, Sem ${c.semester})`,
          }))
        )
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
    setGrid({})
    setStudents([])
    setAssessments([])
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

      // Build grid from existing marks
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

      setStudents(studentsData.filter((s) => s.status === 'active' || !s.status))
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
    let saved = 0
    let failed = 0
    const updatedGrid = { ...grid }

    for (const { studentId, assessmentId, cell } of dirtyCells) {
      const scoreVal = cell.score.trim() === '' ? null : parseFloat(cell.score)
      try {
        if (cell.markId) {
          const updated = await updateMark(cell.markId, { score: scoreVal as number })
          updatedGrid[studentId] = {
            ...updatedGrid[studentId],
            [assessmentId]: { ...cell, score: updated.score != null ? String(updated.score) : '', dirty: false },
          }
        } else {
          const created = await createMark({
            student_id: studentId,
            course_id: selectedCourseId,
            assessment_id: assessmentId,
            score: scoreVal,
          })
          updatedGrid[studentId] = {
            ...updatedGrid[studentId],
            [assessmentId]: { markId: created.id, score: created.score != null ? String(created.score) : '', status: 'draft', dirty: false },
          }
        }
        saved++
      } catch {
        failed++
      }
    }

    setGrid(updatedGrid)
    setSaving(false)
    if (failed === 0) addToast(`Saved ${saved} mark${saved !== 1 ? 's' : ''}`, 'success')
    else addToast(`Saved ${saved}, failed ${failed}`, 'error')
  }

  // ── Publish assessment column ─────────────────────────────────
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
          if (cell?.markId && draftIds.includes(cell.markId)) {
            next[s.id] = { ...next[s.id], [assessmentId]: { ...cell, status: 'published' } }
          }
        }
        return next
      })
      addToast(res.message || `Published ${draftIds.length} marks`, 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to publish', 'error')
    } finally {
      setPublishing(null)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────
  const draftCount = Object.values(grid).flatMap(Object.values).filter((c) => c.markId && c.status === 'draft').length
  const publishedCount = Object.values(grid).flatMap(Object.values).filter((c) => c.status === 'published').length
  const dirtyCount = Object.values(grid).flatMap(Object.values).filter((c) => c.dirty).length

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

        {/* No course selected */}
        {!selectedCourseId && !loadingCourses && (
          <Card>
            <div className="text-center py-12">
              <Grid3x3 className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-medium text-[#6B7280]">Select a course above to open its grade grid</p>
            </div>
          </Card>
        )}

        {/* Loading grid */}
        {selectedCourseId && loadingGrid && (
          <Card><div className="flex items-center justify-center py-16"><Spinner /></div></Card>
        )}

        {/* Grid */}
        {selectedCourseId && !loadingGrid && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Students', value: students.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
                { label: 'Assessments', value: assessments.length, icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
                { label: 'Draft Marks', value: draftCount, icon: Grid3x3, color: 'bg-amber-50 text-amber-600' },
                { label: 'Published', value: publishedCount, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
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
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <p className="text-sm text-[#6B7280]">
                    {dirtyCount > 0
                      ? <span className="text-amber-600 font-medium">{dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}</span>
                      : 'All changes saved'}
                  </p>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving || dirtyCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#a8002a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? <Spinner /> : <Save className="w-4 h-4" />}
                    Save All Changes
                  </button>
                </div>

                {/* Scrollable grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <th className="sticky left-0 z-10 bg-[#F9FAFB] text-left px-4 py-3 font-semibold text-[#374151] min-w-[180px] border-r border-[#E5E7EB]">
                          Student
                        </th>
                        {assessments.map((a) => {
                          const allPublished = students.every(
                            (s) => grid[s.id]?.[a.id]?.status === 'published'
                          )
                          const hasDraft = students.some(
                            (s) => grid[s.id]?.[a.id]?.markId && grid[s.id]?.[a.id]?.status === 'draft'
                          )
                          return (
                            <th key={a.id} className="px-3 py-3 text-center min-w-[140px] border-r border-[#E5E7EB] last:border-r-0">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold text-[#374151]">{a.name}</span>
                                <span className="text-[10px] text-[#9CA3AF]">
                                  Max {a.max_score} · {a.weight}%
                                </span>
                                {allPublished ? (
                                  <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                    <CheckCircle className="w-3 h-3" /> Published
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handlePublish(a.id)}
                                    disabled={!!publishing || !hasDraft}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-[10px] font-medium transition-colors"
                                  >
                                    {publishing === a.id ? <Spinner /> : <Lock className="w-2.5 h-2.5" />}
                                    Publish
                                  </button>
                                )}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, si) => (
                        <tr
                          key={student.id}
                          className={`border-b border-[#E5E7EB] last:border-0 ${si % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                        >
                          <td className="sticky left-0 z-10 px-4 py-2.5 border-r border-[#E5E7EB] bg-inherit">
                            <p className="font-medium text-[#111827] truncate max-w-[160px]">
                              {student.full_name || student.email}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] truncate">{student.email}</p>
                          </td>
                          {assessments.map((a) => {
                            const cell = grid[student.id]?.[a.id]
                            const isPublished = cell?.status === 'published'
                            return (
                              <td key={a.id} className="px-3 py-2 text-center border-r border-[#E5E7EB] last:border-r-0">
                                {isPublished ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-green-700">
                                      {cell.score !== '' ? cell.score : '—'}
                                    </span>
                                    <span className="text-[10px] text-green-500">published</span>
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min={0}
                                    max={a.max_score}
                                    step="0.5"
                                    value={cell?.score ?? ''}
                                    onChange={(e) => handleCellChange(student.id, a.id, e.target.value)}
                                    placeholder="—"
                                    className={`w-20 text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#C90031] ${
                                      cell?.dirty ? 'border-amber-400 bg-amber-50' : 'border-[#E5E7EB] bg-white'
                                    }`}
                                  />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
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
