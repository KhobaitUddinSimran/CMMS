'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  Home, BookOpen, BarChart3, MessageSquare, User, Table, Settings,
  Users, Building2, Download, FileText, Lock, Database, LogOut, Flag, CalendarDays, Mail, Layers,
  Upload, HelpCircle, UserCheck, ChevronsLeft, ChevronsRight
} from 'lucide-react'
import type { UserRole } from '@/types'
import { listMessages } from '@/lib/api/messages'

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
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Queries', path: '/queries' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  lecturer: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'My Courses', path: '/courses' },
    { icon: <Upload className="w-5 h-5" />, label: 'Roster Upload', path: '/roster' },
    { icon: <Table className="w-5 h-5" />, label: 'Mark Entry', path: '/smart-grid' },
    { icon: <Settings className="w-5 h-5" />, label: 'Assessment Setup', path: '/assessment-setup' },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Queries', path: '/queries' },
    { icon: <Mail className="w-5 h-5" />, label: 'Messages', path: '/messages' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  coordinator: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Courses', path: '/courses' },
    { icon: <Layers className="w-5 h-5" />, label: 'Course Management', path: '/course-management' },
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
    { icon: <Mail className="w-5 h-5" />, label: 'Messages', path: '/messages' },
    { icon: <FileText className="w-5 h-5" />, label: 'Audit Log', path: '/audit-log' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  ],
  admin: [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <UserCheck className="w-5 h-5" />, label: 'Pending Approvals', path: '/dashboard/admin/approvals' },
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
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ role, isOpen = true, collapsed = false, onToggleCollapse }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const hasMessages = Array.isArray(role)
      ? role.some(r => navByRole[r]?.some(i => i.path === '/messages'))
      : navByRole[role as UserRole]?.some(i => i.path === '/messages')
    if (!hasMessages) return
    let cancelled = false
    listMessages().then(data => {
      if (!cancelled) setUnreadCount((data as any).unread_count || 0)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

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

  // Display label in user card: deduplicated unique roles joined
  const displayRole = [...new Set(roles)].join(' + ')

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isOpen) return null

  const widthClass = collapsed ? 'w-[60px]' : 'w-60'

  return (
    <aside
      className={`${widthClass} bg-white border-r border-[#E8EAED] flex flex-col h-full transition-[width] duration-200 ease-in-out`}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {/* User mini-card */}
      <div className={`border-b border-[#F0F2F5] ${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="w-9 h-9 rounded-full bg-[#C90031] text-white flex items-center justify-center text-[12px] font-bold shrink-0 tracking-wide"
            title={collapsed ? `${user?.name} — ${displayRole}` : undefined}
          >
            {user?.initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-[#0F172A] truncate leading-tight">{user?.name}</p>
              <p className="text-[11.5px] text-[#94A3B8] capitalize mt-0.5 leading-tight">{displayRole}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-2 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {items.map(item => {
          const active = isActive(item.path)
          if (collapsed) {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                title={item.label}
                className={`relative w-full flex items-center justify-center h-10 rounded-lg transition-all duration-150 cursor-pointer mb-0.5
                  ${active
                    ? 'bg-[#FFF0F3] text-[#C90031]'
                    : 'text-[#475569] hover:bg-[#F8F9FB] hover:text-[#0F172A]'
                  }`}
              >
                <span className={`shrink-0 ${active ? 'text-[#C90031]' : 'text-[#94A3B8]'}`}>
                  {item.icon}
                </span>
                {item.path === '/messages' && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold bg-[#C90031] text-white rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1 shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )
          }
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
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.path === '/messages' && unreadCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-[#C90031] text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className={`border-t border-[#F0F2F5] py-2 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {collapsed ? (
          <>
            <button
              onClick={() => router.push('/settings')}
              title="Settings"
              className="w-full flex items-center justify-center h-10 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8F9FB] transition-all duration-150 cursor-pointer"
            >
              <Settings className="w-4 h-4 shrink-0 text-[#94A3B8]" />
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-full flex items-center justify-center h-10 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-all duration-150 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </>
        ) : (
          <>
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
          </>
        )}

        {/* Collapse / expand toggle — desktop only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden md:flex w-full items-center ${collapsed ? 'justify-center' : 'justify-end'} mt-1 px-2 py-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB] transition-all duration-150 cursor-pointer`}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  )
}
