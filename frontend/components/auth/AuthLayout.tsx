'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { UserRole } from '@/types/auth'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

const roleColors: Record<UserRole | 'default', { bg: string; border: string; text: string }> = {
  student: { bg: 'from-blue-50 to-blue-100', border: 'border-l-4 border-l-blue-600', text: 'text-blue-600' },
  lecturer: { bg: 'from-green-50 to-green-100', border: 'border-l-4 border-l-green-600', text: 'text-green-600' },
  coordinator: { bg: 'from-purple-50 to-purple-100', border: 'border-l-4 border-l-purple-600', text: 'text-purple-600' },
  hod: { bg: 'from-red-50 to-red-100', border: 'border-l-4 border-l-red-600', text: 'text-red-600' },
  admin: { bg: 'from-yellow-50 to-yellow-100', border: 'border-l-4 border-l-yellow-600', text: 'text-yellow-600' },
  default: { bg: 'from-slate-50 to-slate-100', border: 'border-l-4 border-l-slate-600', text: 'text-slate-600' },
}

function AuthLayoutContent({ children, title, subtitle }: AuthLayoutProps) {
  const searchParams = useSearchParams()
  const roleParam = (searchParams?.get('role') as UserRole) || 'default'
  const colors = roleColors[roleParam as keyof typeof roleColors] || roleColors.default

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md bg-white rounded-lg shadow-lg ${colors.border} overflow-hidden`}>
        {/* Header */}
        <div className="px-8 py-8 text-center border-b border-gray-200">
          <div className="flex justify-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg.split(' ')[0].replace('from-', 'bg-')}`}>
              <span className={`text-xl font-bold ${colors.text}`}>🏫</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title || 'CMMS'}
          </h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-sm text-gray-500">
        <p>UTM - Carry Mark Management System</p>
      </div>
    </div>
  )
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Suspense fallback={null}>
      <AuthLayoutContent title={title} subtitle={subtitle}>{children}</AuthLayoutContent>
    </Suspense>
  )
}

export function getColorByRole(role: UserRole | 'default') {
  return roleColors[role as keyof typeof roleColors] || roleColors.default
}
