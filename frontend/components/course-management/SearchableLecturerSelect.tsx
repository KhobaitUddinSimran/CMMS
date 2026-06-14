'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ChevronDown, X, AlertTriangle } from 'lucide-react'

interface LecturerOption {
  id: string
  full_name: string
  used_credits: number
  max_credits: number
  remaining_credits: number
  is_overloaded: boolean
  is_full: boolean
}

interface Props {
  value: string          // lecturer_id or ''
  onChange: (id: string) => void
  lecturers: LecturerOption[]
  defaultCredits: number
  disabled?: boolean
}

export function SearchableLecturerSelect({ value, onChange, lecturers, defaultCredits, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = lecturers.find(l => l.id === value)

  const filtered = query.trim()
    ? lecturers.filter(l => l.full_name.toLowerCase().includes(query.toLowerCase()))
    : lecturers

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = useCallback((id: string) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }, [onChange])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Keyboard: Escape to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  const badge = (l: LecturerOption) => {
    const cap = l.max_credits ?? defaultCredits
    if (l.is_overloaded) return { label: '⚠ Overloaded', cls: 'text-red-600 bg-red-50' }
    if (l.is_full)       return { label: 'Full',          cls: 'text-orange-600 bg-orange-50' }
    const pct = cap > 0 ? (l.used_credits / cap) * 100 : 0
    if (pct >= 75)       return { label: 'Near cap',      cls: 'text-amber-600 bg-amber-50' }
    return null
  }

  return (
    <div ref={containerRef} className="relative min-w-[200px]" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13px] border rounded-lg transition
          ${disabled ? 'bg-[#F3F4F6] cursor-not-allowed opacity-60' : 'bg-white cursor-pointer hover:border-[#C90031]/50'}
          ${open ? 'border-[#C90031] ring-2 ring-[#C90031]/20' : 'border-[#E5E7EB]'}
          ${!selected ? 'text-[#9CA3AF]' : 'text-[#111827]'}`}
      >
        <span className="truncate flex-1 text-left">
          {selected ? selected.full_name : '— Select lecturer —'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                selected.is_overloaded ? 'text-red-600 bg-red-50' :
                selected.is_full ? 'text-orange-600 bg-orange-50' : 'text-[#6B7280] bg-[#F3F4F6]'
              }`}>
                {selected.used_credits}/{selected.max_credits ?? defaultCredits} cr
              </span>
              <span onClick={handleClear} className="p-0.5 rounded hover:bg-red-50 hover:text-red-500 text-[#9CA3AF]">
                <X className="w-3 h-3" />
              </span>
            </>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden"
          style={{ minWidth: '240px' }}>
          {/* Search input */}
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[#F3F4F6]">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 text-[13px] outline-none bg-transparent placeholder-[#9CA3AF]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-[#9CA3AF] hover:text-[#374151]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Unassign option */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full text-left px-3 py-2 text-[13px] text-[#6B7280] hover:bg-[#F9FAFB] transition
              ${value === '' ? 'bg-[#FFF1F2] text-[#C90031] font-medium' : ''}`}>
            — Unassign —
          </button>

          {/* Lecturer list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-[#9CA3AF] text-center">No lecturers match &ldquo;{query}&rdquo;</p>
            ) : (
              filtered.map(l => {
                const cap = l.max_credits ?? defaultCredits
                const b = badge(l)
                const isBlocked = (l.is_overloaded || l.is_full) && l.id !== value
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => !isBlocked && handleSelect(l.id)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-[13px] transition
                      ${value === l.id ? 'bg-[#FFF1F2]' : 'hover:bg-[#F9FAFB]'}
                      ${isBlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`truncate font-medium ${value === l.id ? 'text-[#C90031]' : 'text-[#111827]'}`}>
                      {l.full_name}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-[#6B7280]">{l.used_credits}/{cap} cr</span>
                      {b && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${b.cls}`}>
                          {b.label.startsWith('⚠') && <AlertTriangle className="w-2.5 h-2.5" />}
                          {b.label.replace('⚠ ', '')}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
