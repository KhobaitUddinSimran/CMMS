'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, GraduationCap, BookOpen, AlertCircle, Activity, Mail,
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { getHodStats, getAdminStats, getAuditLogs, type HodStats, type AdminStats, type AuditLogEntry } from '@/lib/api/admin'

interface BarRowProps {
  label: string
  value: number
  total: number
  color: string
}

function BarRow({ label, value, total, color }: BarRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-[#374151]">{label}</span>
        <span className="text-[13px] tabular-nums text-[#6B7280]">
          <span className="font-semibold text-[#111827]">{value.toLocaleString()}</span>
          {total > 0 && <span className="ml-2 text-[#9CA3AF]">({pct}%)</span>}
        </span>
      </div>
      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [hodStats, setHodStats] = useState<HodStats | null>(null)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [recent, setRecent] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([getHodStats(), getAdminStats(), getAuditLogs({ limit: 10, offset: 0 })])
      .then(([h, a, l]) => {
        if (cancelled) return
        if (h.status === 'fulfilled') setHodStats(h.value)
        if (a.status === 'fulfilled') setAdminStats(a.value)
        if (l.status === 'fulfilled') setRecent(l.value.logs || [])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const fmt = (n?: number) => loading ? '…' : (n ?? 0).toLocaleString()

  // Derived breakdowns from adminStats
  const totalUsers = adminStats?.total_users ?? 0
  const totalFaculty = (adminStats?.lecturers ?? 0) + (adminStats?.coordinators ?? 0) + (adminStats?.hods ?? 0)

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Department Analytics</h1>
          <p className="text-[#6B7280] mt-1">Real-time overview of users, courses, and recent activity</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Students', value: fmt(hodStats?.total_students), icon: GraduationCap, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]' },
          { label: 'Faculty Members', value: fmt(hodStats?.total_faculty), icon: Users, bg: 'bg-[#EFF6FF]', color: 'text-[#3B82F6]' },
          { label: 'Active Courses', value: fmt(hodStats?.active_courses), icon: BookOpen, bg: 'bg-[#F5F3FF]', color: 'text-[#7C3AED]' },
          { label: 'Flagged Marks', value: fmt(hodStats?.flagged_marks), icon: AlertCircle, bg: 'bg-[#FEF3C7]', color: 'text-[#F59E0B]' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                  <p className="text-[28px] font-bold text-[#111827] mt-2">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {loading ? (
        <Card><div className="flex justify-center py-12"><Spinner size="lg" /></div></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Role Breakdown */}
          <Card>
            <h2 className="text-[16px] font-bold text-[#111827] mb-4">User Role Breakdown</h2>
            <div className="space-y-4">
              <BarRow label="Students" value={adminStats?.students ?? 0} total={totalUsers} color="bg-[#C90031]" />
              <BarRow label="Lecturers" value={adminStats?.lecturers ?? 0} total={totalUsers} color="bg-[#3B82F6]" />
              <BarRow label="Coordinators" value={adminStats?.coordinators ?? 0} total={totalUsers} color="bg-[#7C3AED]" />
              <BarRow label="HODs" value={adminStats?.hods ?? 0} total={totalUsers} color="bg-[#F59E0B]" />
            </div>
            <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">Total Users</span>
              <span className="font-semibold text-[#111827]">{totalUsers.toLocaleString()}</span>
            </div>
          </Card>

          {/* Approval Status */}
          <Card>
            <h2 className="text-[16px] font-bold text-[#111827] mb-4">User Status</h2>
            <div className="space-y-4">
              <BarRow label="Active Accounts" value={adminStats?.active_users ?? 0} total={totalUsers} color="bg-[#10B981]" />
              <BarRow label="Pending Approval" value={adminStats?.pending_approvals ?? 0} total={totalUsers} color="bg-[#F59E0B]" />
              <BarRow
                label="Inactive / Rejected"
                value={Math.max(0, totalUsers - (adminStats?.active_users ?? 0) - (adminStats?.pending_approvals ?? 0))}
                total={totalUsers}
                color="bg-[#9CA3AF]"
              />
            </div>
            <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">Faculty Members (any role)</span>
              <span className="font-semibold text-[#111827]">{totalFaculty.toLocaleString()}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[#111827] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C90031]" /> Recent Activity
          </h2>
          <button
            onClick={() => router.push('/audit-log')}
            className="text-[13px] font-medium text-[#C90031] hover:text-[#A80028] transition-colors"
          >
            View full audit log →
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-sm">No recent activity</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {recent.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-3 text-[13px]">
                <Mail className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <span className="font-medium text-[#111827] flex-shrink-0">{log.action}</span>
                <span className="text-[#6B7280] truncate">
                  by <span className="font-medium">{log.actor_name || log.actor_email || 'system'}</span>
                  {log.entity_type && <> on <span className="font-medium">{log.entity_type}</span></>}
                </span>
                <span className="ml-auto text-[12px] text-[#9CA3AF] tabular-nums flex-shrink-0">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
