'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Mail, Shield, Calendar, Pencil, X, Check, Lock } from 'lucide-react'
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
        if (user) {
          setEditName(user.name || '')
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateProfile({ full_name: editName.trim() } as any)
      setProfileData((prev) => prev ? { ...prev, full_name: editName.trim() } : prev)
      setEditMode(false)
      addToast('Profile updated successfully', 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  const displayName = profileData?.full_name || user?.name || 'User'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const displayRole = profileData?.role || user?.role || '—'
  const displayEmail = profileData?.email || user?.email || '—'

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">User Profile</h1>
        <p className="text-[16px] text-[#6B7280] mt-2">Manage your account information</p>
      </div>

      {loading ? (
        <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
      ) : (
        <Card>
          <div className="space-y-6">
            {/* Avatar + name */}
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-xl bg-[#C90031] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{initials || 'U'}</span>
              </div>
              <div className="flex-1">
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-[22px] font-bold text-[#111827] border-b-2 border-[#C90031] outline-none bg-transparent w-full max-w-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditMode(false) }}
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-1.5 rounded-lg bg-[#C90031] text-white hover:bg-[#A80028] disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setEditName(profileData?.full_name || user?.name || '') }}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-bold text-[#111827]">{displayName}</h2>
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-1 rounded text-[#9CA3AF] hover:text-[#C90031]"
                      title="Edit name"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-[14px] text-[#6B7280] capitalize mt-1">{displayRole}</p>
              </div>
            </div>

            {/* Info rows */}
            <div className="grid gap-3 pt-2">
              <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-lg">
                <Mail className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#6B7280]">Email Address</p>
                  <p className="text-[14px] font-medium text-[#111827] break-all">{displayEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-lg">
                <Shield className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-[#6B7280]">Role</p>
                  <p className="text-[14px] font-medium text-[#111827] capitalize">{displayRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-lg">
                <Calendar className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-[#6B7280]">Member Since</p>
                  <p className="text-[14px] font-medium text-[#111827]">{formatDate(profileData?.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-5 py-2 bg-[#C90031] hover:bg-[#A80028] text-white font-medium text-[14px] rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
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
  )
}
