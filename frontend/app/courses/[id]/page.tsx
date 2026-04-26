'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToastStore } from '@/stores/toastStore'
import { getCourse } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'
import { listAssessments } from '@/lib/api/assessments'
import { getCourseAllMarks, getStudentMarksSummary } from '@/lib/api/marks'
import {
  ArrowLeft,
  Users,
  ClipboardList,
  Grid3x3,
  Upload,
  Settings,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseInfo {
  id: string
  code: string
  name?: string
  section?: string
  semester?: number | string
  academic_year?: string
  credits?: number
  lecturer_id?: string
  lecturer_name?: string
}

interface Student {
  id: string
  email: string
  full_name: string
  status: string
}

interface Assessment {
  id: string
  name: string
  type?: string
  max_score: number
  weight_percentage?: number
  weight?: number
  is_locked?: boolean
}

interface MarkEntry {
  id: string
  student_id: string
  assessment_id: string
  score?: number | null
  raw_score?: number | null
  status: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft:     'bg-yellow-100 text-yellow-800',
  delayed:   'bg-orange-100 text-orange-800',
  flagged:   'bg-red-100 text-red-800',
}

function MarkStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function StatCard({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <p className="text-xs text-[#6B7280] font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Lecturer / Coordinator View ──────────────────────────────────────────────

function LecturerView({
  course,
  students,
  assessments,
  marks,
  loading,
  onRefresh,
}: {
  course: CourseInfo
  students: Student[]
  assessments: Assessment[]
  marks: MarkEntry[]
  loading: boolean
  onRefresh: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'students' | 'assessments'>('overview')

  const activeStudents = students.filter((s) => s.status === 'active' || !s.status)
  const totalCells = activeStudents.length * assessments.length

  const markScore = (m: MarkEntry) => m.raw_score ?? m.score ?? null

  const enteredCells = marks.filter((m) => markScore(m) != null).length
  const publishedCells = marks.filter((m) => m.status === 'published').length
  const progress = totalCells > 0 ? Math.round((enteredCells / totalCells) * 100) : 0

  const studentCarry = (studentId: string) => {
    let total = 0
    for (const a of assessments) {
      const m = marks.find((mk) => mk.student_id === studentId && mk.assessment_id === a.id)
      const weight = a.weight_percentage ?? a.weight ?? 0
      const sc = m ? markScore(m) : null
      if (sc != null && m!.status === 'published') {
        total += (sc / a.max_score) * weight
      }
    }
    return total.toFixed(1)
  }

  const TABS = [
    { key: 'overview', label: 'Overview', Icon: BookOpen },
    { key: 'students', label: `Students (${activeStudents.length})`, Icon: Users },
    { key: 'assessments', label: `Assessments (${assessments.length})`, Icon: ClipboardList },
  ] as const

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#C90031]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#C90031]">{course.code}</p>
              <h1 className="text-xl font-bold text-[#111827] mt-0.5">
                {course.name ?? course.code}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#6B7280]">
                {course.section && <span>Section {course.section}</span>}
                {course.semester && <span>Sem {course.semester}</span>}
                {course.academic_year && <span>{course.academic_year}</span>}
                {course.credits && <span>{course.credits} Credits</span>}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/smart-grid?course=${course.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Grid3x3 className="w-4 h-4" />
              Smart Grid
            </button>
            <button
              onClick={() => router.push(`/roster?course=${course.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Roster
            </button>
            <button
              onClick={() => router.push('/assessment-setup')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Assessments
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Enrolled Students" value={activeStudents.length} />
                <StatCard label="Assessments" value={assessments.length} />
                <StatCard
                  label="Marks Entered"
                  value={`${enteredCells} / ${totalCells}`}
                  sub={`${progress}% complete`}
                  color={progress === 100 ? 'text-green-600' : 'text-[#111827]'}
                />
                <StatCard
                  label="Published Marks"
                  value={publishedCells}
                  sub={`of ${totalCells} total`}
                  color="text-blue-600"
                />
              </div>

              {/* Progress Bar */}
              {totalCells > 0 && (
                <Card>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#111827]">Marks Entry Progress</span>
                      <span className="text-[#6B7280]">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C90031] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Published: {publishedCells}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                        Draft: {marks.filter((m) => m.status === 'draft' && markScore(m) != null).length}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                        Missing: {totalCells - enteredCells}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Assessment Summary */}
              {assessments.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-[#111827] mb-3">Assessment Breakdown</h3>
                  <div className="divide-y divide-[#E5E7EB]">
                    {assessments.map((a) => {
                      const aMarks = marks.filter((m) => m.assessment_id === a.id && markScore(m) != null)
                      const published = aMarks.filter((m) => m.status === 'published').length
                      const w = a.weight_percentage ?? a.weight ?? 0
                      return (
                        <div key={a.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#111827]">{a.name}</p>
                            <p className="text-xs text-[#6B7280]">
                              {a.type} · Max {a.max_score} pts · {w}% weight
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#111827]">
                              {published}/{activeStudents.length} published
                            </p>
                            {a.is_locked && (
                              <span className="text-xs text-orange-600 font-medium">Schema Locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── Students Tab ── */}
          {tab === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B7280]">{activeStudents.length} student{activeStudents.length !== 1 ? 's' : ''} enrolled</p>
                <button
                  onClick={() => router.push('/roster')}
                  className="flex items-center gap-1.5 text-sm text-[#C90031] font-medium hover:underline"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Roster
                </button>
              </div>
              {activeStudents.length === 0 ? (
                <Card>
                  <div className="text-center py-14 text-[#6B7280]">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No students enrolled yet</p>
                    <p className="text-sm mt-1">Upload an Excel roster to enroll students</p>
                    <button
                      onClick={() => router.push('/roster')}
                      className="mt-4 text-sm text-[#C90031] font-medium hover:underline"
                    >Upload Roster →</button>
                  </div>
                </Card>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                          <th className="text-left px-4 py-3 font-semibold text-[#374151] sticky left-0 bg-[#F9FAFB]">#</th>
                          <th className="text-left px-4 py-3 font-semibold text-[#374151] min-w-[180px] sticky left-8 bg-[#F9FAFB]">Student</th>
                          {assessments.map(a => (
                            <th key={a.id} className="text-center px-3 py-3 font-semibold text-[#374151] min-w-[90px]">
                              <div>{a.name}</div>
                              <div className="text-xs font-normal text-[#6B7280]">{a.weight_percentage ?? a.weight ?? 0}% · /{a.max_score}</div>
                            </th>
                          ))}
                          <th className="text-center px-4 py-3 font-semibold text-[#C90031] min-w-[100px]">Carry %</th>
                          <th className="text-center px-4 py-3 font-semibold text-[#374151] w-10">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {activeStudents.map((s, i) => {
                          const carry = parseFloat(studentCarry(s.id))
                          const studentMarks = marks.filter((m) => m.student_id === s.id)
                          const allPublished = assessments.length > 0 &&
                            studentMarks.length === assessments.length &&
                            studentMarks.every((m) => m.status === 'published')
                          return (
                            <tr key={s.id} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="px-4 py-3 text-[#6B7280] sticky left-0 bg-white">{i + 1}</td>
                              <td className="px-4 py-3 sticky left-8 bg-white">
                                <div className="font-medium text-[#111827]">{s.full_name || '—'}</div>
                                <div className="text-xs text-[#6B7280]">{s.email}</div>
                              </td>
                              {assessments.map(a => {
                                const m = marks.find(mk => mk.student_id === s.id && mk.assessment_id === a.id)
                                const sc = m ? markScore(m) : null
                                return (
                                  <td key={a.id} className="px-3 py-3 text-center">
                                    {sc != null ? (
                                      <div>
                                        <span className={`font-semibold ${
                                          m!.status === 'published' ? 'text-[#111827]' : 'text-[#6B7280]'
                                        }`}>{sc}<span className="text-xs text-[#9CA3AF]">/{a.max_score}</span></span>
                                        <div className="text-xs mt-0.5">
                                          <MarkStatusBadge status={m!.status} />
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[#D1D5DB] text-lg">—</span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-4 py-3 text-center">
                                <span className={`font-bold text-base ${
                                  carry >= 70 ? 'text-green-600' :
                                  carry >= 50 ? 'text-yellow-600' :
                                  carry > 0   ? 'text-red-600'   : 'text-[#9CA3AF]'
                                }`}>{carry > 0 ? `${carry}%` : '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {allPublished
                                  ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                  : <Clock className="w-4 h-4 text-yellow-400 mx-auto" />}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Assessments Tab ── */}
          {tab === 'assessments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B7280]">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''} · total weight {assessments.reduce((s, a) => s + (a.weight_percentage ?? a.weight ?? 0), 0)}%</p>
                <button
                  onClick={() => router.push('/assessment-setup')}
                  className="flex items-center gap-1.5 text-sm text-[#C90031] font-medium hover:underline"
                >
                  <Settings className="w-3.5 h-3.5" /> Manage
                </button>
              </div>
              {assessments.length === 0 ? (
                <Card>
                  <div className="text-center py-14 text-[#6B7280]">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No assessments configured yet</p>
                    <button onClick={() => router.push('/assessment-setup')}
                      className="mt-3 text-sm text-[#C90031] font-medium hover:underline">
                      Setup Assessments →
                    </button>
                  </div>
                </Card>
              ) : (
                assessments.map((a) => {
                  const aMarks = marks.filter((m) => m.assessment_id === a.id && markScore(m) != null)
                  const published = aMarks.filter((m) => m.status === 'published').length
                  const w = a.weight_percentage ?? a.weight ?? 0
                  const scores = aMarks.map(m => markScore(m) as number)
                  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'
                  const hi  = scores.length > 0 ? Math.max(...scores) : '—'
                  const lo  = scores.length > 0 ? Math.min(...scores) : '—'
                  const TYPE_COLOR: Record<string, string> = {
                    exam: 'bg-red-100 text-red-700', quiz: 'bg-blue-100 text-blue-700',
                    assignment: 'bg-green-100 text-green-700', project: 'bg-purple-100 text-purple-700',
                    test: 'bg-orange-100 text-orange-700',
                  }
                  return (
                    <Card key={a.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#111827]">{a.name}</h3>
                            {a.type && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[a.type] ?? 'bg-gray-100 text-gray-600'}`}>{a.type}</span>}
                            {a.is_locked && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">🔒 Locked</span>}
                          </div>
                          <p className="text-sm text-[#6B7280] mt-1">Max score: {a.max_score} pts</p>
                          {/* Weight bar */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#C90031] rounded-full" style={{ width: `${Math.min(w, 100)}%` }} />
                            </div>
                            <span className="text-sm font-bold text-[#C90031] w-12 text-right">{w}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-5 gap-3 text-center">
                        {[
                          { label: 'Entered', val: `${aMarks.length}/${activeStudents.length}`, color: '' },
                          { label: 'Published', val: `${published}`, color: 'text-green-600' },
                          { label: 'Avg', val: avg, color: '' },
                          { label: 'Highest', val: hi, color: 'text-blue-600' },
                          { label: 'Lowest', val: lo, color: 'text-red-500' },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="bg-[#F9FAFB] rounded-lg p-2">
                            <p className="text-xs text-[#6B7280]">{label}</p>
                            <p className={`font-bold mt-0.5 ${color}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Student View ─────────────────────────────────────────────────────────────

function StudentView({
  course,
  summary,
  loading,
}: {
  course: CourseInfo
  summary: {
    assessment_name: string
    assessment_type: string
    score: number
    max_score: number
    weight_percentage: number
    weighted_contribution: number
  }[]
  loading: boolean
}) {
  const carryTotal = summary.reduce((acc, m) => acc + m.weighted_contribution, 0).toFixed(1)
  const maxPossible = summary.reduce((acc, m) => acc + m.weight_percentage, 0)

  const getGradeBand = (pct: number) => {
    if (pct >= 90) return { label: 'A+', color: 'text-green-600' }
    if (pct >= 80) return { label: 'A',  color: 'text-green-600' }
    if (pct >= 70) return { label: 'B',  color: 'text-blue-600' }
    if (pct >= 60) return { label: 'C',  color: 'text-yellow-600' }
    if (pct >= 50) return { label: 'D',  color: 'text-orange-500' }
    return { label: 'F', color: 'text-red-600' }
  }

  const pct = maxPossible > 0 ? (parseFloat(carryTotal) / maxPossible) * 100 : 0
  const grade = getGradeBand(pct)

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-[#C90031]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#C90031]">{course.code}</p>
            <h1 className="text-xl font-bold text-[#111827] mt-0.5">{course.name ?? course.code}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-[#6B7280]">
              {course.section && <span>Section {course.section}</span>}
              {course.semester && <span>Sem {course.semester}</span>}
              {course.academic_year && <span>{course.academic_year}</span>}
              {course.credits && <span>{course.credits} Credits</span>}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : summary.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-[#6B7280]">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No published marks available yet.</p>
            <p className="text-sm mt-1">Check back once your lecturer publishes results.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Carry Total Banner */}
          <div className="bg-gradient-to-r from-[#C90031] to-[#9b0025] rounded-2xl p-6 text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Current Carry Total</p>
              <p className="text-4xl font-bold mt-1">{carryTotal}%</p>
              <p className="text-sm opacity-70 mt-1">of {maxPossible}% assessed so far</p>
            </div>
            <div className="text-center">
              <p className={`text-5xl font-black ${grade.color === 'text-green-600' ? 'text-green-300' : 'text-yellow-300'}`}>
                {grade.label}
              </p>
              <p className="text-xs opacity-70 mt-1">Grade Band</p>
            </div>
          </div>

          {/* Marks Breakdown */}
          <div className="space-y-3">
            <h2 className="font-semibold text-[#111827]">Marks Breakdown</h2>
            {summary.map((m, i) => {
              const scorePct = m.max_score > 0 ? (m.score / m.max_score) * 100 : 0
              return (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#111827] text-sm">{m.assessment_name}</p>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">
                          {m.assessment_type}
                        </span>
                        <MarkStatusBadge status="published" />
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Weight: {m.weight_percentage}% of total
                      </p>

                      {/* Score bar */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-[#6B7280]">
                          <span>{m.score} / {m.max_score} pts</span>
                          <span>{scorePct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scorePct >= 70 ? 'bg-green-500' : scorePct >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-[#111827]">+{m.weighted_contribution.toFixed(1)}%</p>
                      <p className="text-xs text-[#6B7280]">Contribution</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Progress Bar */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#111827]">Overall Progress</p>
              <p className="text-sm text-[#6B7280]">{maxPossible}% of course assessed</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C90031] rounded-full"
                style={{ width: `${Math.min(maxPossible, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Remaining {Math.max(0, 100 - maxPossible)}% not yet published
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [marks, setMarks] = useState<MarkEntry[]>([])
  const [studentSummary, setStudentSummary] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  const role = user?.role
  const isStaff = role === 'lecturer' || role === 'coordinator' || role === 'admin' || role === 'hod'
  const isStudent = role === 'student'

  const loadCourse = useCallback(async () => {
    try {
      const data = await getCourse(courseId)
      setCourse(data)
    } catch {
      addToast('Course not found', 'error')
      router.push('/courses')
    } finally {
      setPageLoading(false)
    }
  }, [courseId, addToast, router])

  const loadStaffData = useCallback(async () => {
    setDataLoading(true)
    const [studentsRes, assessmentsRes, marksRes] = await Promise.allSettled([
      getEnrolledStudents(courseId),
      listAssessments(courseId),
      getCourseAllMarks(courseId),
    ])
    if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value)
    else addToast('Could not load student list', 'error')
    if (assessmentsRes.status === 'fulfilled')
      setAssessments(Array.isArray(assessmentsRes.value) ? assessmentsRes.value : (assessmentsRes.value as any).data || [])
    if (marksRes.status === 'fulfilled') setMarks(marksRes.value)
    setDataLoading(false)
  }, [courseId, addToast])

  const loadStudentData = useCallback(async () => {
    if (!user?.id) return
    setDataLoading(true)
    try {
      const summaries = await getStudentMarksSummary(user.id)
      const courseSummary = summaries.find((s: any) => s.course_id === courseId)
      setStudentSummary(courseSummary?.marks ?? [])
    } catch {
      addToast('Failed to load your marks', 'error')
    } finally {
      setDataLoading(false)
    }
  }, [courseId, user?.id, addToast])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  useEffect(() => {
    if (!course || !user) return
    if (isStaff) loadStaffData()
    else if (isStudent) loadStudentData()
  }, [course, user, isStaff, isStudent, loadStaffData, loadStudentData])

  // Auto-refresh when the tab regains visibility (e.g. user returns from Smart Grid)
  useEffect(() => {
    if (!course || !user) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        if (isStaff) loadStaffData()
        else if (isStudent) loadStudentData()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [course, user, isStaff, isStudent, loadStaffData, loadStudentData])

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </MainLayout>
    )
  }

  if (!course) return null

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back button + breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center gap-1 hover:text-[#111827] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Courses
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#111827] font-medium">{course.code}</span>
        </div>


        {isStaff && (
          <LecturerView
            course={course}
            students={students}
            assessments={assessments}
            marks={marks}
            loading={dataLoading}
            onRefresh={loadStaffData}
          />
        )}

        {isStudent && (
          <StudentView
            course={course}
            summary={studentSummary}
            loading={dataLoading}
          />
        )}
      </div>
    </MainLayout>
  )
}
