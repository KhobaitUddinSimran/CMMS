'use client'

import { useMemo, useState } from 'react'
import {
  X, BookOpen, CheckCircle2, Plus, Search, GraduationCap, Library,
  Layers, Sparkles, Briefcase,
} from 'lucide-react'
import { Spinner } from '@/components/common/Spinner'
import {
  MJIIT_SMJC_CURRICULUM,
  ELECTIVE_GROUP_LABEL,
  type CurriculumCourse,
  type CourseKind,
  type ElectiveGroup,
} from '@/lib/data/mjiit-curriculum'

interface CurriculumLibraryProps {
  open: boolean
  onClose: () => void
  existingCodes: Set<string>
  /** The cohort's intake year, e.g. "2025/2026". A Year-2 course is then
   *  scheduled for intake+1 ("2026/2027"), Year-3 for intake+2, etc. */
  intakeYear: string
  intakeYearOptions: string[]
  onIntakeYearChange: (intakeYear: string) => void
  onAdd: (course: CurriculumCourse) => Promise<void> | void
  /** Bulk-add all remaining not-yet-imported courses. */
  onAddAllMissing?: (courses: CurriculumCourse[]) => Promise<void> | void
}

/** Derive AY for a given program-year using the intake year. */
function derivedSessionFor(intakeYear: string, programYear: number): string {
  const m = intakeYear.match(/^(\d{4})\/(\d{4})$/)
  if (!m) return intakeYear
  const startYear = parseInt(m[1], 10) + (programYear - 1)
  return `${startYear}/${startYear + 1}`
}

const KIND_BADGE: Record<CourseKind, { label: string; cls: string }> = {
  core:       { label: 'Core',       cls: 'bg-[#FEE2E2] text-[#C90031]' },
  lab:        { label: 'Lab',        cls: 'bg-[#FEF3C7] text-[#92400E]' },
  capstone:   { label: 'Capstone',   cls: 'bg-[#F3E8FF] text-[#7E22CE]' },
  elective:   { label: 'Elective',   cls: 'bg-[#E0F2FE] text-[#0369A1]' },
  general:    { label: 'General',    cls: 'bg-[#F3F4F6] text-[#374151]' },
  language:   { label: 'Language',   cls: 'bg-[#ECFCCB] text-[#3F6212]' },
  industrial: { label: 'Industrial', cls: 'bg-[#FFEDD5] text-[#9A3412]' },
}

type Tab = 'program' | 'electives'

export function CurriculumLibrary({
  open,
  onClose,
  existingCodes,
  intakeYear,
  intakeYearOptions,
  onIntakeYearChange,
  onAdd,
  onAddAllMissing,
}: CurriculumLibraryProps) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('program')
  const [adding, setAdding] = useState<string | null>(null)
  const [bulking, setBulking] = useState(false)

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MJIIT_SMJC_CURRICULUM
    return MJIIT_SMJC_CURRICULUM.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  }, [search])

  const programCourses = useMemo(
    () => matches.filter(c => c.kind !== 'elective'),
    [matches]
  )
  const electiveCourses = useMemo(
    () => matches.filter(c => c.kind === 'elective'),
    [matches]
  )

  /** Group program courses by "Y{year} · S{sem}" keeping deterministic order. */
  const programGroups = useMemo(() => {
    const buckets = new Map<string, { year: number; sem: number; items: CurriculumCourse[] }>()
    for (const course of programCourses) {
      const key = `${course.programYear}-${course.programSemester}`
      if (!buckets.has(key)) buckets.set(key, { year: course.programYear, sem: course.programSemester, items: [] })
      buckets.get(key)!.items.push(course)
    }
    return Array.from(buckets.values()).sort((a, b) => a.year - b.year || a.sem - b.sem)
  }, [programCourses])

  const electiveGroups = useMemo(() => {
    const order: ElectiveGroup[] = ['resources', 'environment', 'energy']
    return order
      .map(group => ({
        group,
        label: ELECTIVE_GROUP_LABEL[group],
        items: electiveCourses.filter(c => c.electiveGroup === group),
      }))
      .filter(g => g.items.length > 0)
  }, [electiveCourses])

  const isInSystem = (code: string) => existingCodes.has(code.toUpperCase().replace(/\s+/g, ''))

  const totalAvailable = MJIIT_SMJC_CURRICULUM.length
  const totalInSystem = MJIIT_SMJC_CURRICULUM.filter(c => isInSystem(c.code)).length
  const missingCourses = useMemo(
    () => MJIIT_SMJC_CURRICULUM.filter(c => !isInSystem(c.code)),
    [existingCodes]
  )

  const handleAdd = async (course: CurriculumCourse) => {
    setAdding(course.code)
    try { await onAdd(course) } finally { setAdding(null) }
  }

  const handleBulkAdd = async () => {
    if (!onAddAllMissing || missingCourses.length === 0) return
    setBulking(true)
    try { await onAddAllMissing(missingCourses) } finally { setBulking(false) }
  }

  if (!open) return null

  const renderCourseRow = (course: CurriculumCourse) => {
    const inSystem = isInSystem(course.code)
    const isAdding = adding === course.code
    const badge = KIND_BADGE[course.kind]
    return (
      <div
        key={course.code}
        className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
          inSystem
            ? 'bg-[#F0FDF4] border-[#BBF7D0]'
            : 'bg-white border-[#E5E7EB] hover:border-[#C90031]/40 hover:shadow-sm'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-[#C90031] text-[13.5px]">{course.code}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
              {badge.label}
            </span>
            <span className="text-[11px] text-[#374151] bg-[#F3F4F6] px-2 py-0.5 rounded font-semibold">
              {course.credits} cr
            </span>
            {course.note && (
              <span className="text-[10px] text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded font-medium">
                {course.note}
              </span>
            )}
          </div>
          <p className="text-[13.5px] font-semibold text-[#111827] mt-1">{course.name}</p>
          <p className="text-[11.5px] text-[#6B7280] mt-0.5 line-clamp-1">{course.description}</p>
        </div>
        <div className="flex-shrink-0">
          {inSystem ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#DCFCE7] text-[#166534] text-[11.5px] font-semibold rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Added
            </span>
          ) : isAdding ? (
            <div className="px-2.5 py-1.5"><Spinner size="sm" /></div>
          ) : (
            <button
              onClick={() => handleAdd(course)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#C90031] hover:bg-[#A80028] text-white text-[11.5px] font-semibold rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-[#E5E7EB]">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
            <Library className="w-6 h-6 text-[#C90031]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] font-bold text-[#111827]">MJIIT SMJC Curriculum Library</h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Bachelor of Chemical Process Engineering with Honours · Department of Chemical and Environmental Engineering
            </p>
            <p className="text-[12px] text-[#6B7280] mt-1.5">
              <span className="font-semibold text-[#111827]">{totalInSystem}</span> of{' '}
              <span className="font-semibold text-[#111827]">{totalAvailable}</span> curriculum subjects imported ·
              cohort intake AY <span className="font-semibold text-[#111827]">{intakeYear}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-[11.5px] font-medium text-[#374151]">Intake year:</label>
              <select
                value={intakeYear}
                onChange={(e) => onIntakeYearChange(e.target.value)}
                className="text-[12px] border border-[#E5E7EB] bg-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#C90031]/20"
              >
                {intakeYearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-[11px] text-[#6B7280]">
                Y1 → {derivedSessionFor(intakeYear, 1)} · Y2 → {derivedSessionFor(intakeYear, 2)} ·
                Y3 → {derivedSessionFor(intakeYear, 3)} · Y4 → {derivedSessionFor(intakeYear, 4)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onAddAllMissing && missingCourses.length > 0 && (
              <button
                onClick={handleBulkAdd}
                disabled={bulking}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#C90031] hover:bg-[#A80028] disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg transition"
                title={`Add the remaining ${missingCourses.length} subject${missingCourses.length === 1 ? '' : 's'} to the system`}
              >
                {bulking ? <Spinner size="sm" /> : <Sparkles className="w-3.5 h-3.5" />}
                Add all {missingCourses.length} missing
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* Tabs + search */}
        <div className="px-6 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB] flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1">
            <button
              onClick={() => setTab('program')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition ${
                tab === 'program' ? 'bg-[#C90031] text-white' : 'text-[#6B7280] hover:bg-gray-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Program Structure
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tab === 'program' ? 'bg-white/20' : 'bg-[#F3F4F6]'}`}>
                {programCourses.length}
              </span>
            </button>
            <button
              onClick={() => setTab('electives')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition ${
                tab === 'electives' ? 'bg-[#C90031] text-white' : 'text-[#6B7280] hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Electives
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tab === 'electives' ? 'bg-white/20' : 'bg-[#F3F4F6]'}`}>
                {electiveCourses.length}
              </span>
            </button>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by code, name or topic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13.5px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C90031]/20 focus:border-[#C90031]"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'program' ? (
            programGroups.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <p className="font-medium text-[#6B7280]">No program subjects match your search</p>
              </div>
            ) : (
              <div className="space-y-6">
                {programGroups.map(({ year, sem, items }) => (
                  <div key={`${year}-${sem}`}>
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-1 -mx-1 px-1 z-10">
                      <GraduationCap className="w-4 h-4 text-[#6B7280]" />
                      <h3 className="text-[13px] font-bold text-[#374151] uppercase tracking-wide">
                        {sem === 3 ? `Year ${year} · Short Semester` : `Year ${year} · Semester ${sem}`}
                      </h3>
                      <span className="text-[11.5px] text-[#9CA3AF]">
                        · {items.length} subject{items.length === 1 ? '' : 's'} · {items.reduce((t, x) => t + x.credits, 0)} cr
                      </span>
                      <span className="ml-auto text-[10.5px] text-[#6B7280] font-mono bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                        AY {derivedSessionFor(intakeYear, year)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map(renderCourseRow)}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            electiveGroups.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <p className="font-medium text-[#6B7280]">No electives match your search</p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-[12.5px] text-[#6B7280] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2">
                  Students take <span className="font-semibold text-[#92400E]">any 4</span> electives across these three groups in Year 4. All 12 are offered for scheduling.
                </p>
                {electiveGroups.map(({ group, label, items }) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[#0369A1]" />
                      <h3 className="text-[13px] font-bold text-[#374151] uppercase tracking-wide">{label}</h3>
                      <span className="text-[11.5px] text-[#9CA3AF]">
                        · {items.length} subject{items.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map(renderCourseRow)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-[11.5px] text-[#6B7280]">
          <span>Credits derived from UTM code convention · last digit = credit hours.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[#374151] hover:bg-white border border-[#E5E7EB] rounded-lg font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
