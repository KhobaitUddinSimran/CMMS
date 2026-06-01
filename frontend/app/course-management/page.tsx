'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses, assignLecturer, getLecturerWorkloads, createCourse } from '@/lib/api/courses'
import { listLecturers } from '@/lib/api/courses'
import { updateTeachingCredits } from '@/lib/api/users'
import { downloadTeachingLoad } from '@/lib/utils/teachingLoadExcel'
import {
  listTimelines, upsertTimeline, deleteTimeline,
  getSemesterCourses, setSemesterCourses, sendDeadlineReminders,
  type SemesterTimeline, type SemesterTimelineInput,
} from '@/lib/api/semester'
import { SemesterCalendar } from '@/components/semester/SemesterCalendar'
import {
  BookOpen, Users, ChevronLeft, RefreshCw,
  AlertTriangle, Search, Filter, UserCheck, UserX, Library,
  Pencil, Check, X, FileDown, CalendarDays, Settings2, LayoutList,
  Save, Plus, Trash2, CheckSquare, Square, Bell,
} from 'lucide-react'
import { CurriculumLibrary } from '@/components/course-management/CurriculumLibrary'
import { type CurriculumCourse } from '@/lib/data/mjiit-curriculum'

const DEFAULT_MAX_CREDITS = 9

const EMPTY_TIMELINE_FORM: SemesterTimelineInput = {
  academic_year: '', semester: 1, start_date: '', end_date: '',
  grade_submission_deadline: '', notes: '',
}

type ActiveTab = 'distribute' | 'setup' | 'calendar'

/**
 * Derive the academic_year a course belongs to given a cohort intake year and
 * the course's program-year (1–4). Year-1 courses run in the intake year's
 * own session; Year-2 courses run intake+1, etc.
 * Example: intake "2025/2026", programYear=3 → "2027/2028".
 */
function sessionFromIntake(intakeYear: string, programYear: number): string {
  const m = intakeYear.match(/^(\d{4})\/(\d{4})$/)
  if (!m) return intakeYear
  const startYear = parseInt(m[1], 10) + (programYear - 1)
  return `${startYear}/${startYear + 1}`
}

/** Generate a sensible list of intake years around the current AY. */
function generateIntakeYears(): string[] {
  const now = new Date()
  const baseYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const years: string[] = []
  for (let offset = -3; offset <= 1; offset++) {
    const y = baseYear + offset
    years.push(`${y}/${y + 1}`)
  }
  return years
}

interface CourseRow {
  id: string
  code: string
  name?: string
  section: string
  semester: string
  academic_year?: string
  credits?: number
  lecturer_id?: string
  lecturer_name?: string
}

interface LecturerOption {
  id: string
  email: string
  full_name: string
  used_credits: number
  max_credits: number
  remaining_credits: number
  is_full: boolean
}

export default function CourseManagementPage() {
  const router = useRouter()
  const { addToast } = useToastStore()

  // ── existing state ────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [lecturers, setLecturers] = useState<LecturerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterUnassigned, setFilterUnassigned] = useState(false)
  const [curriculumOpen, setCurriculumOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<string | null>(null)
  const [editCreditsValue, setEditCreditsValue] = useState<string>('')
  const [savingCredits, setSavingCredits] = useState(false)
  const [downloadingLoad, setDownloadingLoad] = useState(false)
  const intakeYearOptions = useMemo(generateIntakeYears, [])
  const [intakeYear, setIntakeYear] = useState<string>(() => {
    const opts = generateIntakeYears()
    return opts[opts.length - 2] || opts[0]
  })

  // ── new: tabs + timeline + selection ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('distribute')
  const [timelines, setTimelines] = useState<SemesterTimeline[]>([])
  const [activeSemester, setActiveSemester] = useState<SemesterTimeline | null>(null)
  const [loadingTimelines, setLoadingTimelines] = useState(true)
  const [timelineForm, setTimelineForm] = useState<SemesterTimelineInput>(EMPTY_TIMELINE_FORM)
  const [savingTimeline, setSavingTimeline] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [loadingSelection, setLoadingSelection] = useState(false)
  const [savingSelection, setSavingSelection] = useState(false)
  const [selectionSaved, setSelectionSaved] = useState(false)
  const [courseSearchSetup, setCourseSearchSetup] = useState('')

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => { const y = currentYear - 1 + i; return `${y}/${y + 1}` }),
    [currentYear]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [courseRes, workloadRes, staffRes] = await Promise.allSettled([
        listCourses({ limit: 500 }),
        getLecturerWorkloads(),
        listLecturers(),
      ])

      let workloadMap: Record<string, LecturerOption> = {}

      if (staffRes.status === 'fulfilled') {
        for (const s of staffRes.value) {
          workloadMap[s.id] = {
            id: s.id,
            email: s.email,
            full_name: s.full_name || s.email,
            used_credits: 0,
            max_credits: DEFAULT_MAX_CREDITS,
            remaining_credits: DEFAULT_MAX_CREDITS,
            is_full: false,
          }
        }
      }

      if (workloadRes.status === 'fulfilled') {
        for (const w of workloadRes.value as any[]) {
          workloadMap[w.lecturer_id] = {
            id: w.lecturer_id,
            email: workloadMap[w.lecturer_id]?.email ?? '',
            full_name: w.full_name,
            used_credits: w.used_credits,
            max_credits: w.max_credits ?? DEFAULT_MAX_CREDITS,
            remaining_credits: w.remaining_credits,
            is_full: w.is_full,
          }
        }
      }

      setLecturers(Object.values(workloadMap).sort((a, b) => a.full_name.localeCompare(b.full_name)))

      if (courseRes.status === 'fulfilled') {
        const raw: CourseRow[] = (courseRes.value.data || (courseRes.value as any))
        const nameMap: Record<string, string> = {}
        for (const l of Object.values(workloadMap)) nameMap[l.id] = l.full_name
        setCourses(raw.map(c => ({
          ...c,
          lecturer_name: c.lecturer_name || (c.lecturer_id ? nameMap[c.lecturer_id] : undefined),
        })))
      }
    } catch {
      addToast('Failed to load course data', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  // ── timeline functions ────────────────────────────────────────────────────
  const loadTimelines = useCallback(async () => {
    setLoadingTimelines(true)
    try {
      const data = await listTimelines()
      setTimelines(data)
    } catch {
      addToast('Failed to load timelines', 'error')
    } finally {
      setLoadingTimelines(false)
    }
  }, [addToast])

  useEffect(() => { loadTimelines() }, [loadTimelines])

  // Pre-populate timeline form whenever activeSemester object changes (same or different ID)
  useEffect(() => {
    if (!activeSemester) {
      setTimelineForm(EMPTY_TIMELINE_FORM)
      return
    }
    setTimelineForm({
      academic_year: activeSemester.academic_year,
      semester: activeSemester.semester,
      start_date: activeSemester.start_date,
      end_date: activeSemester.end_date,
      grade_submission_deadline: activeSemester.grade_submission_deadline || '',
      notes: activeSemester.notes || '',
    })
  }, [activeSemester])

  // Reload course selections ONLY when the semester ID actually changes (not on every object update)
  const activeSemesterId = activeSemester?.id ?? null
  useEffect(() => {
    if (!activeSemesterId) {
      setSelectedCourseIds(new Set())
      return
    }
    setLoadingSelection(true)
    getSemesterCourses(activeSemesterId)
      .then(ids => setSelectedCourseIds(new Set(ids)))
      .catch(() => addToast('Failed to load course selection', 'error'))
      .finally(() => setLoadingSelection(false))
  }, [activeSemesterId, addToast])

  const handleSaveTimeline = async () => {
    if (!timelineForm.academic_year || !timelineForm.semester || !timelineForm.start_date || !timelineForm.end_date) {
      addToast('Academic year, semester, start and end dates are required', 'error')
      return
    }
    setSavingTimeline(true)
    try {
      const saved = await upsertTimeline(timelineForm)
      addToast('Timeline saved', 'success')
      await loadTimelines()
      // Update activeSemester to the newly saved record
      setActiveSemester(saved)
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to save timeline', 'error')
    } finally {
      setSavingTimeline(false)
    }
  }

  const handleDeleteTimeline = async (id: string) => {
    if (!window.confirm('Delete this semester timeline? This cannot be undone.')) return
    try {
      await deleteTimeline(id)
      addToast('Timeline deleted', 'success')
      if (activeSemester?.id === id) setActiveSemester(null)
      setTimelines(t => t.filter(x => x.id !== id))
    } catch {
      addToast('Failed to delete timeline', 'error')
    }
  }

  const handleSendReminders = async () => {
    if (!activeSemester) return
    setSendingReminders(true)
    try {
      const result = await sendDeadlineReminders(activeSemester.id)
      addToast(result.message || `Reminders sent to ${result.sent} lecturer(s)`, 'success')
    } catch (e: any) {
      addToast(e?.response?.data?.detail || 'Failed to send reminders', 'error')
    } finally {
      setSendingReminders(false)
    }
  }

  const handleSaveSelection = async () => {
    if (!activeSemester) return
    setSavingSelection(true)
    setSelectionSaved(false)
    try {
      await setSemesterCourses(activeSemester.id, Array.from(selectedCourseIds))
      setSelectionSaved(true)
      setTimeout(() => setSelectionSaved(false), 4000)
    } catch {
      addToast('Failed to save course selection', 'error')
    } finally {
      setSavingSelection(false)
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const handleAddFromCurriculum = async (course: CurriculumCourse) => {
    try {
      await createCourse({
        code: course.code,
        name: course.name,
        section: '01',
        year: sessionFromIntake(intakeYear, course.programYear),
        semester: String(course.programSemester),
        credits: course.credits,
      })
      addToast(`${course.code} added to system`, 'success')
      loadData()
    } catch (e: any) {
      addToast(e?.response?.data?.detail || `Failed to add ${course.code}`, 'error')
    }
  }

  const handleAddAllMissing = async (missing: CurriculumCourse[]) => {
    let ok = 0
    let fail = 0
    // Small chunks to avoid hammering the backend
    for (const course of missing) {
      try {
        await createCourse({
          code: course.code,
          name: course.name,
          section: '01',
          year: sessionFromIntake(intakeYear, course.programYear),
          semester: String(course.programSemester),
          credits: course.credits,
        })
        ok++
      } catch {
        fail++
      }
    }
    addToast(
      fail === 0
        ? `Added ${ok} curriculum subject${ok === 1 ? '' : 's'}`
        : `Added ${ok}, ${fail} failed`,
      fail === 0 ? 'success' : 'error'
    )
    loadData()
  }

  const handleSetCredits = async (lecturerId: string) => {
    const parsed = editCreditsValue.trim() === '' ? null : parseInt(editCreditsValue, 10)
    if (parsed !== null && (isNaN(parsed) || parsed < 1)) {
      addToast('Enter a valid credit number (min 1) or leave blank for no limit', 'error')
      return
    }
    setSavingCredits(true)
    try {
      await updateTeachingCredits(lecturerId, parsed)
      setLecturers(prev => prev.map(l =>
        l.id === lecturerId
          ? { ...l, max_credits: parsed ?? DEFAULT_MAX_CREDITS, remaining_credits: Math.max(0, (parsed ?? DEFAULT_MAX_CREDITS) - l.used_credits), is_full: parsed !== null && l.used_credits >= parsed }
          : l
      ))
      addToast(parsed === null ? 'Credit limit removed (no limit)' : `Credit limit set to ${parsed} cr`, 'success')
      setEditingLecturer(null)
    } catch (e: any) {
      addToast(e?.response?.data?.detail || 'Failed to update credit limit', 'error')
    } finally {
      setSavingCredits(false)
    }
  }

  const handleAssign = async (courseId: string, lecturerId: string) => {
    const isUnassign = !lecturerId
    setAssigning(courseId)
    try {
      await assignLecturer(courseId, lecturerId)
      const lect = lecturers.find(l => l.id === lecturerId)
      setCourses(prev => prev.map(c =>
        c.id === courseId
          ? { ...c, lecturer_id: isUnassign ? undefined : lecturerId, lecturer_name: isUnassign ? undefined : lect?.full_name }
          : c
      ))
      addToast(isUnassign ? 'Lecturer unassigned' : 'Lecturer assigned', 'success')
      loadData()
    } catch (e: any) {
      addToast(e?.response?.data?.detail || (isUnassign ? 'Failed to unassign lecturer' : 'Failed to assign lecturer'), 'error')
    } finally {
      setAssigning(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses.filter(c => {
      if (activeSemester && selectedCourseIds.size > 0 && !selectedCourseIds.has(c.id)) return false
      if (activeSemester && selectedCourseIds.size === 0 && !loadingSelection) return false
      const matchSearch = !q ||
        c.code.toLowerCase().includes(q) ||
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.lecturer_name ?? '').toLowerCase().includes(q)
      const matchUnassigned = !filterUnassigned || !c.lecturer_name
      return matchSearch && matchUnassigned
    })
  }, [courses, search, filterUnassigned, activeSemester, selectedCourseIds, loadingSelection])

  const setupFilteredCourses = useMemo(() => {
    const q = courseSearchSetup.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(c =>
      c.code.toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q)
    )
  }, [courses, courseSearchSetup])

  const existingCodes = useMemo(
    () => new Set(courses.map(c => c.code.toUpperCase())),
    [courses]
  )

  const overloadedCount = useMemo(() => lecturers.filter(l => l.is_full).length, [lecturers])

  return (
    <MainLayout>
    <div className="space-y-0 max-w-7xl mx-auto">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="pt-4 pb-3 flex items-center gap-3 border-b border-[#E5E7EB] mb-0">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[26px] font-bold text-[#111827]">Teaching Course Management</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">Assign lecturers · Setup semester timeline · Select offered courses</p>
        </div>

        {/* Active semester selector */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#6B7280] shrink-0" />
          <select
            value={activeSemester?.id ?? ''}
            onChange={e => {
              const tl = timelines.find(t => t.id === e.target.value) || null
              setActiveSemester(tl)
            }}
            className="text-[13px] border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031] min-w-[200px]"
          >
            <option value="">— All courses —</option>
            {timelines.map(tl => (
              <option key={tl.id} value={tl.id}>{tl.academic_year} Sem {tl.semester}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setCurriculumOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#C90031] hover:bg-[#A80028] text-white rounded-lg text-[13px] font-semibold transition">
          <Library className="w-4 h-4" /> Curriculum Library
        </button>
        <button
          onClick={async () => {
            setDownloadingLoad(true)
            try {
              const workloads = await getLecturerWorkloads()
              await downloadTeachingLoad(activeSemester ? filtered : courses, workloads)
            } catch { addToast('Failed to generate export', 'error') }
            finally { setDownloadingLoad(false) }
          }}
          disabled={loading || courses.length === 0 || downloadingLoad}
          className="flex items-center gap-2 px-3 py-2 bg-[#166534] hover:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition"
        >
          {downloadingLoad ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</> : <><FileDown className="w-4 h-4" />Export Excel</>}
        </button>
        <button onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-gray-50 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
        {([
          { id: 'distribute', label: 'Distribute Lecturers', Icon: LayoutList },
          { id: 'setup',      label: 'Setup Timeline & Courses', Icon: Settings2 },
          { id: 'calendar',   label: 'Calendar View', Icon: CalendarDays },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-[#C90031] text-[#C90031]'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="pt-5 space-y-5">

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — DISTRIBUTE LECTURERS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'distribute' && (
        <>
          {/* Active semester banner */}
          {activeSemester && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[13px] text-blue-800">
              <CalendarDays className="w-4 h-4 shrink-0" />
              Showing courses selected for <strong>{activeSemester.academic_year} — Semester {activeSemester.semester}</strong>.
              {selectedCourseIds.size === 0 && !loadingSelection && (
                <span className="ml-1 text-amber-700"> No courses selected yet — go to Setup tab to choose courses.</span>
              )}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Courses', value: activeSemester ? filtered.length : courses.length, icon: BookOpen, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]' },
              { label: 'Assigned',      value: filtered.filter(c => c.lecturer_name).length,       icon: UserCheck,     bg: 'bg-[#ECFDF5]', color: 'text-[#10B981]' },
              { label: 'Unassigned',    value: filtered.filter(c => !c.lecturer_name).length,      icon: UserX,         bg: 'bg-[#FEF3C7]', color: 'text-[#F59E0B]' },
              { label: 'Full Workload', value: overloadedCount,                                    icon: AlertTriangle, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]' },
            ].map(stat => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">{stat.label}</p>
                    {loading ? <div className="mt-2"><Spinner size="sm" /></div>
                      : <p className="text-[28px] font-bold text-[#111827] mt-1">{stat.value}</p>}
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Workload bars */}
          {!loading && lecturers.length > 0 && (
            <Card>
              <h2 className="text-[15px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6B7280]" />
                Lecturer Workloads <span className="text-[12px] font-normal text-[#6B7280]">(per-lecturer cap)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lecturers.map(l => {
                  const cap = l.max_credits || DEFAULT_MAX_CREDITS
                  const pct = Math.min((l.used_credits / cap) * 100, 100)
                  const barColor = l.is_full ? 'bg-[#EF4444]' : pct >= 67 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                  return (
                    <div key={l.id} className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-[#111827] truncate max-w-[140px]">{l.full_name}</span>
                        {editingLecturer === l.id ? (
                          <div className="flex items-center gap-1">
                            <input autoFocus type="number" min={1} value={editCreditsValue}
                              onChange={e => setEditCreditsValue(e.target.value)} placeholder="no limit"
                              className="w-16 h-6 text-[12px] border border-[#C90031] rounded px-1.5 outline-none text-center"
                              onKeyDown={e => { if (e.key === 'Enter') handleSetCredits(l.id); if (e.key === 'Escape') setEditingLecturer(null) }}
                            />
                            <span className="text-[11px] text-[#6B7280]">cr</span>
                            <button onClick={() => handleSetCredits(l.id)} disabled={savingCredits}
                              className="p-0.5 rounded bg-[#C90031] text-white hover:bg-[#A80028] disabled:opacity-50"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setEditingLecturer(null)}
                              className="p-0.5 rounded border border-[#E5E7EB] text-[#6B7280] hover:bg-white"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[12px] font-bold ${l.is_full ? 'text-[#EF4444]' : 'text-[#374151]'}`}>{l.used_credits}/{cap} cr</span>
                            <button onClick={() => { setEditingLecturer(l.id); setEditCreditsValue(String(l.max_credits || '')) }}
                              className="p-0.5 rounded text-[#D1D5DB] hover:text-[#C90031]" title="Edit credit limit"><Pencil className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                      <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      {l.is_full && <p className="text-[11px] text-[#EF4444] mt-1 font-medium">Workload full</p>}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input type="text" placeholder="Search course code, name or lecturer..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]" />
            </div>
            <button onClick={() => setFilterUnassigned(!filterUnassigned)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition ${
                filterUnassigned ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]' : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" /> {filterUnassigned ? 'Show All' : 'Unassigned Only'}
            </button>
          </div>

          {/* Course table */}
          <Card>
            {loading || loadingSelection ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <p className="font-medium text-[#6B7280]">
                  {activeSemester ? 'No courses selected for this semester — go to the Setup tab.' : 'No courses match your filters'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Section</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Sem / Year</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Credits</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Assigned Lecturer</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B7280]">Assign / Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(course => {
                      const isBusy = assigning === course.id
                      return (
                        <tr key={course.id}
                          className={`border-b border-[#E5E7EB] last:border-0 transition-colors ${isBusy ? 'opacity-60' : 'hover:bg-[#F9FAFB]'}`}>
                          <td className="py-3 px-4 font-mono font-semibold text-[#C90031]">{course.code}</td>
                          <td className="py-3 px-4 text-[#111827]">{course.name || `${course.code} Sec ${course.section}`}</td>
                          <td className="py-3 px-4 text-[#6B7280]">{course.section}</td>
                          <td className="py-3 px-4 text-[#6B7280]">Sem {course.semester} / {course.academic_year ?? '—'}</td>
                          <td className="py-3 px-4 text-[#6B7280]">{course.credits ?? '—'}</td>
                          <td className="py-3 px-4">
                            {course.lecturer_name
                              ? <span className="text-[#111827] font-medium">{course.lecturer_name}</span>
                              : <span className="inline-flex items-center gap-1 text-[#F59E0B] text-[12px] font-medium"><AlertTriangle className="w-3.5 h-3.5" /> Unassigned</span>}
                          </td>
                          <td className="py-3 px-4">
                            {isBusy ? <Spinner size="sm" /> : (
                              <select
                                value={course.lecturer_id ?? ''}
                                onChange={e => handleAssign(course.id, e.target.value)}
                                className="text-[13px] border border-[#E5E7EB] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031] min-w-[160px]">
                                <option value="">— Unassign —</option>
                                {lecturers.map(l => (
                                  <option key={l.id} value={l.id} disabled={l.is_full && l.id !== course.lecturer_id}>
                                    {l.full_name} ({l.used_credits}/{l.max_credits || DEFAULT_MAX_CREDITS} cr{l.is_full ? ' FULL' : ''})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — SETUP TIMELINE & COURSES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Left: Timeline form */}
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[#111827] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#C90031]" /> Semester Timeline
            </h2>

            {/* Semester quick-select */}
            <div className="flex flex-wrap gap-2">
              {loadingTimelines ? (
                <Spinner size="sm" />
              ) : (
                <>
                  {timelines.map(tl => (
                    <span key={tl.id} className={`inline-flex items-center gap-1 rounded-lg border text-[12px] font-medium transition ${
                      activeSemester?.id === tl.id
                        ? 'bg-[#C90031] text-white border-[#C90031]'
                        : 'bg-white border-[#E5E7EB] text-[#374151]'
                    }`}>
                      <button
                        onClick={() => setActiveSemester(activeSemester?.id === tl.id ? null : tl)}
                        className="pl-3 pr-1 py-1.5 hover:opacity-80">
                        {tl.academic_year} Sem {tl.semester}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteTimeline(tl.id) }}
                        title="Delete this timeline"
                        className={`pr-2 py-1.5 hover:opacity-70 ${activeSemester?.id === tl.id ? 'text-red-200 hover:text-white' : 'text-[#9CA3AF] hover:text-red-500'}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <button onClick={() => { setActiveSemester(null); setTimelineForm(EMPTY_TIMELINE_FORM) }}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition flex items-center gap-1 ${
                      !activeSemester
                        ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                        : 'border-dashed border-[#D1D5DB] text-[#6B7280] hover:bg-gray-50'
                    }`}>
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                </>
              )}
            </div>

            <Card
              header={
                <div className={`-mx-5 -mt-4 px-4 py-2.5 rounded-t-xl text-[12px] font-semibold flex items-center gap-2 ${
                  activeSemester
                    ? 'bg-[#FFF1F2] text-[#9F1239]'
                    : 'bg-[#FFFBEB] text-[#92400E]'
                }`}>
                  {activeSemester
                    ? <><Pencil className="w-3.5 h-3.5" /> Editing: {activeSemester.academic_year} Sem {activeSemester.semester}</>
                    : <><Plus className="w-3.5 h-3.5" /> New Semester Timeline</>}
                </div>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">Academic Year *</label>
                    <select value={timelineForm.academic_year}
                      onChange={e => setTimelineForm(f => ({ ...f, academic_year: e.target.value }))}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C90031]">
                      <option value="">Select year</option>
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">Semester *</label>
                    <select value={timelineForm.semester}
                      onChange={e => setTimelineForm(f => ({ ...f, semester: Number(e.target.value) }))}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C90031]">
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">Start Date *</label>
                    <input type="date" value={timelineForm.start_date}
                      onChange={e => setTimelineForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">End Date *</label>
                    <input type="date" value={timelineForm.end_date}
                      onChange={e => setTimelineForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Coursework Deadlines</p>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">Grade Submission Deadline</label>
                  <input type="date" value={timelineForm.grade_submission_deadline || ''}
                    onChange={e => setTimelineForm(f => ({ ...f, grade_submission_deadline: e.target.value }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">Notes</label>
                  <textarea rows={2} value={timelineForm.notes || ''}
                    onChange={e => setTimelineForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C90031] resize-none" />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={handleSaveTimeline} disabled={savingTimeline}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[13px] font-medium rounded-lg disabled:opacity-50">
                    {savingTimeline ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                    {activeSemester ? 'Update Timeline' : 'Create Timeline'}
                  </button>
                  {activeSemester && (
                    <>
                      <button
                        onClick={handleSendReminders}
                        disabled={sendingReminders}
                        title="Email deadline reminders to all assigned lecturers"
                        className="flex items-center gap-2 px-3 py-2 border border-[#D1FAE5] bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5] text-[13px] font-medium rounded-lg disabled:opacity-50">
                        {sendingReminders ? <Spinner size="sm" /> : <Bell className="w-4 h-4" />}
                        Send Reminders
                      </button>
                      <button onClick={() => handleDeleteTimeline(activeSemester.id)}
                        className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-medium rounded-lg">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Course selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#111827] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#C90031]" /> Select Courses for Semester
              </h2>
              {activeSemester && (
                <span className="text-[12px] text-[#6B7280]">{selectedCourseIds.size} selected</span>
              )}
            </div>

            {!activeSemester ? (
              <Card>
                <div className="text-center py-10 text-[#9CA3AF]">
                  <CheckSquare className="w-10 h-10 mx-auto mb-3 text-[#D1D5DB]" />
                  <p className="font-medium">Select or create a semester timeline first</p>
                  <p className="text-[12px] mt-1">Then tick the courses offered in that semester</p>
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input type="text" placeholder="Search courses to add…"
                    value={courseSearchSetup} onChange={e => setCourseSearchSetup(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]" />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedCourseIds(new Set(courses.map(c => c.id)))}
                    className="text-[11px] font-medium text-[#2563EB] hover:underline">Select all</button>
                  <span className="text-[#D1D5DB]">|</span>
                  <button onClick={() => setSelectedCourseIds(new Set())}
                    className="text-[11px] font-medium text-[#6B7280] hover:underline">Clear all</button>
                </div>

                {loadingSelection ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto divide-y divide-[#F3F4F6] -mx-4 px-1">
                    {setupFilteredCourses.length === 0 ? (
                      <p className="text-center text-[#9CA3AF] py-6 text-[13px]">No courses found</p>
                    ) : setupFilteredCourses.map(c => (
                      <label key={c.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] cursor-pointer rounded-lg">
                        <div className="relative shrink-0 w-5 h-5">
                          <input type="checkbox" checked={selectedCourseIds.has(c.id)}
                            onChange={() => toggleCourseSelection(c.id)} className="sr-only" />
                          {selectedCourseIds.has(c.id)
                            ? <CheckSquare className="w-5 h-5 text-[#C90031]" />
                            : <Square className="w-5 h-5 text-[#D1D5DB]" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-[12px] font-semibold text-[#C90031]">{c.code}</span>
                          <span className="ml-2 text-[13px] text-[#111827] truncate">{c.name}</span>
                          <span className="ml-2 text-[11px] text-[#9CA3AF]">{c.credits} cr · Sem {c.semester}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <button onClick={handleSaveSelection} disabled={savingSelection || !activeSemester}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                      selectionSaved
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#166534] hover:bg-[#14532D]'
                    }`}>
                    {savingSelection
                      ? <><Spinner size="sm" /> Saving…</>
                      : selectionSaved
                        ? <><Check className="w-4 h-4" /> Saved — {selectedCourseIds.size} courses</>
                        : <><Save className="w-4 h-4" /> Save Course Selection ({selectedCourseIds.size} courses)</>}
                  </button>
                  {selectionSaved && (
                    <p className="text-center text-[12px] text-emerald-700 font-medium">
                      ✓ Course selection updated for <strong>{activeSemester?.academic_year} Sem {activeSemester?.semester}</strong>. Switch to Distribute tab to assign lecturers.
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — CALENDAR VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <SemesterCalendar
          timelines={timelines}
          loading={loadingTimelines}
          onAdd={() => { setActiveTab('setup'); setActiveSemester(null); setTimelineForm(EMPTY_TIMELINE_FORM) }}
          onEdit={tl => { setActiveSemester(tl); setActiveTab('setup') }}
          onDelete={handleDeleteTimeline}
        />
      )}

      </div>{/* end tab content */}

      <CurriculumLibrary
        open={curriculumOpen}
        onClose={() => setCurriculumOpen(false)}
        existingCodes={existingCodes}
        intakeYear={intakeYear}
        intakeYearOptions={intakeYearOptions}
        onIntakeYearChange={setIntakeYear}
        onAdd={handleAddFromCurriculum}
        onAddAllMissing={handleAddAllMissing}
      />
    </div>
    </MainLayout>
  )
}
