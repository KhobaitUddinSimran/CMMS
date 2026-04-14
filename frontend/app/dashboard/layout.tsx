// Dashboard Shell Layout - Header + Sidebar + Content area for all authenticated pages
'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import '@/styles/dashboard.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Client-side redirect for authentication check
  if (typeof window !== 'undefined' && (!isAuthenticated || !user)) {
    router.push('/')
    return null
  }

  return (
    <div className="dashboard-shell">
      <Header 
        title="Dashboard"
        userName={user?.name || 'User'}
        userInitials={user?.initials || 'U'}
        role={user?.role || 'student'}
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
          <Sidebar isOpen={true} role={user?.role || 'student'} />
        </div>
        
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  )
}
