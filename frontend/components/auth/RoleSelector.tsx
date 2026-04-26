'use client'

import React from 'react'
import { GraduationCap, BookOpen, ShieldCheck, Check } from 'lucide-react'
import type { LoginRole } from '@/types/auth'

interface RoleSelectorProps {
  selected?: LoginRole
  onChange: (role: LoginRole) => void
  disabled?: boolean
  signupMode?: boolean // When true, only show student/lecturer (no admin)
}

const roles: { value: LoginRole; label: string; description: string; Icon: React.ElementType }[] = [
  { value: 'student',  label: 'Student',  description: 'View enrollments & carry marks', Icon: GraduationCap },
  { value: 'lecturer', label: 'Lecturer', description: 'Manage courses & grade students',  Icon: BookOpen },
  { value: 'admin',    label: 'Admin',    description: 'System administration & users',    Icon: ShieldCheck },
]

export function RoleSelector({ selected, onChange, disabled = false, signupMode = false }: RoleSelectorProps) {
  const visibleRoles = signupMode ? ['student', 'lecturer'] : ['student', 'lecturer', 'admin']

  return (
    <div className="space-y-2.5">
      {roles
        .filter((r) => visibleRoles.includes(r.value))
        .map((role) => {
          const active = selected === role.value
          return (
            <button
              key={role.value}
              onClick={() => onChange(role.value)}
              disabled={disabled}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-lg border transition-all text-left
                ${active
                  ? 'border-[#C90031] bg-[#FFF5F7] shadow-[0_0_0_1px_#C90031]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:bg-[#FAFAFA]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                ${active ? 'bg-[#C90031] text-white' : 'bg-[#F4F5F7] text-[#64748B]'}`}>
                <role.Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-semibold leading-tight ${active ? 'text-[#C90031]' : 'text-[#0F172A]'}`}>
                  {role.label}
                </p>
                <p className="text-[12px] text-[#64748B] mt-0.5 leading-tight">{role.description}</p>
              </div>
              {active && (
                <div className="w-5 h-5 rounded-full bg-[#C90031] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
    </div>
  )
}

export function RoleSelectDropdown({
  selected,
  onChange,
  disabled = false,
}: Omit<RoleSelectorProps, 'signupMode'>) {
  return (
    <select
      value={selected || ''}
      onChange={(e) => onChange(e.target.value as LoginRole)}
      disabled={disabled}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Select a role...</option>
      {roles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  )
}
