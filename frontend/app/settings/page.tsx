'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Lock, User, ShieldCheck, LogOut, ChevronRight } from 'lucide-react'
import { getCurrentUser, type UserData } from '@/lib/api/users'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [profileData, setProfileData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setProfileData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const displayName  = profileData?.full_name || user?.name || '—'
  const displayEmail = profileData?.email || user?.email || '—'
  const displayRole  = profileData?.role || user?.role || '—'

  const settingRows = [
    {
      icon: <User className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Edit Profile',
      description: 'Update your display name and view account details',
      onClick: () => router.push('/profile'),
    },
    {
      icon: <Lock className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Change Password',
      description: 'Update your account password',
      onClick: () => router.push('/password-change'),
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="pt-4">
          <h1 className="text-[32px] font-bold text-[#111827]">Settings</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Manage your account preferences</p>
        </div>

        {/* Account summary */}
        <Card>
          <div className="pb-4 border-b border-[#E5E7EB] mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C90031]" />
              <h2 className="text-[14px] font-semibold text-[#111827]">Account</h2>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#C90031] flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-white">
                  {displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[#111827] truncate">{displayName}</p>
                <p className="text-[13px] text-[#6B7280] truncate">{displayEmail}</p>
                <p className="text-[12px] text-[#9CA3AF] capitalize mt-0.5">{displayRole}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Settings links */}
        <Card>
          <div className="pb-4 border-b border-[#E5E7EB] mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#C90031]" />
              <h2 className="text-[14px] font-semibold text-[#111827]">Profile & Security</h2>
            </div>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {settingRows.map((row) => (
              <button
                key={row.label}
                onClick={row.onClick}
                className="w-full flex items-center gap-4 py-3.5 text-left hover:bg-[#F9FAFB] rounded-lg px-1 transition-colors group"
              >
                <div className="flex-shrink-0">{row.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#111827]">{row.label}</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">{row.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#9CA3AF] flex-shrink-0" />
              </button>
            ))}
          </div>
        </Card>

        {/* Sign out */}
        <Card>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 py-3 text-left hover:bg-red-50 rounded-lg px-1 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[#EF4444]">Sign Out</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Sign out of your MarkDesk account</p>
            </div>
          </button>
        </Card>

        <p className="text-center text-[11px] text-[#D1D5DB]">MarkDesk v5.0 · Universiti Teknologi Malaysia</p>
      </div>
    </MainLayout>
  )
}
