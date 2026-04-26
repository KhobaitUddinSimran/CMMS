'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Users, TrendingUp, BarChart3, AlertCircle, BookOpen, GraduationCap } from 'lucide-react'
import { getHodStats, type HodStats } from '@/lib/api/admin'

export default function HODDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<HodStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHodStats()
      .then(setStats)
      .catch((err) => console.error('HOD stats failed:', err))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n?: number) => loading ? '…' : (n ?? 0).toLocaleString()
  const fmtPct = (n?: number) => loading ? '…' : `${n ?? 0}%`

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          Welcome, {user?.name}!
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Department oversight and performance analytics
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Students</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{fmt(stats?.total_students)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Faculty Members</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{fmt(stats?.total_faculty)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#3B82F6]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Active Courses</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{fmt(stats?.active_courses)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[#7C3AED]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Avg Performance</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{fmtPct(stats?.avg_performance)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Pass Rate</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{fmtPct(stats?.pass_rate)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Flagged Marks</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">{fmt(stats?.flagged_marks)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#111827]">Department Overview</h2>
        </div>

        <div className="space-y-1">
          {[
            { metric: 'Total Students', value: fmt(stats?.total_students) },
            { metric: 'Faculty Members', value: fmt(stats?.total_faculty) },
            { metric: 'Active Courses', value: fmt(stats?.active_courses) },
            { metric: 'Avg Performance', value: fmtPct(stats?.avg_performance) },
            { metric: 'Pass Rate', value: fmtPct(stats?.pass_rate) },
            { metric: 'Flagged Marks', value: fmt(stats?.flagged_marks) },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 px-2 border-b border-[#E5E7EB] last:border-0">
              <span className="text-[14px] text-[#111827]">{item.metric}</span>
              <Badge variant="role">{item.value}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
