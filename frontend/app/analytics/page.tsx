'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, GraduationCap, BookOpen, AlertCircle, Activity, RefreshCw,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { getHodStats, getAdminStats, getAuditLogs, type HodStats, type AdminStats, type AuditLogEntry } from '@/lib/api/admin'

const ACTION_BADGE: Record<string, string> = {
  USER_APPROVED: 'bg-green-100 text-green-700',
  USER_REJECTED: 'bg-red-100 text-red-700',
  USER_ACTIVATED: 'bg-green-100 text-green-700',
  USER_DEACTIVATED: 'bg-orange-100 text-orange-700',
  SPECIAL_ROLE_ASSIGNED: 'bg-purple-100 text-purple-700',
  SPECIAL_ROLE_REVOKED: 'bg-pink-100 text-pink-700',
  COURSE_CREATED: 'bg-blue-100 text-blue-700',
  COURSE_UPDATED: 'bg-blue-100 text-blue-700',
  ENROLLMENT_ADDED: 'bg-cyan-100 text-cyan-700',
  ENROLLMENT_DROPPED: 'bg-gray-100 text-gray-700',
  MARK_PUBLISHED: 'bg-indigo-100 text-indigo-700',
  MARK_UPDATED: 'bg-indigo-100 text-indigo-700',
  MARK_UNFLAGGED: 'bg-teal-100 text-teal-700',
  QUERY_SUBMITTED: 'bg-yellow-100 text-yellow-700',
  QUERY_RESPONDED: 'bg-blue-100 text-blue-700',
}

interface BarRowProps { label: string; value: number; total: number; color: string }

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
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
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
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.allSettled([getHodStats(), getAdminStats(), getAuditLogs({ limit: 10, offset: 0 })])
      .then(([h, a, l]) => {
        if (h.status === 'fulfilled') setHodStats(h.value)
        if (a.status === 'fulfilled') setAdminStats(a.value)
        if (l.status === 'fulfilled') setRecent(l.value.logs || [])
        setRefreshedAt(new Date().toLocaleTimeString())
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const fmt = (n?: number) => loading ? '…' : (n ?? 0).toLocaleString()
  const totalUsers = adminStats?.total_users ?? 0
  const totalFaculty = (adminStats?.lecturers ?? 0) + (adminStats?.coordinators ?? 0) + (adminStats?.hods ?? 0)

  const statCards = [
    { label: 'Total Students', value: fmt(hodStats?.total_students), icon: GraduationCap, bg: 'bg-[#FEE2E2]', color: 'text-[#C90031]', path: '/users' },
    { label: 'Faculty Members', value: fmt(hodStats?.total_faculty), icon: Users, bg: 'bg-[#EFF6FF]', color: 'text-[#3B82F6]', path: '/course-management' },
    { label: 'Active Courses', value: fmt(hodStats?.active_courses), icon: BookOpen, bg: 'bg-[#F5F3FF]', color: 'text-[#7C3AED]', path: '/course-management' },
    { label: 'Flagged Marks', value: fmt(hodStats?.flagged_marks), icon: AlertCircle, bg: 'bg-[#FEF3C7]', color: 'text-[#F59E0B]', path: '/flagged-marks' },
  ]

  return (
    <MainLayout>
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Analytics</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">
            Real-time overview of users, courses, and recent activity
            {refreshedAt && <span className="ml-2 text-[#9CA3AF] text-[13px]">· refreshed at {refreshedAt}</span>}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Refresh data"
          className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Stats — clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              onClick={() => router.push(s.path)}
              className="text-left w-full"
            >
              <Card className="hover:shadow-md hover:border-[#C90031]/20 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                    <p className={`text-[28px] font-bold mt-2 ${s.color}`}>{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                </div>
              </Card>
            </button>
          )
        })}
      </div>

      {loading ? (
        <Card><div className="flex justify-center py-12"><Spinner size="lg" /></div></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Role Breakdown */}
          <Card>
            <h2 className="text-[16px] font-bold text-[#111827] mb-5">User Role Breakdown</h2>
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

          {/* Account Status */}
          <Card>
            <h2 className="text-[16px] font-bold text-[#111827] mb-5">Account Status</h2>
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
              <span className="text-[#6B7280]">Faculty Members (all roles)</span>
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
          <div className="divide-y divide-[#F3F4F6]">
            {recent.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-3 text-[13px]">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex-shrink-0 ${ACTION_BADGE[log.action] || 'bg-gray-100 text-gray-700'}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[#6B7280] truncate flex-1">
                  by <span className="font-medium text-[#374151]">{log.actor_name || log.actor_email || 'system'}</span>
                  {log.entity_type && <> on <span className="font-medium">{log.entity_type}</span></>}
                </span>
                <span className="ml-auto text-[12px] text-[#9CA3AF] tabular-nums flex-shrink-0">
                  {log.created_at ? new Date(log.created_at).toLocaleString('en-MY') : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
    </MainLayout>
  )
}
