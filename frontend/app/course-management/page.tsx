'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import { listCourses, assignLecturer, getLecturerWorkloads, createCourse } from '@/lib/api/courses'
import { listLecturers } from '@/lib/api/courses'
import {
  BookOpen, Users, ChevronLeft, RefreshCw,
  AlertTriangle, Search, Filter, UserCheck, UserX, Library
} from 'lucide-react'
import { CurriculumLibrary } from '@/components/course-management/CurriculumLibrary'
import { yearLevelFromCode, type CurriculumCourse } from '@/lib/data/mjiit-curriculum'

const DEFAULT_MAX_CREDITS = 9

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

  const [courses, setCourses] = useState<CourseRow[]>([])
  const [lecturers, setLecturers] = useState<LecturerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterUnassigned, setFilterUnassigned] = useState(false)
  const [semesterFilter, setSemesterFilter] = useState('')
  const [yearLevelFilter, setYearLevelFilter] = useState<'all' | 1 | 2 | 3 | 4>('all')
  const [curriculumOpen, setCurriculumOpen] = useState(false)
  const intakeYearOptions = useMemo(generateIntakeYears, [])
  const [intakeYear, setIntakeYear] = useState<string>(() => {
    const opts = generateIntakeYears()
    // default to the second-most-recent (the cohort that just started Y2)
    return opts[opts.length - 2] || opts[0]
  })

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

  const handleAssign = async (courseId: string, lecturerId: string) => {
    setAssigning(courseId)
    try {
      await assignLecturer(courseId, lecturerId)
      const lect = lecturers.find(l => l.id === lecturerId)
      setCourses(prev => prev.map(c =>
        c.id === courseId
          ? { ...c, lecturer_id: lecturerId, lecturer_name: lect?.full_name }
          : c
      ))
      addToast('Lecturer assigned', 'success')
      loadData()
    } catch (e: any) {
      addToast(e?.response?.data?.detail || 'Failed to assign lecturer', 'error')
    } finally {
      setAssigning(null)
    }
  }

  const semesters = useMemo(
    () => [...new Set(courses.map(c => c.semester).filter(Boolean))].sort(),
    [courses]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses.filter(c => {
      const matchSearch = !q ||
        c.code.toLowerCase().includes(q) ||
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.lecturer_name ?? '').toLowerCase().includes(q)
      const matchUnassigned = !filterUnassigned || !c.lecturer_name
      const matchSem = !semesterFilter || c.semester === semesterFilter
      const matchYear = yearLevelFilter === 'all' || yearLevelFromCode(c.code) === yearLevelFilter
      return matchSearch && matchUnassigned && matchSem && matchYear
    })
  }, [courses, search, filterUnassigned, semesterFilter, yearLevelFilter])

  const existingCodes = useMemo(
    () => new Set(courses.map(c => c.code.toUpperCase())),
    [courses]
  )

  const assignedCount = useMemo(() => courses.filter(c => c.lecturer_name).length, [courses])
  const unassignedCount = courses.length - assignedCount
  const overloadedCount = useMemo(() => lecturers.filter(l => l.is_full).length, [lecturers])

  return (
    <MainLayout>
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[28px] font-bold text-[#111827]">Course Management</h1>
          <p className="text-[15px] text-[#6B7280] mt-1">Assign lecturers to courses and monitor workloads</p>
        </div>
        <button
          onClick={() => setCurriculumOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white rounded-lg text-[13px] font-semibold transition"
        >
          <Library className="w-4 h-4" />
          MJIIT Curriculum Library
        </button>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: courses.length, icon: BookOpen, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]' },
          { label: 'Assigned', value: assignedCount, icon: UserCheck, bg: 'bg-[#ECFDF5]', color: 'text-[#10B981]' },
          { label: 'Unassigned', value: unassignedCount, icon: UserX, bg: 'bg-[#FEF3C7]', color: 'text-[#F59E0B]' },
          { label: 'Full Workload', value: overloadedCount, icon: AlertTriangle, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]' },
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

      {/* Lecturer workload bar */}
      {!loading && lecturers.length > 0 && (
        <Card>
          <h2 className="text-[16px] font-bold text-[#111827] mb-4 flex items-center gap-2">
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
                    <span className="text-[13px] font-medium text-[#111827] truncate max-w-[160px]">{l.full_name}</span>
                    <span className={`text-[12px] font-bold ${l.is_full ? 'text-[#EF4444]' : 'text-[#374151]'}`}>
                      {l.used_credits}/{cap} cr
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  {l.is_full && (
                    <p className="text-[11px] text-[#EF4444] mt-1 font-medium">Workload full</p>
                  )}
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
          <input
            type="text"
            placeholder="Search course code, name or lecturer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]"
          />
        </div>
        <select
          value={semesterFilter}
          onChange={e => setSemesterFilter(e.target.value)}
          className="px-3 py-2 text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20"
        >
          <option value="">All Semesters</option>
          {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <button
          onClick={() => setFilterUnassigned(!filterUnassigned)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition ${
            filterUnassigned
              ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
              : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {filterUnassigned ? 'Show All' : 'Unassigned Only'}
        </button>
      </div>

      {/* Year level pills (works on any code matching SMJC<year>NNN<credits> pattern) */}
      <div className="flex items-center gap-2 -mt-2">
        <span className="text-[12px] font-medium text-[#6B7280]">Year level:</span>
        <div className="flex gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1">
          {(['all', 1, 2, 3, 4] as const).map(y => (
            <button
              key={String(y)}
              onClick={() => setYearLevelFilter(y)}
              className={`px-3 py-1 text-[12px] font-medium rounded-md transition ${
                yearLevelFilter === y
                  ? 'bg-[#C90031] text-white'
                  : 'text-[#6B7280] hover:bg-gray-50'
              }`}
            >
              {y === 'all' ? 'All' : `Y${y}`}
            </button>
          ))}
        </div>
      </div>

      {/* Course table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="font-medium text-[#6B7280]">No courses match your filters</p>
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
                    <tr
                      key={course.id}
                      className={`border-b border-[#E5E7EB] last:border-0 transition-colors ${isBusy ? 'opacity-60' : 'hover:bg-[#F9FAFB]'}`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#C90031]">{course.code}</td>
                      <td className="py-3 px-4 text-[#111827]">
                        {course.name || `${course.code} Sec ${course.section}`}
                      </td>
                      <td className="py-3 px-4 text-[#6B7280]">{course.section}</td>
                      <td className="py-3 px-4 text-[#6B7280]">Sem {course.semester} / {course.academic_year ?? '—'}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{course.credits ?? '—'}</td>
                      <td className="py-3 px-4">
                        {course.lecturer_name ? (
                          <span className="text-[#111827] font-medium">{course.lecturer_name}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#F59E0B] text-[12px] font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isBusy ? (
                          <Spinner size="sm" />
                        ) : (
                          <select
                            defaultValue={course.lecturer_id ?? ''}
                            onChange={e => e.target.value && handleAssign(course.id, e.target.value)}
                            className="text-[13px] border border-[#E5E7EB] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031] min-w-[160px]"
                          >
                            <option value="">— Select lecturer —</option>
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
