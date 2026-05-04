// Unified authenticated layout shell — Header + collapsible Sidebar + content area.
// Used by both `app/dashboard/layout.tsx` and `components/layout/MainLayout.tsx`,
// so EVERY authenticated page gets the same navigation structure.
'use client'

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/lib/contexts/auth-context'
import '@/styles/dashboard.css'
import type { UserRole } from '@/types/auth'

const SIDEBAR_COLLAPSED_KEY = 'cmms.sidebar.collapsed'

// Compute effective display role for Header (single, highest-priority role).
function getEffectiveRole(user: any): UserRole {
  if (!user) return 'student'
  const specialRoles: string[] = user.special_roles || []
  if (specialRoles.includes('hod')) return 'hod'
  if (specialRoles.includes('coordinator')) return 'coordinator'
  return user.role || 'student'
}

// Compute ALL applicable roles for Sidebar nav merging.
function getEffectiveRoles(user: any): UserRole[] {
  if (!user) return ['student']
  const base: UserRole = user.role || 'student'
  const specialRoles: UserRole[] = (user.special_roles || []) as UserRole[]
  return [base, ...specialRoles]
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, getCurrentUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [mounted, setMounted] = useState(false)

  const effectiveRole = getEffectiveRole(user)
  const effectiveRoles = getEffectiveRoles(user)

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {}
  }, [])

  // Persist collapsed state
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {}
  }, [collapsed, mounted])

  // Auth check — only runs after Zustand hydrates from localStorage
  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated || !user) {
      window.location.href = '/auth/login'
    } else {
      setIsCheckingAuth(false)
    }
  }, [isAuthenticated, user, mounted])

  // Refresh user profile so special_roles updates propagate
  useEffect(() => {
    if (isAuthenticated) {
      getCurrentUser().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0F2F5]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-[#C90031]"></div>
          <p className="mt-3 text-[13.5px] text-[#64748B] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <Header
        title="Dashboard"
        userName={user?.name || 'User'}
        userInitials={user?.initials || 'U'}
        role={effectiveRole}
        onMenuToggle={() => setMobileOpen(o => !o)}
      />
      <div className="dashboard-content">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className={`fixed md:relative md:flex z-40 h-full ${mobileOpen ? 'flex' : 'hidden md:flex'}`}>
          <Sidebar
            isOpen={true}
            role={effectiveRoles}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(c => !c)}
          />
        </div>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  )
}
