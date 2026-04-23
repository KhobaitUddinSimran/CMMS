'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToastStore } from '@/stores/toastStore'
import type { ApprovalStatus } from '@/types/auth'

function PendingApprovalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkApprovalStatus, user } = useAuth()
  const { addToast } = useToastStore()

  const userId = searchParams?.get('user_id') || user?.id || ''
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30)

  // Check approval status
  const handleCheckStatus = useCallback(async () => {
    if (!userId) {
      addToast('User ID not found', 'error')
      router.push('/auth/login')
      return
    }

    try {
      setLoading(true)
      const response = await checkApprovalStatus(userId)
      setApprovalStatus(response.approval_status)

      if (response.rejection_reason) {
        setRejectionReason(response.rejection_reason)
      }

      // If approved, show message and redirect
      if (response.approval_status === 'approved') {
        addToast('Your account has been approved!', 'success')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }

      // If rejected, show reason
      if (response.approval_status === 'rejected') {
        addToast(`Your application was rejected. Reason: ${response.rejection_reason || 'Not specified'}`, 'error')
      }

      // Reset timer
      setTimeLeft(30)
    } catch (err: any) {
      console.error('Error checking approval status:', err)
      // Continue polling even on error
    } finally {
      setLoading(false)
    }
  }, [userId, checkApprovalStatus, addToast, router])

  // Poll for status changes
  useEffect(() => {
    // Initial check
    handleCheckStatus()

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      handleCheckStatus()
    }, 30000) // Check every 30 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [handleCheckStatus])

  // Countdown timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [])

  if (!userId) {
    return (
      <AuthLayout title="Error" subtitle="User ID not found">
        <div className="text-center space-y-4">
          <p className="text-gray-700">Unable to load your approval status.</p>
          <Link
            href="/auth/login"
            className="inline-block py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Pending Status
  if (approvalStatus === 'pending' || approvalStatus === null) {
    return (
      <AuthLayout title="Application Pending" subtitle="Your account is under review">
        <div className="space-y-6 py-4">
          {/* Status Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-2">Thank you for signing up!</p>
            <p className="text-sm text-gray-600">
              Your application has been submitted and is now pending administrator approval. 
              This usually takes 1-2 business days.
            </p>
          </div>

          {/* Status Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">Status Details</p>
            <p className="text-sm text-blue-800">📧 Check your email for updates</p>
            <p className="text-sm text-blue-800">🔄 We&apos;re checking for updates every 30 seconds</p>
            <p className="text-sm text-blue-800">⏱️ Next check in {timeLeft}s</p>
          </div>

          {/* Manual Check */}
          <button
            onClick={handleCheckStatus}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check Now
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600">
              <strong>Tip:</strong> You can close this page and check your approval status anytime by logging in.
            </p>
          </div>

          {/* Links */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Approved Status
  if (approvalStatus === 'approved') {
    return (
      <AuthLayout title="Account Approved!" subtitle="Welcome to CMMS">
        <div className="space-y-6 py-4 text-center">
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
            <p className="text-gray-700 mb-2">Your account has been approved!</p>
            <p className="text-sm text-gray-600">You can now log in with your email and password.</p>
          </div>

          {/* Button */}
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Login
          </button>

          <p className="text-xs text-gray-500">Redirecting in 2 seconds...</p>
        </div>
      </AuthLayout>
    )
  }

  // Rejected Status
  if (approvalStatus === 'rejected') {
    return (
      <AuthLayout title="Application Rejected" subtitle="Unfortunately, your application was not approved">
        <div className="space-y-6 py-4">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-2">We&apos;re sorry</p>
            <p className="text-sm text-gray-600">Your application could not be approved at this time.</p>
          </div>

          {/* Rejection Reason */}
          {rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 mb-2">Reason:</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again with Different Details
            </button>
            <Link
              href="/auth/login"
              className="block text-center py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </Link>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600">
              If you believe this is a mistake, please contact the administrator.
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return null
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={null}>
      <PendingApprovalContent />
    </Suspense>
  )
}
