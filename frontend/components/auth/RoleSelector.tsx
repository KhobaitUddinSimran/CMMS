'use client'

import React from 'react'
import type { LoginRole } from '@/types/auth'

interface RoleSelectorProps {
  selected?: LoginRole
  onChange: (role: LoginRole) => void
  disabled?: boolean
  signupMode?: boolean // When true, only show student/lecturer (no admin)
}

const roles: { value: LoginRole; label: string; description: string; gradient: string }[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'Enrollment & Marks',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    value: 'lecturer',
    label: 'Lecturer',
    description: 'Course Management',
    gradient: 'from-green-500 to-green-600',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'System Administration',
    gradient: 'from-yellow-500 to-yellow-600',
  },
]

export function RoleSelector({ selected, onChange, disabled = false, signupMode = false }: RoleSelectorProps) {
  // Signup: only student/lecturer. Login: student/lecturer/admin.
  // Coordinator & HOD are never shown — they are special roles assigned by admin to lecturers.
  const visibleRoles = signupMode ? ['student', 'lecturer'] : ['student', 'lecturer', 'admin']

  return (
    <div className="space-y-3">
      {roles
        .filter((r) => visibleRoles.includes(r.value))
        .map((role) => (
          <button
            key={role.value}
            onClick={() => onChange(role.value)}
            disabled={disabled}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selected === role.value
                ? `border-${role.value}-600 bg-gradient-to-r ${role.gradient} text-white shadow-lg`
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-semibold">{role.label}</p>
                <p className={`text-sm ${selected === role.value ? 'text-blue-100' : 'text-gray-600'}`}>
                  {role.description}
                </p>
              </div>
              {selected === role.value && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
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
