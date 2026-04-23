'use client'

import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { UserPlus, UserMinus, Search, Users, Mail } from 'lucide-react'

export interface EnrolledStudent {
  id: string
  email: string
  full_name: string
  enrollment_date: string
  status: 'active' | 'dropped'
}

interface StudentRosterProps {
  courseId: string
  students: EnrolledStudent[]
  onAddStudent: (email: string) => Promise<void>
  onDropStudent: (studentId: string) => Promise<void>
}

export function StudentRoster({ students, onAddStudent, onDropStudent }: StudentRosterProps) {
  const [addEmail, setAddEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [dropLoading, setDropLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const activeStudents = students.filter((s) => s.status === 'active')
  const droppedStudents = students.filter((s) => s.status === 'dropped')

  const filteredActive = activeStudents.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')

    const email = addEmail.trim().toLowerCase()
    if (!email) {
      setAddError('Email is required')
      return
    }
    if (!email.endsWith('@utm.my') && !email.endsWith('@graduate.utm.my')) {
      setAddError('Must be a UTM email address')
      return
    }

    setAddLoading(true)
    try {
      await onAddStudent(email)
      setAddEmail('')
    } catch (err: any) {
      setAddError(err?.response?.data?.detail || err?.message || 'Failed to add student')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDrop = async (studentId: string) => {
    if (!confirm('Are you sure you want to drop this student?')) return
    setDropLoading(studentId)
    try {
      await onDropStudent(studentId)
    } catch {
      // Parent handles toast
    } finally {
      setDropLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#111827]">Student Roster</h3>
            <p className="text-xs text-[#6B7280]">
              {activeStudents.length} active student{activeStudents.length !== 1 ? 's' : ''}
              {droppedStudents.length > 0 && ` · ${droppedStudents.length} dropped`}
            </p>
          </div>
        </div>
      </div>

      {/* Add Student Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="student@graduate.utm.my"
            value={addEmail}
            onChange={(e) => {
              setAddEmail(e.target.value)
              setAddError('')
            }}
            error={addError}
            icon={<Mail className="w-4 h-4" />}
            disabled={addLoading}
          />
        </div>
        <Button
          type="submit"
          loading={addLoading}
          icon={<UserPlus className="w-4 h-4" />}
          className="shrink-0"
        >
          Add
        </Button>
      </form>

      {/* Search */}
      {activeStudents.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-10 pr-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#C90031]"
          />
        </div>
      )}

      {/* Student Table */}
      {filteredActive.length > 0 ? (
        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">#</th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Enrolled</th>
                <th className="text-right px-4 py-2.5 font-medium text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActive.map((student, idx) => (
                <tr
                  key={student.id}
                  className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                >
                  <td className="px-4 py-2.5 text-[#6B7280]">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-[#111827]">{student.full_name || '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{student.email}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">
                    {student.enrollment_date
                      ? new Date(student.enrollment_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDrop(student.id)}
                      disabled={dropLoading === student.id}
                      className="inline-flex items-center gap-1 text-xs text-[#EF4444] hover:text-[#DC2626] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      {dropLoading === student.id ? 'Dropping...' : 'Drop'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-[#6B7280]">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No students enrolled yet</p>
          <p className="text-xs mt-1">Add students manually above or use Roster Upload</p>
        </div>
      )}

      {/* Dropped Students (collapsed section) */}
      {droppedStudents.length > 0 && (
        <details className="border border-[#E5E7EB] rounded-lg">
          <summary className="px-4 py-2.5 cursor-pointer text-sm text-[#6B7280] hover:bg-[#F9FAFB]">
            Dropped Students ({droppedStudents.length})
          </summary>
          <div className="border-t border-[#E5E7EB]">
            {droppedStudents.map((student) => (
              <div
                key={student.id}
                className="px-4 py-2.5 flex items-center justify-between text-sm text-[#9CA3AF] border-b border-[#E5E7EB] last:border-0"
              >
                <span className="line-through">{student.full_name || student.email}</span>
                <span className="text-xs">dropped</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
