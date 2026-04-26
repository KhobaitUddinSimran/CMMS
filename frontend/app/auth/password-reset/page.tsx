'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormInput } from '@/components/auth/FormInput'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToastStore } from '@/stores/toastStore'
import { resetPassword as apiResetPassword } from '@/lib/api/auth'

type ResetStep = 'email' | 'check-email' | 'reset-form' | 'success'

function PasswordResetInner() {
  const { resetPassword, loading, error } = useAuth()
  const { addToast } = useToastStore()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [resendCount, setResendCount] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Detect token in URL query params (user arrived via email link)
  useEffect(() => {
    const token = searchParams?.get('token')
    if (token) {
      setResetToken(token)
      setStep('reset-form')
    }
  }, [searchParams])

  // Step 1: Enter Email
  const validateEmail = (): boolean => {
    const errors: Record<string, string> = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) {
      return
    }

    try {
      await resetPassword(email)
      setStep('check-email')
      setTimeLeft(600)
    } catch (err: any) {
      console.error('Reset password request error:', err)
    }
  }

  // Countdown timer for check-email step
  useEffect(() => {
    if (step !== 'check-email') return

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [step])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleResend = async () => {
    if (!canResend) return

    try {
      await resetPassword(email)
      setResendCount((prev) => prev + 1)
      setTimeLeft(600)
      setCanResend(false)
      addToast('Reset link resent to your email', 'success')
    } catch (err: any) {
      console.error('Resend error:', err)
    }
  }

  // Step 1: Email Entry
  if (step === 'email') {
    return (
      <AuthLayout title="Reset Password" subtitle="Enter your email to get started">
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setValidationErrors((prev) => ({ ...prev, email: '' }))
            }}
            error={validationErrors.email}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
              Remember your password? Sign in
            </Link>
          </div>
        </form>
      </AuthLayout>
    )
  }

  // Step 2: Check Email
  if (step === 'check-email') {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent you a reset link">
        <div className="space-y-6 py-4 text-center">
          {/* Email Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-gray-700 mb-2">Password reset link sent!</p>
            <p className="text-sm text-gray-600">
              We&apos;ve sent a reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              The link will expire in <strong>{formatTime(timeLeft)}</strong>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">Next Steps:</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the password reset link</li>
              <li>Create a new password</li>
              <li>You&apos;re all set!</li>
            </ol>
          </div>

          {/* Resend */}
          <div>
            {canResend ? (
              <button
                onClick={handleResend}
                className="w-full py-2 px-4 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Resend Reset Link
              </button>
            ) : (
              <button disabled className="w-full py-2 px-4 border border-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed">
                Resend in {formatTime(timeLeft)}
              </button>
            )}
            {resendCount > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Resent {resendCount} time(s)
              </p>
            )}
          </div>

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Can&apos;t find the email? Check your spam folder
            </p>
            <Link href="/auth/login" className="text-sm text-blue-600 hover:underline block">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Step 3: Reset Form (arrived via email link with ?token=...)
  if (step === 'reset-form') {
    const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (newPassword.length < 8) {
        addToast('Password must be at least 8 characters', 'error')
        return
      }
      if (newPassword !== confirmNewPassword) {
        addToast('Passwords do not match', 'error')
        return
      }
      setResetLoading(true)
      try {
        await apiResetPassword({ token: resetToken, new_password: newPassword })
        setStep('success')
        addToast('Password reset successfully!', 'success')
      } catch (err: any) {
        const msg = err?.response?.data?.detail || 'Reset failed. Please request a new link.'
        addToast(msg, 'error')
      } finally {
        setResetLoading(false)
      }
    }

    return (
      <AuthLayout title="Set New Password" subtitle="Enter your new password below">
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <FormInput
            label="New Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FormInput
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={resetLoading}
            className="w-full py-2 px-4 bg-[#C90031] text-white font-semibold rounded-lg hover:bg-[#A80028] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {resetLoading ? 'Resetting...' : 'Reset Password'}
          </button>
          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </AuthLayout>
    )
  }

  // Step 4: Success
  if (step === 'success') {
    return (
      <AuthLayout title="Password Reset!" subtitle="Your password has been updated">
        <div className="text-center space-y-6 py-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-gray-700">Your password has been reset successfully.</p>
          <Link
            href="/auth/login"
            className="block w-full py-2 px-4 bg-[#C90031] text-white font-semibold rounded-lg hover:bg-[#A80028] transition-colors text-center"
          >
            Log In Now
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return null
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetInner />
    </Suspense>
  )
}
