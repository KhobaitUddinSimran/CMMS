'use client'

import { User } from 'lucide-react'

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
}

export function LecturerSelector({ value, onChange, lecturers, loading = false }: LecturerSelectorProps) {
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
          {lecturers.map((lect) => (
            <option key={lect.id} value={lect.id}>
              {lect.full_name || lect.email}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {value && lecturers.length > 0 && (
        <div className="bg-[#F9FAFB] rounded-lg p-3 text-xs space-y-1">
          {(() => {
            const selected = lecturers.find((l) => l.id === value)
            if (!selected) return null
            return (
              <>
                <p className="text-[#111827] font-medium">{selected.full_name}</p>
                <p className="text-[#6B7280]">{selected.email}</p>
              </>
            )
          })()}
        </div>
      )}

      {lecturers.length === 0 && !loading && (
        <p className="text-xs text-[#6B7280] text-center py-2">
          No lecturers available
        </p>
      )}
    </div>
  )
}
