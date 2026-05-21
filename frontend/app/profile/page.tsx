'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Mail, Shield, Calendar, Pencil, X, Check, Lock, Hash, CreditCard } from 'lucide-react'
import { getCurrentUser, updateProfile, type UserData } from '@/lib/api/users'
import { useToastStore } from '@/stores/toastStore'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { addToast } = useToastStore()

  const [profileData, setProfileData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setProfileData(data)
        setEditName(data.full_name || '')
      })
      .catch(() => {
        if (user) setEditName(user.name || '')
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const updated = await updateProfile({ full_name: editName.trim() })
      setProfileData(updated)
      setEditMode(false)
      addToast('Profile updated successfully', 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setEditName(profileData?.full_name || user?.name || '')
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  const displayName  = profileData?.full_name || user?.name || 'User'
  const initials     = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const displayRole  = profileData?.role || user?.role || '—'
  const displayEmail = profileData?.email || user?.email || '—'
  const isStudent    = displayRole === 'student'
  const isLecturer   = displayRole === 'lecturer'

  const infoRows = [
    {
      icon: <Mail className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Email Address',
      value: displayEmail,
      always: true,
    },
    {
      icon: <Shield className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Role',
      value: <span className="capitalize">{displayRole}{profileData?.special_roles?.length ? ` (${profileData.special_roles.join(', ')})` : ''}</span>,
      always: true,
    },
    {
      icon: <Hash className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Matric Number',
      value: profileData?.matric_number || '—',
      show: isStudent,
    },
    {
      icon: <CreditCard className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Max Teaching Credits',
      value: profileData?.max_teaching_credits != null ? `${profileData.max_teaching_credits} credits/semester` : 'No limit set',
      show: isLecturer,
    },
    {
      icon: <Calendar className="w-5 h-5 text-[#9CA3AF]" />,
      label: 'Member Since',
      value: formatDate(profileData?.created_at),
      always: true,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="pt-4">
          <h1 className="text-[32px] font-bold text-[#111827]">User Profile</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">Manage your account information</p>
        </div>

        {loading ? (
          <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
        ) : (
          <Card>
            <div className="space-y-6">
              {/* Avatar + name */}
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-xl bg-[#C90031] flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">{initials || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancelEdit() }}
                        className="text-[20px] font-bold text-[#111827] border-b-2 border-[#C90031] outline-none bg-transparent flex-1 min-w-0"
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving || !editName.trim()}
                        className="p-1.5 rounded-lg bg-[#C90031] text-white hover:bg-[#A80028] disabled:opacity-50 flex-shrink-0"
                      >
                        {saving ? <Spinner /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] font-bold text-[#111827] truncate">{displayName}</h2>
                      <button
                        onClick={() => setEditMode(true)}
                        className="p-1 rounded text-[#D1D5DB] hover:text-[#C90031] flex-shrink-0"
                        title="Edit name"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-[13px] text-[#6B7280] capitalize mt-0.5">{displayRole}</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="grid gap-2.5">
                {infoRows
                  .filter(r => r.always || r.show)
                  .map((row, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-lg">
                      <div className="flex-shrink-0">{row.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">{row.label}</p>
                        <p className="text-[14px] font-medium text-[#111827] break-all mt-0.5">{row.value}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Account status badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ${
                  profileData?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${profileData?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  {profileData?.is_active ? 'Active account' : 'Inactive account'}
                </span>
                {profileData?.email_verified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-blue-100 text-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Email verified
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-[#E5E7EB]">
                <button
                  onClick={() => setEditMode(true)}
                  disabled={editMode}
                  className="flex items-center gap-2 px-5 py-2 bg-[#C90031] hover:bg-[#A80028] text-white font-medium text-[14px] rounded-lg transition-colors disabled:opacity-40"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Name
                </button>
                <button
                  onClick={() => router.push('/password-change')}
                  className="flex items-center gap-2 px-5 py-2 border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#111827] font-medium text-[14px] rounded-lg transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
