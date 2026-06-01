'use client'

import { useState } from 'react'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import {
  CalendarDays, ChevronLeft, ChevronRight,
  AlertCircle, GraduationCap, Trash2, Plus,
} from 'lucide-react'
import type { SemesterTimeline } from '@/lib/api/semester'

// ── helpers ──────────────────────────────────────────────────────────────────
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
  return !!(start && end && d >= start && d <= end)
}

// ── MiniCalendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ year, month, timelines }: { year: number; month: number; timelines: SemesterTimeline[] }) {
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
      if (tl.grade_submission_deadline) {
        const gd = parseDate(tl.grade_submission_deadline)
        if (gd && sameDay(date, gd)) dots.push({ color: 'bg-purple-500', label: 'Grade Deadline' })
      }
    }
    return dots
  }

  const today = new Date()
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
          const ranged  = timelines.some(tl => inRange(new Date(year, month, day), parseDate(tl.start_date), parseDate(tl.end_date)))
          const isToday = sameDay(new Date(year, month, day), today)
          return (
            <div key={i} title={dots.map(d => d.label).join(', ')}
              className={`bg-white aspect-square flex flex-col items-center justify-center relative
                ${ranged ? 'bg-blue-50' : ''} ${isToday ? 'ring-2 ring-inset ring-[#C90031]' : ''}`}>
              <span className={`text-[11px] leading-none font-medium ${isToday ? 'text-[#C90031] font-bold' : 'text-[#374151]'}`}>{day}</span>
              {dots.length > 0 && (
                <div className="flex gap-px mt-0.5 flex-wrap justify-center">
                  {dots.slice(0, 3).map((dot, di) => <span key={di} className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TimelineBar ───────────────────────────────────────────────────────────────
function TimelineBar({ tl }: { tl: SemesterTimeline }) {
  const start = parseDate(tl.start_date)
  const end   = parseDate(tl.end_date)
  if (!start || !end) return null
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000)
  function pct(d: Date | null) {
    if (!d) return 0
    return Math.min(100, Math.max(0, (d.getTime() - start!.getTime()) / 86400000 / totalDays * 100))
  }
  const milestones = [
    { date: parseDate(tl.grade_submission_deadline), color: 'bg-purple-500', label: 'Grades Due' },
  ].filter(m => m.date !== null)
  const today = new Date()
  const isActive = today >= start && today <= end
  return (
    <div className="mt-3">
      <div className="relative h-3 bg-[#E5E7EB] rounded-full overflow-visible">
        <div className="absolute inset-0 bg-[#BFDBFE] rounded-full" />
        {milestones.map((m, i) => (
          <div key={i} style={{ left: `${pct(m.date)}%` }} className="absolute -top-0.5 flex flex-col items-center" title={m.label}>
            <div className={`w-3 h-4 ${m.color} rounded-sm`} />
          </div>
        ))}
        {isActive && <div style={{ left: `${pct(today)}%` }} className="absolute -top-1 h-5 w-0.5 bg-[#C90031] rounded-full" title="Today" />}
      </div>
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

// ── Main exported component ───────────────────────────────────────────────────
interface SemesterCalendarProps {
  timelines: SemesterTimeline[]
  loading?: boolean
  onAdd?: () => void
  onEdit?: (tl: SemesterTimeline) => void
  onDelete?: (id: string) => void
}

export function SemesterCalendar({ timelines, loading, onAdd, onEdit, onDelete }: SemesterCalendarProps) {
  const [calYear, setCalYear]   = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  const calPrev = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1) }
  const calNext = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1) }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: timeline cards */}
      <div className="xl:col-span-2 space-y-4">
        {loading ? (
          <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
        ) : timelines.length === 0 ? (
          <Card>
            <div className="text-center py-14">
              <CalendarDays className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-semibold text-[#6B7280]">No timelines configured</p>
              <p className="text-sm text-[#9CA3AF] mt-1">Add a semester timeline to get started</p>
              {onAdd && (
                <button onClick={onAdd} className="mt-4 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-sm font-medium rounded-lg">
                  Add First Timeline
                </button>
              )}
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
                    <h3 className="font-bold text-[#111827] text-[16px]">{tl.academic_year} — Semester {tl.semester}</h3>
                    <p className="text-[13px] text-[#6B7280]">{tl.start_date} → {tl.end_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {onEdit && (
                    <button onClick={() => onEdit(tl)}
                      className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50 rounded transition-colors text-[13px] font-medium px-3">
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(tl.id)} className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {tl.grade_submission_deadline && (
                  <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                    <AlertCircle className="w-3 h-3" /> Grades Due: {tl.grade_submission_deadline}
                  </span>
                )}
              </div>
              <TimelineBar tl={tl} />
              {tl.notes && <p className="mt-3 text-[12px] text-[#6B7280] italic border-t border-[#F3F4F6] pt-2">{tl.notes}</p>}
            </Card>
          ))
        )}
      </div>

      {/* Right: mini calendar */}
      <div className="space-y-4">
        {onAdd && (
          <button onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add / Edit Timeline
          </button>
        )}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#111827]">{MONTH_NAMES[calMonth]} {calYear}</h3>
            <div className="flex gap-1">
              <button onClick={calPrev} className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280]"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={calNext} className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280]"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <MiniCalendar year={calYear} month={calMonth} timelines={timelines} />
          <div className="mt-4 space-y-1 text-[11px] text-[#6B7280]">
            {[
              { color: 'bg-emerald-500', label: 'Semester Start' },
              { color: 'bg-red-500',     label: 'Semester End' },
              { color: 'bg-amber-500',   label: 'Midterm Deadline' },
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
  )
}
