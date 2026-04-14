'use client'

import { useState } from 'react'
import { Alert } from '@/components/common/Alert'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordChangePage() {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Failed to change password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 border-l-4 border-blue-600">
      <div className="w-full max-w-[500px] bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#C90031] text-white flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#111827]">Change Password</h1>
            <p className="text-[12px] text-[#6B7280]">Update your account password</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert
              type="error"
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert
              type="success"
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[#111827]">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-10 border border-[#D1D5DB] rounded-lg px-3 pr-10 text-[14px] placeholder-[#9CA3AF] 
                  transition-colors outline-none focus:border-[#C90031] focus:ring-1 focus:ring-[#C90031]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[#111827]">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full h-10 border border-[#D1D5DB] rounded-lg px-3 pr-10 text-[14px] placeholder-[#9CA3AF] 
                  transition-colors outline-none focus:border-[#C90031] focus:ring-1 focus:ring-[#C90031]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(passwordStrength / 4) * 100}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
                <span className="text-[12px] font-medium" style={{ color: strengthColor }}>
                  {strengthText}
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#6B7280]">
              • At least 8 characters
              <br />
              • Mix of uppercase & lowercase
              <br />
              • Numbers & special characters recommended
            </p>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[#111827]">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-10 border border-[#D1D5DB] rounded-lg px-3 pr-10 text-[14px] placeholder-[#9CA3AF] 
                  transition-colors outline-none focus:border-[#C90031] focus:ring-1 focus:ring-[#C90031]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setError('')
              }}
              className="flex-1 h-10 border border-[#D1D5DB] rounded-lg font-medium text-[14px] 
                transition-colors hover:bg-[#F9FAFB] text-[#111827]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-10 bg-[#C90031] text-white rounded-lg font-medium text-[14px] 
                transition-colors hover:bg-[#A80028] active:bg-[#8F0022] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
