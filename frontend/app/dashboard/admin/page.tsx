'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Users, Shield, UserCheck, BookOpen, FileText, Lock } from 'lucide-react'
import { getAdminStats, type AdminStats } from '@/lib/api/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const quickActions = [
    { label: 'Pending Approvals', href: '/dashboard/admin/approvals', icon: UserCheck, color: 'bg-orange-100 text-orange-600', badge: stats?.pending_approvals },
    { label: 'All Users', href: '/users', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Role Management', href: '/dashboard/admin/roles', icon: Lock, color: 'bg-purple-100 text-purple-600' },
    { label: 'System Logs', href: '/system-logs', icon: FileText, color: 'bg-gray-100 text-gray-600' },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">System Administration</h1>
        <p className="text-[16px] text-[#6B7280] mt-2">Complete system control and user management</p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Users</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{loading ? '…' : (stats?.total_users ?? 0).toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Active Users</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{loading ? '…' : (stats?.active_users ?? 0).toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Pending Approvals</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{loading ? '…' : (stats?.pending_approvals ?? 0).toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Courses</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{loading ? '…' : (stats?.total_courses ?? 0).toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[#3B82F6]" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-[20px] font-bold text-[#111827] mb-6">User Distribution</h2>
          <div className="space-y-3">
            {[
              { role: 'Students', count: stats?.students ?? 0 },
              { role: 'Lecturers', count: stats?.lecturers ?? 0 },
              { role: 'Coordinators', count: stats?.coordinators ?? 0 },
              { role: 'HOD', count: stats?.hods ?? 0 },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between py-3 px-3 bg-[#F9FAFB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <span className="text-[#111827]">{item.role}</span>
                <Badge variant="role">{loading ? '…' : `${item.count.toLocaleString()} users`}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-[20px] font-bold text-[#111827] mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="relative flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-[14px] font-medium text-[#111827] text-center">{action.label}</span>
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
