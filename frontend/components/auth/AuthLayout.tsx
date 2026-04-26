'use client'

import React, { Suspense } from 'react'
import type { UserRole } from '@/types/auth'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

function AuthLayoutContent({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E5E7EB]">
          {/* Brand accent bar */}
          <div className="h-1 bg-[#C90031]" />

          {/* Header */}
          <div className="px-8 pt-7 pb-6 border-b border-[#F0F2F5]">
            <div className="flex items-center gap-4 mb-5">
              <img
                src="/logos/utm-logo.png"
                alt="UTM"
                className="h-10 w-auto object-contain shrink-0"
              />
              <div className="w-px h-8 bg-[#E5E7EB]" />
              <div>
                <p className="text-[13px] font-bold tracking-widest text-[#C90031] uppercase leading-none">CMMS</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-none">Carry Mark Management System</p>
              </div>
            </div>
            <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight tracking-tight">
              {title || 'Sign In'}
            </h1>
            {subtitle && (
              <p className="text-[13.5px] text-[#64748B] mt-1 leading-snug">{subtitle}</p>
            )}
          </div>

          {/* Content */}
          <div className="px-8 py-7">
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#94A3B8] mt-5">
          Universiti Teknologi Malaysia &mdash; Academic Portal
        </p>
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

export function getColorByRole(_role: UserRole | 'default') {
  return { bg: '', border: '', text: '' }
}
