// Password Change Form - Forced password change on first login
'use client'

import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export const PasswordChangeForm: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Min 8 characters'
    if (!/[A-Z]/.test(pwd)) return 'Needs uppercase letter'
    if (!/[0-9]/.test(pwd)) return 'Needs number'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!oldPassword) newErrors.oldPassword = 'Required'
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords must match'
    const pwdError = validatePassword(newPassword)
    if (pwdError) newErrors.newPassword = pwdError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    // Call API to change password
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="password-change-form">
      <h1>Change Your Password</h1>
      <p>You must change your password on first login</p>
      <Input
        label="Old Password"
        type="password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        error={errors.oldPassword}
        required
      />
      <Input
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={errors.newPassword}
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        required
      />
      <Button type="submit" loading={loading}>
        Update Password
      </Button>
    </form>
  )
}
