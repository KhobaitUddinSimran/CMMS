'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { BookOpen, TrendingUp, AlertCircle, Clock } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Track your carry marks and academic performance
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Courses Enrolled */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Courses Enrolled</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">5</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Average Score</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">78%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        {/* At Risk Courses */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">At Risk Courses</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">1</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>

        {/* Last Updated */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Last Updated</p>
              <p className="text-[16px] font-semibold text-[#111827] mt-2">Today</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7 text-[#3B82F6]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#111827]">Your Courses</h2>
          <button className="px-4 py-2 bg-[#C90031] text-white rounded-lg text-[14px] font-medium hover:bg-[#A80028] transition-colors">
            View All
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left py-4 px-6 font-semibold text-[#6B7280]">Course Code</th>
                <th className="text-left py-4 px-6 font-semibold text-[#6B7280]">Course Name</th>
                <th className="text-left py-4 px-6 font-semibold text-[#6B7280]">Credits</th>
                <th className="text-left py-4 px-6 font-semibold text-[#6B7280]">Carry Marks</th>
                <th className="text-left py-4 px-6 font-semibold text-[#6B7280]">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: 'CS101', name: 'Programming Fundamentals', credits: 3, marks: 85, status: 'good' },
                { code: 'CS102', name: 'Data Structures', credits: 4, marks: 92, status: 'good' },
                { code: 'CS103', name: 'Database Systems', credits: 3, marks: 78, status: 'good' },
                { code: 'CS104', name: 'Web Development', credits: 3, marks: 65, status: 'warning' },
                { code: 'CS105', name: 'Software Engineering', credits: 4, marks: 88, status: 'good' },
              ].map((course) => (
                <tr key={course.code} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-4 px-6 font-mono font-semibold text-[#111827]">{course.code}</td>
                  <td className="py-4 px-6 text-[#111827]">{course.name}</td>
                  <td className="py-4 px-6 text-[#111827]">{course.credits}</td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-[#111827]">{course.marks}%</span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={course.status === 'warning' ? 'delayed' : 'published'}>
                      {course.status === 'warning' ? 'At Risk' : 'Good'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
