'use client'

import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Users, Settings, BarChart3, Shield } from 'lucide-react'

export default function AdminDashboard() {

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">
          System Administration
        </h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Complete system control and user management
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Total Users</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">2,847</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-[#C90031]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">System Status</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">Online</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">API Usage</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">64%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7 text-[#F59E0B]" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">Active Sessions</p>
              <p className="text-[32px] font-bold text-[#111827] mt-2">342</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Settings className="w-7 h-7 text-[#3B82F6]" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-[#111827]">User Management</h2>
            <button className="px-4 py-2 bg-[#C90031] text-white rounded-lg text-[14px] font-medium hover:bg-[#A80028] transition-colors">
              Add User
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { role: 'Students', count: 1248, status: 'good' },
              { role: 'Lecturers', count: 87, status: 'good' },
              { role: 'Coordinators', count: 12, status: 'good' },
              { role: 'HOD', count: 8, status: 'good' },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between py-3 px-3 bg-[#F9FAFB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <span className="text-[#111827]">{item.role}</span>
                <Badge variant="role">{item.count} users</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">System Settings</h2>
          <div className="space-y-3">
            {[
              { setting: 'Database Backup', status: 'good', lastRun: '2 hours ago' },
              { setting: 'Security Scan', status: 'good', lastRun: '6 hours ago' },
              { setting: 'Cache Clear', status: 'good', lastRun: '1 day ago' },
            ].map((item) => (
              <div key={item.setting} className="py-2 border-b border-[#E5E7EB] last:border-b-0">
                <p className="text-[#111827] font-medium">{item.setting}</p>
                <p className="text-[12px] text-[#6B7280]">Last: {item.lastRun}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
