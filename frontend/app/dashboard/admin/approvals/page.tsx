'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { getPendingUsers, approveUser, rejectUser, type PendingUser } from '@/lib/api/admin'
import { Card } from '@/components/common/Card'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function ApprovalsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})
  const [showReasonInput, setShowReasonInput] = useState<{ [key: string]: boolean }>({})

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  // Fetch pending users
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingUsers()
    }
  }, [user])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getPendingUsers()
      setPendingUsers(response.users)
    } catch (err) {
      console.error('Error fetching pending users:', err)
      setError('Failed to load pending users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (email: string) => {
    try {
      setActionLoading(email)
      await approveUser(email)
      // Remove from list
      setPendingUsers(pendingUsers.filter(u => u.email !== email))
    } catch (err) {
      console.error('Error approving user:', err)
      setError(`Failed to approve ${email}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (email: string) => {
    try {
      setActionLoading(email)
      const reason = rejectionReason[email]
      await rejectUser(email, reason)
      // Remove from list
      setPendingUsers(pendingUsers.filter(u => u.email !== email))
      setRejectionReason({ ...rejectionReason, [email]: '' })
      setShowReasonInput({ ...showReasonInput, [email]: false })
    } catch (err) {
      console.error('Error rejecting user:', err)
      setError(`Failed to reject ${email}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      student: 'bg-blue-100 text-blue-800',
      lecturer: 'bg-purple-100 text-purple-800',
      coordinator: 'bg-green-100 text-green-800',
      hod: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-[32px] font-bold text-[#111827]">Pending Approvals</h1>
        <p className="text-[16px] text-[#6B7280] mt-2">
          Review and approve new student and lecturer signups
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Users Card */}
      <Card>
        {/* Stats */}
        <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">
                Total Pending
              </p>
              <p className="text-[28px] font-bold text-[#111827] mt-1">{pendingUsers.length}</p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">
                Students
              </p>
              <p className="text-[28px] font-bold text-[#111827] mt-1">
                {pendingUsers.filter(u => u.role === 'student').length}
              </p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#6B7280] uppercase tracking-wide">
                Lecturers
              </p>
              <p className="text-[28px] font-bold text-[#111827] mt-1">
                {pendingUsers.filter(u => u.role === 'lecturer').length}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#C90031] animate-spin" />
            <span className="ml-3 text-[#6B7280]">Loading pending users...</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[16px] text-[#6B7280]">No pending approvals at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 font-semibold text-[#111827]">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#111827]">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#111827]">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#111827]">Applied On</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#111827]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.email} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <td className="py-4 px-4">
                      <p className="font-medium text-[#111827]">{user.full_name}</p>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280]">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280] text-[14px]">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(user.email)}
                          disabled={actionLoading === user.email}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px] font-medium"
                        >
                          {actionLoading === user.email ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setShowReasonInput({ ...showReasonInput, [user.email]: !showReasonInput[user.email] })}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-[14px] font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>

                      {/* Rejection Reason Input */}
                      {showReasonInput[user.email] && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <textarea
                            value={rejectionReason[user.email] || ''}
                            onChange={(e) =>
                              setRejectionReason({
                                ...rejectionReason,
                                [user.email]: e.target.value,
                              })
                            }
                            placeholder="Optional: Reason for rejection..."
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleReject(user.email)}
                              disabled={actionLoading === user.email}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-[14px] font-medium"
                            >
                              {actionLoading === user.email ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                              onClick={() => setShowReasonInput({ ...showReasonInput, [user.email]: false })}
                              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-[14px] font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card>
        <h3 className="text-[16px] font-bold text-[#111827] mb-4">How to use</h3>
        <ul className="space-y-3 text-[14px] text-[#6B7280]">
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#111827]">Approve:</strong> Click the Approve button to activate a user
              account. They will receive a confirmation email and can login immediately.
            </span>
          </li>
          <li className="flex gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#111827]">Reject:</strong> Click Reject to deny the signup request. The user
              will receive a rejection email with the reason you provide.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
