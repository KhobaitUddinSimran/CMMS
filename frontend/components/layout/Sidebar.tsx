'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  Home, BookOpen, BarChart3, MessageSquare, User, Table, Settings,
  Users, Building2, Download, FileText, Lock, Database, LogOut
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
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  coordinator: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Courses', path: '/courses' },
    { icon: <Users className="w-5 h-5" />, label: 'Roster Management', path: '/roster' },
    { icon: <Settings className="w-5 h-5" />, label: 'Assessment Config', path: '/assessment-config' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Reports', path: '/reports' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  hod: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Departments', path: '/departments' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
    { icon: <Download className="w-5 h-5" />, label: 'Export', path: '/export' },
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
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-full shadow-lg md:shadow-none">
      {/* User mini-card */}
      <div className="p-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C90031] to-[#8F0022] text-white flex items-center justify-center text-[14px] font-bold shrink-0">
            {user?.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#111827] truncate">{user?.name}</p>
            <p className="text-[12px] text-[#6B7280] capitalize">{displayRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all duration-200 cursor-pointer
                ${active
                  ? 'bg-[#C90031] text-white font-semibold border-l-4 border-[#C90031]'
                  : 'text-[#6B7280] hover:bg-[#FFF0F3] border-l-4 border-transparent'
                }`}
            >
              <span className="flex items-center shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[#E5E7EB] p-4 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all duration-200 cursor-pointer">
          <Settings className="w-5 h-5 shrink-0" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all duration-200 cursor-pointer font-medium"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
