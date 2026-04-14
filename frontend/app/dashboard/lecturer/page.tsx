'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Users, BookOpen, BarChart3, CheckCircle } from 'lucide-react'

export default function LecturerDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          Welcome, {user?.name}!
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Manage courses and monitor student carry marks
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Courses Teaching</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">3</p>
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
              <p className="text-[32px] font-bold text-[#111827] mt-2">142</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Marks Submitted</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">89%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Avg Performance</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">76%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Courses List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#111827]">Your Courses</h2>
          <button className="px-4 py-2 bg-[#C90031] text-white rounded-lg text-[14px] font-medium hover:bg-[#A80028] transition-colors">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            { code: 'CS101', name: 'Programming Fundamentals', students: 45, marksSubmitted: true },
            { code: 'CS102', name: 'Data Structures', students: 48, marksSubmitted: false },
            { code: 'CS103', name: 'Database Systems', students: 49, marksSubmitted: true },
          ].map((course) => (
            <div key={course.code} className="p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#111827]">{course.name}</p>
                  <p className="text-[12px] text-[#6B7280]">{course.code} • {course.students} students</p>
                </div>
                <Badge variant={course.marksSubmitted ? 'published' : 'delayed'}>
                  {course.marksSubmitted ? 'Submitted' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
