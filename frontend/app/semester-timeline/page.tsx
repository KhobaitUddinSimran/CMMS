'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { MainLayout } from '@/components/layout/MainLayout'
import { useToastStore } from '@/stores/toastStore'
import {
  listTimelines, upsertTimeline, deleteTimeline,
  type SemesterTimeline, type SemesterTimelineInput,
} from '@/lib/api/semester'
import {
  CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight,
  GraduationCap, BookOpen, Flag, AlertCircle, X,
} from 'lucide-react'

// ────────────────────────────────────────────────────────────────────────────
// Mini calendar helpers
// ────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function inRange(d: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  return d >= start && d <= end
}

interface MiniCalendarProps {
  year: number
  month: number
  timelines: SemesterTimeline[]
}

function MiniCalendar({ year, month, timelines }: MiniCalendarProps) {
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  type Dot = { color: string; label: string }
  function getDots(d: number): Dot[] {
    const date = new Date(year, month, d)
    const dots: Dot[] = []
    for (const tl of timelines) {
      const start = parseDate(tl.start_date)
      const end   = parseDate(tl.end_date)
      if (start && sameDay(date, start)) dots.push({ color: 'bg-emerald-500', label: `Sem ${tl.semester} Start` })
      if (end   && sameDay(date, end))   dots.push({ color: 'bg-red-500',     label: `Sem ${tl.semester} End` })
      if (tl.midterm_deadline) {
        const md = parseDate(tl.midterm_deadline)
        if (md && sameDay(date, md)) dots.push({ color: 'bg-amber-500', label: 'Midterm' })
      }
      if (tl.grade_submission_deadline) {
        const gd = parseDate(tl.grade_submission_deadline)
        if (gd && sameDay(date, gd)) dots.push({ color: 'bg-purple-500', label: 'Grade Deadline' })
      }
      if (tl.final_deadline) {
        const fd = parseDate(tl.final_deadline)
        if (fd && sameDay(date, fd)) dots.push({ color: 'bg-blue-500', label: 'Finals' })
      }
    }
    return dots
  }

  function isInAnyRange(d: number): boolean {
    const date = new Date(year, month, d)
    return timelines.some(tl => inRange(date, parseDate(tl.start_date), parseDate(tl.end_date)))
  }

  const today = new Date()
  const isTodayCell = (d: number) => sameDay(new Date(year, month, d), today)

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#9CA3AF] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-[#F3F4F6] rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-white aspect-square" />
          const dots    = getDots(day)
          const inRange = isInAnyRange(day)
          const isToday = isTodayCell(day)
          return (
            <div
              key={i}
              title={dots.map(d => d.label).join(', ')}
              className={`bg-white aspect-square flex flex-col items-center justify-center relative
                ${inRange ? 'bg-blue-50' : ''}
                ${isToday ? 'ring-2 ring-inset ring-[#C90031]' : ''}`}
            >
              <span className={`text-[11px] leading-none font-medium
                ${isToday ? 'text-[#C90031] font-bold' : 'text-[#374151]'}`}>
                {day}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-px mt-0.5 flex-wrap justify-center">
                  {dots.slice(0, 3).map((dot, di) => (
                    <span key={di} className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Timeline bar component
// ────────────────────────────────────────────────────────────────────────────
function TimelineBar({ tl }: { tl: SemesterTimeline }) {
  const start = parseDate(tl.start_date)
  const end   = parseDate(tl.end_date)
  if (!start || !end) return null

  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000)

  function pct(d: Date | null): number {
    if (!d) return 0
    return Math.min(100, Math.max(0, (d.getTime() - start!.getTime()) / 86400000 / totalDays * 100))
  }

  const milestones = [
    { date: parseDate(tl.midterm_deadline),            color: 'bg-amber-400',  label: 'Midterm' },
    { date: parseDate(tl.grade_submission_deadline),   color: 'bg-purple-500', label: 'Grades Due' },
    { date: parseDate(tl.final_deadline),              color: 'bg-blue-500',   label: 'Finals' },
  ].filter(m => m.date !== null)

  const todayPct = pct(new Date())
  const today = new Date()
  const isActive = today >= start && today <= end

  return (
    <div className="mt-3">
      <div className="relative h-3 bg-[#E5E7EB] rounded-full overflow-visible">
        {/* Active range fill */}
        <div className="absolute inset-0 bg-[#BFDBFE] rounded-full" />
        {/* Milestones */}
        {milestones.map((m, i) => (
          <div key={i} style={{ left: `${pct(m.date)}%` }}
            className="absolute -top-0.5 flex flex-col items-center" title={m.label}>
            <div className={`w-3 h-4 ${m.color} rounded-sm`} />
          </div>
        ))}
        {/* Today marker */}
        {isActive && (
          <div style={{ left: `${todayPct}%` }}
            className="absolute -top-1 h-5 w-0.5 bg-[#C90031] rounded-full" title="Today" />
        )}
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1 text-[10px] text-[#9CA3AF]">
        <span>{tl.start_date}</span>
        <div className="flex gap-3">
          {milestones.map((m, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${m.color} inline-block`} />
              {m.label}
            </span>
          ))}
        </div>
        <span>{tl.end_date}</span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM: SemesterTimelineInput = {
  academic_year: '',
  semester: 1,
  start_date: '',
  end_date: '',
  midterm_deadline: '',
  grade_submission_deadline: '',
  final_deadline: '',
  notes: '',
}

export default function SemesterTimelinePage() {
  const { addToast } = useToastStore()

  const [timelines, setTimelines]   = useState<SemesterTimeline[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [form, setForm]             = useState<SemesterTimelineInput>(EMPTY_FORM)
  const [calYear, setCalYear]       = useState(new Date().getFullYear())
  const [calMonth, setCalMonth]     = useState(new Date().getMonth())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await listTimelines()
      setTimelines(data)
    } catch {
      addToast('Failed to load timelines', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openForm(tl?: SemesterTimeline) {
    if (tl) {
      setForm({
        academic_year: tl.academic_year,
        semester: tl.semester,
        start_date: tl.start_date,
        end_date: tl.end_date,
        midterm_deadline: tl.midterm_deadline || '',
        grade_submission_deadline: tl.grade_submission_deadline || '',
        final_deadline: tl.final_deadline || '',
        notes: tl.notes || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.academic_year || !form.semester || !form.start_date || !form.end_date) {
      addToast('Academic year, semester, start and end dates are required', 'error')
      return
    }
    setSaving(true)
    try {
      await upsertTimeline(form)
      addToast('Timeline saved', 'success')
      setShowForm(false)
      load()
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this semester timeline? This cannot be undone.')) return
    try {
      await deleteTimeline(id)
      addToast('Timeline deleted', 'success')
      setTimelines(t => t.filter(x => x.id !== id))
    } catch {
      addToast('Failed to delete', 'error')
    }
  }

  const calPrevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const calNextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  // Auto-generate year options
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 1 + i
    return `${y}/${y + 1}`
  })

  return (
    <MainLayout>
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Semester Timeline</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Configure semester dates and key academic deadlines</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Timeline
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: configured timelines */}
        <div className="xl:col-span-2 space-y-4">
          {loading ? (
            <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
          ) : timelines.length === 0 ? (
            <Card>
              <div className="text-center py-14">
                <CalendarDays className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                <p className="font-semibold text-[#6B7280]">No timelines configured</p>
                <p className="text-sm text-[#9CA3AF] mt-1">Add a semester timeline to get started</p>
                <button
                  onClick={() => openForm()}
                  className="mt-4 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-sm font-medium rounded-lg"
                >
                  Add First Timeline
                </button>
              </div>
            </Card>
          ) : (
            timelines.map(tl => (
              <Card key={tl.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#C90031]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#111827] text-[16px]">
                        {tl.academic_year} — Semester {tl.semester}
                      </h3>
                      <p className="text-[13px] text-[#6B7280]">
                        {tl.start_date} → {tl.end_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openForm(tl)}
                      className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50 rounded transition-colors text-[13px] font-medium px-3"
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(tl.id)}
                      className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Deadline badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {tl.midterm_deadline && (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                      <BookOpen className="w-3 h-3" /> Midterm: {tl.midterm_deadline}
                    </span>
                  )}
                  {tl.final_deadline && (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      <Flag className="w-3 h-3" /> Finals: {tl.final_deadline}
                    </span>
                  )}
                  {tl.grade_submission_deadline && (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                      <AlertCircle className="w-3 h-3" /> Grades Due: {tl.grade_submission_deadline}
                    </span>
                  )}
                </div>

                {/* Visual timeline bar */}
                <TimelineBar tl={tl} />

                {tl.notes && (
                  <p className="mt-3 text-[12px] text-[#6B7280] italic border-t border-[#F3F4F6] pt-2">{tl.notes}</p>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Right: mini calendar */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#111827]">
                {MONTH_NAMES[calMonth]} {calYear}
              </h3>
              <div className="flex gap-1">
                <button onClick={calPrevMonth} className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280]">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={calNextMonth} className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280]">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <MiniCalendar year={calYear} month={calMonth} timelines={timelines} />
            {/* Legend */}
            <div className="mt-4 space-y-1 text-[11px] text-[#6B7280]">
              {[
                { color: 'bg-emerald-500', label: 'Semester Start' },
                { color: 'bg-red-500',     label: 'Semester End' },
                { color: 'bg-amber-500',   label: 'Midterm Deadline' },
                { color: 'bg-blue-500',    label: 'Finals Deadline' },
                { color: 'bg-purple-500',  label: 'Grade Submission' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${l.color} flex-shrink-0`} />
                  <span>{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <span className="w-0.5 h-3 bg-[#C90031] rounded-full flex-shrink-0 ml-[3px]" />
                <span>Today</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[18px] font-bold text-[#111827]">Configure Semester Timeline</h2>
              <button onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-[#111827]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Academic Year *</label>
                  <select
                    value={form.academic_year}
                    onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]"
                  >
                    <option value="">Select year</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Semester *</label>
                  <select
                    value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Start Date *</label>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">End Date *</label>
                  <input type="date" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
                </div>
              </div>

              <div className="border-t border-[#F3F4F6] pt-3">
                <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Key Deadlines</p>
                <div className="space-y-3">
                  {[
                    { key: 'midterm_deadline',          label: 'Midterm Deadline' },
                    { key: 'final_deadline',            label: 'Finals Deadline' },
                    { key: 'grade_submission_deadline', label: 'Grade Submission Deadline' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-[13px] font-medium text-[#374151] mb-1">{label}</label>
                      <input type="date" value={(form as any)[key] || ''}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Notes</label>
                <textarea rows={2} value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes for this semester…"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031] resize-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end px-6 py-4 border-t border-[#E5E7EB]">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#374151] hover:bg-[#F9FAFB]">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg disabled:opacity-50">
                {saving ? <Spinner /> : null} Save Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </MainLayout>
  )
}
