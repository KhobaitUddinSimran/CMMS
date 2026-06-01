'use client'

import React, { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { verifyEmailWithToken, resendVerificationEmail } from '@/lib/api/auth'

function VerificationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const emailFromQuery = searchParams.get('email')
  const hasVerified = useRef(false)

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your email...')
  const [email, setEmail] = useState(emailFromQuery || '')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    // Guard against double verification (React Strict Mode)
    if (hasVerified.current) return

    // If no token but email is present, show the resend form immediately
    if (!token && emailFromQuery) {
      setStatus('error')
      setMessage('Enter your email below to request a new verification link.')
      return
    }

    // If neither token nor email, show error
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. The token is missing.')
      return
    }

    const verify = async () => {
      hasVerified.current = true
      try {
        const response = await verifyEmailWithToken(token)
        setStatus('success')
        setMessage(response.message)
      } catch (err: any) {
        setStatus('error')
        const errorMsg = err.response?.data?.detail || err.message || 'Verification failed'
        setMessage(errorMsg)
      }
    }

    verify()
  }, [token, emailFromQuery])

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address to resend the verification link.')
      return
    }

    setResendLoading(true)
    try {
      await resendVerificationEmail(email.trim())
      setResendSuccess(true)
      setMessage('Verification email sent! Please check your inbox.')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to resend verification email'
      setMessage(errorMsg)
    } finally {
      setResendLoading(false)
    }
  }

  // Success state
  if (status === 'success') {
    return (
      <AuthLayout title="Email Verified!" subtitle="Your account is now active">
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
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-600 mt-2">
              You can now log in with your email and password.
            </p>
          </div>

          {/* Login Button */}
          <Link
            href="/auth/login"
            className="block w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Error state with resend option
  if (status === 'error') {
    return (
      <AuthLayout title="Verification Failed" subtitle="Unable to verify your email">
        <div className="text-center space-y-6 py-4">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {message}
          </div>

          {/* Resend Section */}
          {!resendSuccess && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your email below to request a new verification link:
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </div>
          )}

          {/* Alternative Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Return to Login
            </Link>
            <Link
              href="/auth/signup"
              className="block text-center text-sm text-blue-600 hover:underline"
            >
              Create a new account
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Verifying state
  return (
    <AuthLayout title="Verifying..." subtitle="Please wait while we verify your email">
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Verifying..." subtitle="Please wait">
        <div className="text-center py-8">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </AuthLayout>
    }>
      <VerificationContent />
    </Suspense>
  )
}
