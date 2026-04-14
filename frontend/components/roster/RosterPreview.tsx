'use client'

import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

interface Student {
  student_id: string
  email: string
  first_name: string
  last_name: string
  status: 'new' | 'existing' | 'error'
  error?: string
}

interface RosterPreviewProps {
  open: boolean
  data: {
    students: Student[]
    new_count: number
    existing_count: number
    error_count: number
    summary: string
  } | null
  onConfirm: () => void
  onCancel: () => void
  isConfirming?: boolean
}

export function RosterPreview({
  open,
  data,
  onConfirm,
  onCancel,
  isConfirming = false,
}: RosterPreviewProps) {
  if (!data) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'existing':
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">New Account</span>
      case 'existing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Existing</span>
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Error</span>
      default:
        return null
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Import Preview"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isConfirming}
            disabled={data.error_count > 0 || isConfirming}
          >
            {isConfirming ? 'Confirming...' : 'Confirm Import'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{data.new_count}</div>
            <div className="text-xs text-green-600 font-medium">New Accounts</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{data.existing_count}</div>
            <div className="text-xs text-blue-600 font-medium">Existing Students</div>
          </div>
          <div className={`p-3 border rounded-lg ${
            data.error_count > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`text-2xl font-bold ${
              data.error_count > 0 ? 'text-red-700' : 'text-gray-700'
            }`}>
              {data.error_count}
            </div>
            <div className={`text-xs font-medium ${
              data.error_count > 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              Errors
            </div>
          </div>
        </div>

        {/* Error Summary */}
        {data.error_count > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-2">
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Fix the errors below before confirming</p>
              </div>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Student ID</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.students.map((student, idx) => (
                <tr key={idx} className={
                  student.status === 'error'
                    ? 'bg-red-50'
                    : student.status === 'existing'
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(student.status)}
                      {getStatusBadge(student.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{student.email}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{student.student_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Error Details */}
        {data.students.some(s => s.status === 'error') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700 mb-2">Error Details:</p>
            <div className="space-y-1">
              {data.students
                .filter(s => s.status === 'error')
                .map((student, idx) => (
                  <p key={idx} className="text-xs text-red-600">
                    <strong>{student.email}:</strong> {student.error}
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
