'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Users, BookOpen, AlertCircle, TrendingUp } from 'lucide-react'

export default function CoordinatorDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          Welcome, {user?.name}!
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Coordinate courses and manage academic schedules
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Courses</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">24</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Students</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">612</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">At Risk Students</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">18</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Completion Rate</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">92%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#111827]">Recent Activities</h2>
          <button className="px-4 py-2 bg-[#C90031] text-white rounded-lg text-[14px] font-medium hover:bg-[#A80028] transition-colors">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            { action: 'Course scheduled', description: 'CS101 - Programming Fundamentals', time: '2 hours ago' },
            { action: 'Marks submitted', description: 'CS102 by Dr. Ahmed', time: '5 hours ago' },
            { action: 'Student alert', description: 'John Doe - Below passing threshold', time: '1 day ago' },
          ].map((activity, idx) => (
            <div key={idx} className="py-3 border-b border-[#E5E7EB] last:border-b-0">
              <p className="font-semibold text-[#111827]">{activity.action}</p>
              <p className="text-[12px] text-[#6B7280]">{activity.description}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">{activity.time}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
