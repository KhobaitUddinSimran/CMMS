'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Alert } from '@/components/common/Alert'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { changePassword } from '@/lib/api/users'

export default function PasswordChangePage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return '#EF4444' // red
    if (strength === 2) return '#F59E0B' // yellow
    return '#10B981' // green
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return 'Weak'
    if (strength === 2) return 'Fair'
    if (strength === 3) return 'Good'
    return 'Strong'
  }

  const passwordStrength = calculatePasswordStrength(newPassword)
  const strengthColor = getPasswordStrengthColor(passwordStrength)
  const strengthText = getPasswordStrengthText(passwordStrength)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Please enter your current password')
      return
    }

    if (!newPassword) {
      setError('Please enter a new password')
      return
    }

    if (passwordStrength <= 1) {
      setError('Password is too weak. Please use at least 8 characters with mixed case, numbers, and symbols.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setIsLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess('Password changed successfully! Redirecting…')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => router.push('/profile'), 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to change password. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="pt-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[28px] font-bold text-[#111827]">Change Password</h1>
            <p className="text-[14px] text-[#6B7280]">Update your account password</p>
          </div>
        </div>

        <Card>
          {/* Alerts */}
          {error && (
            <div className="mb-5">
              <Alert type="error" onClose={() => setError('')}>{error}</Alert>
            </div>
          )}
          {success && (
            <div className="mb-5">
              <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#374151]">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-10 border border-[#D1D5DB] rounded-lg px-3 pr-10 text-[14px] placeholder-[#9CA3AF] outline-none focus:border-[#C90031] focus:ring-1 focus:ring-[#C90031] transition-colors"
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#374151]">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-10 border border-[#D1D5DB] rounded-lg px-3 pr-10 text-[14px] placeholder-[#9CA3AF] outline-none focus:border-[#C90031] focus:ring-1 focus:ring-[#C90031] transition-colors"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: strengthColor }} />
                  </div>
                  <span className="text-[11px] font-medium w-12 text-right" style={{ color: strengthColor }}>{strengthText}</span>
                </div>
              )}
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Min 8 chars · Uppercase & lowercase · Numbers recommended
              </p>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#374151]">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full h-10 border rounded-lg px-3 pr-10 text-[14px] placeholder-[#9CA3AF] outline-none focus:ring-1 transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : 'border-[#D1D5DB] focus:border-[#C90031] focus:ring-[#C90031]'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 h-10 border border-[#D1D5DB] rounded-lg font-medium text-[14px] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="flex-1 h-10 bg-[#C90031] text-white rounded-lg font-medium text-[14px] hover:bg-[#A80028] active:bg-[#8F0022] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {isLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  )
}
