'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card className="p-8">
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">{user?.initials || 'U'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
              <p className="text-gray-600 mt-1 capitalize">{user?.role || 'role'}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4 mt-8">
            {/* Email */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900 break-all">{user?.email || 'Not set'}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium text-gray-900 capitalize">{user?.role || 'Not set'}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium text-gray-900">April 14, 2026</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
              Edit Profile
            </button>
            <button className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-colors">
              Change Password
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
