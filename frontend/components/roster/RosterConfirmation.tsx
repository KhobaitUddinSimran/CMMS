'use client'

import { CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

interface RosterConfirmationProps {
  open: boolean
  result: {
    success: boolean
    accounts_created: number
    enrollments_linked: number
    errors: number
    message: string
    student_emails?: string[]
  } | null
  onClose: () => void
}

export function RosterConfirmation({
  open,
  result,
  onClose,
}: RosterConfirmationProps) {
  if (!result) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={result.success ? 'Import Successful' : 'Import Completed with Errors'}
      footer={
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Success/Error Icon */}
        <div className="flex justify-center">
          {result.success ? (
            <CheckCircle className="w-12 h-12 text-green-600" />
          ) : (
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          )}
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-gray-700 text-sm">{result.message}</p>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {result.accounts_created}
            </div>
            <div className="text-xs text-green-600 font-medium">Accounts Created</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {result.enrollments_linked}
            </div>
            <div className="text-xs text-blue-600 font-medium">Enrollments Linked</div>
          </div>
          <div className={`p-3 border rounded-lg ${
            result.errors > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`text-2xl font-bold ${
              result.errors > 0 ? 'text-red-700' : 'text-gray-700'
            }`}>
              {result.errors}
            </div>
            <div className={`text-xs font-medium ${
              result.errors > 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              Errors
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">What&apos;s Next?</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>New students will receive OTP via email</li>
                <li>They can log in and set their password</li>
                <li>Check your email for delivery confirmation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* New Student Emails (optional) */}
        {result.student_emails && result.student_emails.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              OTP emails sent to {result.student_emails.length} new students:
            </p>
            <div className="max-h-32 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="space-y-1">
                {result.student_emails.map((email, idx) => (
                  <p key={idx} className="text-xs text-gray-600 break-all">
                    • {email}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
