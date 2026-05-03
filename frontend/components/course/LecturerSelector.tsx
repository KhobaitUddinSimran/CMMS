'use client'

import { User, AlertTriangle, CheckCircle } from 'lucide-react'
import type { LecturerWorkload } from '@/lib/api/courses'

const MAX_CREDITS = 9

interface Lecturer {
  id: string
  email: string
  full_name: string
}

interface LecturerSelectorProps {
  value: string
  onChange: (value: string) => void
  lecturers: Lecturer[]
  loading?: boolean
  workload?: Record<string, LecturerWorkload>
  courseCredits?: number
}

function CreditBar({ used, adding = 0 }: { used: number; adding?: number }) {
  const pct = Math.min(100, (used / MAX_CREDITS) * 100)
  const addingPct = Math.min(100 - pct, (adding / MAX_CREDITS) * 100)
  const wouldExceed = used + adding > MAX_CREDITS
  const barColor = wouldExceed ? 'bg-red-500' : used >= MAX_CREDITS ? 'bg-red-500' : used >= 7 ? 'bg-amber-400' : 'bg-emerald-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#6B7280]">Semester credit load</span>
        <span className={`font-semibold ${wouldExceed ? 'text-red-600' : used >= MAX_CREDITS ? 'text-red-600' : 'text-[#111827]'}`}>
          {used}{adding > 0 ? ` + ${adding}` : ''} / {MAX_CREDITS} cr
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden flex">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        {adding > 0 && (
          <div
            className={`h-full transition-all ${wouldExceed ? 'bg-red-300' : 'bg-blue-400'} opacity-70`}
            style={{ width: `${addingPct}%` }}
          />
        )}
      </div>
    </div>
  )
}

export function LecturerSelector({
  value,
  onChange,
  lecturers,
  loading = false,
  workload = {},
  courseCredits = 0,
}: LecturerSelectorProps) {
  const selected = lecturers.find((l) => l.id === value)
  const selectedLoad = value ? workload[value] : undefined
  const wouldExceed = selectedLoad ? selectedLoad.used_credits + courseCredits > MAX_CREDITS : false

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
          <User className="w-4 h-4" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className={`w-full h-10 border rounded-lg pl-10 pr-3 text-[14px] transition-colors outline-none appearance-none
            border-[#E5E7EB] focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB]
            ${loading ? 'bg-[#F3F4F6] cursor-not-allowed' : 'bg-white cursor-pointer'}`}
        >
          <option value="">Select a lecturer</option>
          {lecturers.map((lect) => {
            const w = workload[lect.id]
            const used = w?.used_credits ?? 0
            const full = w?.is_full ?? false
            const nearFull = used >= 7 && !full
            const label = w
              ? `${lect.full_name || lect.email} (${used}/${MAX_CREDITS} cr${full ? ' — FULL' : nearFull ? ' — near limit' : ''})`
              : lect.full_name || lect.email
            return (
              <option key={lect.id} value={lect.id} disabled={false}>
                {label}
              </option>
            )
          })}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {value && selected && (
        <div className={`rounded-lg p-3 text-xs space-y-2 border ${wouldExceed ? 'bg-red-50 border-red-200' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[#111827] font-medium">{selected.full_name}</p>
              <p className="text-[#6B7280]">{selected.email}</p>
            </div>
            {selectedLoad && (
              selectedLoad.is_full
                ? <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold whitespace-nowrap"><AlertTriangle className="w-3 h-3" />Full</span>
                : selectedLoad.used_credits >= 7
                  ? <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold whitespace-nowrap"><AlertTriangle className="w-3 h-3" />Near limit</span>
                  : <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold whitespace-nowrap"><CheckCircle className="w-3 h-3" />{selectedLoad.remaining_credits} cr left</span>
            )}
          </div>

          {selectedLoad ? (
            <CreditBar used={selectedLoad.used_credits} adding={courseCredits} />
          ) : courseCredits > 0 ? (
            <CreditBar used={0} adding={courseCredits} />
          ) : null}

          {wouldExceed && (
            <p className="text-red-600 font-medium text-[11px]">
              ⚠ Assigning this course ({courseCredits} cr) would exceed the 9-credit semester limit.
            </p>
          )}
        </div>
      )}

      {lecturers.length === 0 && !loading && (
        <p className="text-xs text-[#6B7280] text-center py-2">No lecturers available</p>
      )}
    </div>
  )
}
