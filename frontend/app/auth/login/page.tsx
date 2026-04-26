'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RoleSelector } from '@/components/auth/RoleSelector'
import { FormInput } from '@/components/auth/FormInput'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToastStore } from '@/stores/toastStore'
import type { LoginRole } from '@/types/auth'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loading, error, isAuthenticated } = useAuth()
  const { addToast } = useToastStore()

  const [step, setStep] = useState<'role' | 'credentials'>('role')
  const [selectedRole, setSelectedRole] = useState<LoginRole | undefined>(
    (searchParams?.get('role') as LoginRole) || undefined
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Show session-expired message if redirected by middleware
  useEffect(() => {
    if (searchParams?.get('expired') === '1') {
      addToast('Your session has expired. Please log in again.', 'warning')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if already authenticated (e.g., token persisted from previous session)
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard'
    }
  }, [isAuthenticated])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRole) {
      addToast('Please select a role', 'error')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      const response = await login(email, password, selectedRole)

      // Check approval status
      if (response.approval_status === 'pending') {
        addToast('Your account is pending admin approval', 'warning')
        router.push(`/auth/pending-approval?user_id=${response.user.id}`)
      } else if (response.approval_status === 'rejected') {
        addToast(`Your application was rejected. Reason: ${response.user.rejection_reason || 'Not specified'}`, 'error')
      } else {
        // Respect ?redirect= param set by middleware, fall back to dashboard
        const redirectTo = searchParams?.get('redirect') || '/dashboard'
        window.location.href = redirectTo.startsWith('/') ? redirectTo : '/dashboard'
      }
    } catch (err: any) {
      console.error('Login error:', err)
      // Error toast is already shown by useAuth
    }
  }

  if (step === 'role') {
    return (
      <AuthLayout title="Select Your Role" subtitle="Choose your account type to continue">
        <form onSubmit={(e) => { e.preventDefault(); setStep('credentials') }}>
          <RoleSelector selected={selectedRole} onChange={setSelectedRole} />
          <button
            type="submit"
            disabled={!selectedRole}
            className="w-full mt-6 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={`${selectedRole?.charAt(0).toUpperCase()}${selectedRole?.slice(1)} Login`} subtitle="Enter your credentials">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
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

        {/* Password */}
        <FormInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setValidationErrors((prev) => ({ ...prev, password: '' }))
          }}
          error={validationErrors.password}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* General error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Don&apos;t have an account?</span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signup"
            className="block text-center py-2 px-4 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/auth/password-reset"
            className="text-center text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Change Role */}
        <button
          type="button"
          onClick={() => setStep('role')}
          className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
        >
          Change role
        </button>
      </form>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
