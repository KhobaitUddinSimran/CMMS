'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  Home, BookOpen, BarChart3, MessageSquare, User, Table, Settings,
  Users, Building2, Download, FileText, Lock, Database, LogOut, Flag, CalendarDays
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
}

const navByRole: Record<UserRole, NavItem[]> = {
  student: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'My Courses', path: '/courses' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'My Marks', path: '/marks' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Queries', path: '/queries' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  lecturer: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'My Courses', path: '/courses' },
    { icon: <Users className="w-5 h-5" />, label: 'Roster Upload', path: '/roster' },
    { icon: <Table className="w-5 h-5" />, label: 'Smart Grid', path: '/smart-grid' },
    { icon: <Settings className="w-5 h-5" />, label: 'Assessment Setup', path: '/assessment-setup' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Queries', path: '/queries' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', path: '/messages' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  coordinator: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Courses', path: '/courses' },
    { icon: <Users className="w-5 h-5" />, label: 'Roster Management', path: '/roster' },
    { icon: <Settings className="w-5 h-5" />, label: 'Assessment Config', path: '/assessment-config' },
    { icon: <CalendarDays className="w-5 h-5" />, label: 'Semester Timeline', path: '/semester-timeline' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', path: '/messages' },
    { icon: <Flag className="w-5 h-5" />, label: 'Flagged Marks', path: '/flagged-marks' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Reports', path: '/reports' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  hod: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Departments', path: '/departments' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
    { icon: <Download className="w-5 h-5" />, label: 'Export', path: '/export' },
    { icon: <Flag className="w-5 h-5" />, label: 'Flagged Marks', path: '/flagged-marks' },
    { icon: <FileText className="w-5 h-5" />, label: 'Audit Log', path: '/audit-log' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  admin: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users className="w-5 h-5" />, label: 'Pending Approvals', path: '/dashboard/admin/approvals' },
    { icon: <Users className="w-5 h-5" />, label: 'Users', path: '/users' },
    { icon: <Lock className="w-5 h-5" />, label: 'Roles & Permissions', path: '/roles' },
    { icon: <Database className="w-5 h-5" />, label: 'Database', path: '/database' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
    { icon: <FileText className="w-5 h-5" />, label: 'System Logs', path: '/system-logs' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
}

interface SidebarProps {
  role: UserRole | UserRole[]
  isOpen?: boolean
}

export function Sidebar({ role, isOpen = true }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()

  // Merge nav items from all applicable roles, deduplicated by path.
  // Order: base role first, then special roles (coordinator, hod) appended.
  const roles: UserRole[] = Array.isArray(role) ? role : [role]
  const seenPaths = new Set<string>()
  const items: NavItem[] = []
  for (const r of roles) {
    const roleItems = navByRole[r] || []
    for (const item of roleItems) {
      if (!seenPaths.has(item.path)) {
        seenPaths.add(item.path)
        items.push(item)
      }
    }
  }

  // Display label in user card: show all active roles joined
  const displayRole = roles.join(' + ')

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isOpen) return null

  return (
    <aside className="w-60 bg-white border-r border-[#E8EAED] flex flex-col h-full">
      {/* User mini-card */}
      <div className="px-4 py-4 border-b border-[#F0F2F5]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C90031] text-white flex items-center justify-center text-[12px] font-bold shrink-0 tracking-wide">
            {user?.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-[#0F172A] truncate leading-tight">{user?.name}</p>
            <p className="text-[11.5px] text-[#94A3B8] capitalize mt-0.5 leading-tight">{displayRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto px-2">
        {items.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 cursor-pointer mb-0.5
                ${active
                  ? 'bg-[#FFF0F3] text-[#C90031] border-l-[3px] border-[#C90031] pl-[9px]'
                  : 'text-[#475569] hover:bg-[#F8F9FB] hover:text-[#0F172A] border-l-[3px] border-transparent pl-[9px]'
                }`}
            >
              <span className={`flex items-center shrink-0 ${active ? 'text-[#C90031]' : 'text-[#94A3B8]'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[#F0F2F5] px-2 py-3 space-y-0.5">
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8F9FB] border-l-[3px] border-transparent pl-[9px] transition-all duration-150 cursor-pointer"
        >
          <Settings className="w-4 h-4 shrink-0 text-[#94A3B8]" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] border-l-[3px] border-transparent pl-[9px] transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
