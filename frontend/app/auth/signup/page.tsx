'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RoleSelector } from '@/components/auth/RoleSelector'
import { FormInput } from '@/components/auth/FormInput'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToastStore } from '@/stores/toastStore'
import type { LoginRole } from '@/types/auth'

type SignupStep = 'role' | 'details' | 'password' | 'success'

export default function SignupPage() {
  const router = useRouter()
  const { signup, loading, error } = useAuth()
  const { addToast } = useToastStore()

  // Form state
  const [step, setStep] = useState<SignupStep>('role')
  const [selectedRole, setSelectedRole] = useState<LoginRole | undefined>()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)

  // Password strength indicator
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = calculatePasswordStrength(password)
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']

  // Step 1: Role Selection
  const handleRoleSelect = () => {
    if (!selectedRole) {
      addToast('Please select a role', 'error')
      return
    }
    setStep('details')
  }

  // Step 2: Personal Details
  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!fullName) {
      errors.fullName = 'Full name is required'
    } else if (fullName.length < 2) {
      errors.fullName = 'Name must be at least 2 characters'
    }

    if (!matricNumber) {
      errors.matricNumber = `${selectedRole === 'student' ? 'Matric' : 'Staff'} number is required`
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateDetails()) {
      setStep('password')
    }
  }

  // Step 3: Password
  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {}

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one number'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword()) {
      return
    }

    if (!selectedRole) {
      addToast('Please select a role', 'error')
      return
    }

    try {
      const response = await signup(email, fullName, selectedRole, password, matricNumber)
      setCreatedUserId(response.user_id)
      setStep('success')
    } catch (err: any) {
      console.error('Signup error:', err)
      // Error toast already shown by useAuth
    }
  }

  // Step 1: Role Selection
  if (step === 'role') {
    return (
      <AuthLayout title="Create Account" subtitle="Choose your account type">
        <div className="space-y-6">
          <RoleSelector
            selected={selectedRole}
            onChange={setSelectedRole}
            signupMode={true}
          />
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Step 2: Personal Details
  if (step === 'details') {
    return (
      <AuthLayout
        title="Personal Details"
        subtitle={`Step 1 of 3 - ${selectedRole?.charAt(0).toUpperCase()}${selectedRole?.slice(1)} Account`}
      >
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }} />
          </div>

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
          />

          {/* Full Name */}
          <FormInput
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              setValidationErrors((prev) => ({ ...prev, fullName: '' }))
            }}
            error={validationErrors.fullName}
          />

          {/* Matric/Staff Number */}
          <FormInput
            label={selectedRole === 'student' ? 'Matric Number' : 'Staff Number'}
            type="text"
            placeholder={selectedRole === 'student' ? 'e.g., A123456' : 'e.g., S123456'}
            value={matricNumber}
            onChange={(e) => {
              setMatricNumber(e.target.value)
              setValidationErrors((prev) => ({ ...prev, matricNumber: '' }))
            }}
            error={validationErrors.matricNumber}
          />

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('role')}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </AuthLayout>
    )
  }

  // Step 3: Password
  if (step === 'password') {
    return (
      <AuthLayout
        title="Set Password"
        subtitle="Step 2 of 3 - Create a secure password"
      >
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '66%' }} />
          </div>

          {/* Password */}
          <FormInput
            label="Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setValidationErrors((prev) => ({ ...prev, password: '' }))
            }}
            error={validationErrors.password}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Strength: <span className="font-semibold">{strengthLabels[passwordStrength] || 'Very Weak'}</span>
              </p>
            </div>
          )}

          {/* Confirm Password */}
          <FormInput
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }))
            }}
            error={validationErrors.confirmPassword}
          />

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Complete Signup'
              )}
            </button>
          </div>
        </form>
      </AuthLayout>
    )
  }

  // Step 4: Success
  return (
    <AuthLayout title="Account Created!" subtitle="Welcome to CMMS">
      <div className="text-center space-y-6 py-4">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="text-gray-700 mb-2">Your account has been created successfully!</p>
          <p className="text-sm text-gray-600">
            Your application is now pending admin approval. You&apos;ll receive an email once it&apos;s reviewed.
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-sm font-semibold text-blue-900 mb-2">What&apos;s Next?</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Your account details have been submitted</li>
            <li>✓ An administrator will review your application</li>
            <li>✓ You&apos;ll receive a confirmation email</li>
            <li>✓ You can then log in with your credentials</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/auth/pending-approval?user_id=${createdUserId}`)}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Approval Status
          </button>
          <Link
            href="/auth/login"
            className="block text-center py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
