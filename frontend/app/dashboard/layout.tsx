// Dashboard Shell Layout - Header + Sidebar + Content area for all authenticated pages
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/contexts/auth-context'
import '@/styles/dashboard.css'
import type { UserRole } from '@/types/auth'

// Compute effective display role for Header (single, highest-priority role).
function getEffectiveRole(user: any): UserRole {
  if (!user) return 'student'
  const specialRoles: string[] = user.special_roles || []
  if (specialRoles.includes('hod')) return 'hod'
  if (specialRoles.includes('coordinator')) return 'coordinator'
  return user.role || 'student'
}

// Compute ALL applicable roles for Sidebar merging.
// A lecturer with both special_roles gets lecturer + coordinator + hod nav combined.
function getEffectiveRoles(user: any): UserRole[] {
  if (!user) return ['student']
  const base: UserRole = user.role || 'student'
  const specialRoles: UserRole[] = (user.special_roles || []) as UserRole[]
  // Base role first, then special roles appended (deduplicated downstream)
  return [base, ...specialRoles]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, getCurrentUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const effectiveRole = getEffectiveRole(user)
  const effectiveRoles = getEffectiveRoles(user)

  // Client-side redirect for authentication check - moved to useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isAuthenticated || !user) {
        router.push('/')
      } else {
        setIsCheckingAuth(false)
      }
    }
  }, [isAuthenticated, user, router])

  // Refresh user profile on mount so special_roles from admin changes propagate
  // without requiring logout/login
  useEffect(() => {
    if (isAuthenticated) {
      getCurrentUser().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="dashboard-content">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - hidden on mobile by default */}
        <div className={`fixed md:relative md:flex z-40 ${sidebarOpen ? 'flex' : 'hidden md:flex'}`}>
          <Sidebar isOpen={true} role={effectiveRoles} />
        </div>
        
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  )
}
