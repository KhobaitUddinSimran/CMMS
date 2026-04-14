'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Users, TrendingUp, BarChart3, AlertCircle } from 'lucide-react'

export default function HODDashboard() {
  const { user } = useAuth()

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Students</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">1,248</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Avg Performance</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">74%</p>
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
              <p className="text-[32px] font-bold text-[#111827] mt-2">88%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Critical Issues</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">3</p>
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
          <button className="px-4 py-2 bg-[#C90031] text-white rounded-lg text-[14px] font-medium hover:bg-[#A80028] transition-colors">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            { metric: 'Faculty Members', value: '24', status: 'good' },
            { metric: 'Active Courses', value: '48', status: 'good' },
            { metric: 'Student Complaints', value: '2', status: 'warning' },
            { metric: 'Exam Schedules', value: 'On Track', status: 'good' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
              <span className="text-[#111827]">{item.metric}</span>
              <Badge variant="role">{item.value}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
