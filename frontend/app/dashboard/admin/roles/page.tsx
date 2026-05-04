'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Trash2, Shield } from 'lucide-react'
import * as adminApi from '@/lib/api/admin'
import { useToastStore } from '@/stores/toastStore'

interface Lecturer {
  id: string
  email: string
  full_name: string
  role: string
  special_roles: string[]
  is_active: boolean
}

const hasRole = (lecturer: Lecturer, role: string) =>
  lecturer.role === role || (lecturer.special_roles ?? []).includes(role)

export default function RoleManagementPage() {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    fetchLecturers()
  }, [])

  const fetchLecturers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await adminApi.listLecturers()
      setLecturers(response.lecturers || [])
    } catch (error: any) {
      addToast('Failed to load lecturers', 'error')
      console.error('Error fetching lecturers:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleAssignRole = async (email: string, specialRole: string) => {
    try {
      setAssigning(email)
      await adminApi.assignSpecialRole(email, specialRole)
      // Optimistic update: reflect the change immediately
      setLecturers(prev => prev.map(l =>
        l.email === email
          ? { ...l, role: specialRole, special_roles: [specialRole] }
          : l
      ))
      addToast(`${specialRole.charAt(0).toUpperCase() + specialRole.slice(1)} role assigned`, 'success')
      fetchLecturers(true)
    } catch (error: any) {
      addToast(error?.response?.data?.detail || 'Failed to assign role', 'error')
    } finally {
      setAssigning(null)
    }
  }

  const handleRevokeRole = async (email: string, specialRole: string) => {
    try {
      setAssigning(email)
      await adminApi.revokeSpecialRole(email, specialRole)
      // Optimistic update
      setLecturers(prev => prev.map(l =>
        l.email === email
          ? { ...l, role: 'lecturer', special_roles: [] }
          : l
      ))
      addToast(`${specialRole.charAt(0).toUpperCase() + specialRole.slice(1)} role revoked`, 'success')
      fetchLecturers(true)
    } catch (error: any) {
      addToast(error?.response?.data?.detail || 'Failed to revoke role', 'error')
    } finally {
      setAssigning(null)
    }
  }

  const isCoord = (l: Lecturer) => hasRole(l, 'coordinator')
  const isHod   = (l: Lecturer) => hasRole(l, 'hod')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Roles &amp; Permissions</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Assign Coordinator and HOD roles to teaching staff</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {[['Lecturer', 'bg-gray-100 text-gray-700'], ['Coordinator', 'bg-purple-100 text-purple-700'], ['HOD', 'bg-red-100 text-red-700']].map(([label, cls]) => (
            <span key={label} className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin mr-3"><Shield className="w-6 h-6 text-[#C90031]" /></div>
            <span className="text-[#6B7280]">Loading staff...</span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {lecturers.length === 0 ? (
              <div className="p-16 text-center text-[#6B7280]">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No teaching staff found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-5 py-3.5 text-left font-semibold text-[#374151]">Name</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-[#374151]">Email</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-[#374151]">Current Role</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-[#374151]">Status</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-[#374151]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {lecturers.map((lecturer) => (
                      <tr key={lecturer.id} className={`transition-colors ${
                        assigning === lecturer.email ? 'opacity-60 pointer-events-none' : 'hover:bg-[#F9FAFB]'
                      }`}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#111827]">{lecturer.full_name || '—'}</p>
                        </td>
                        <td className="px-5 py-4 text-[#6B7280]">{lecturer.email}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isCoord(lecturer) ? 'bg-purple-100 text-purple-700' :
                            isHod(lecturer)   ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {isCoord(lecturer) ? 'Coordinator' : isHod(lecturer) ? 'HOD' : 'Lecturer'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            lecturer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {lecturer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            {!isCoord(lecturer) ? (
                              <button
                                onClick={() => handleAssignRole(lecturer.email, 'coordinator')}
                                disabled={!!assigning}
                                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 transition flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Coordinator
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevokeRole(lecturer.email, 'coordinator')}
                                disabled={!!assigning}
                                className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-50 disabled:opacity-40 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            )}
                            {!isHod(lecturer) ? (
                              <button
                                onClick={() => handleAssignRole(lecturer.email, 'hod')}
                                disabled={!!assigning}
                                className="px-3 py-1.5 bg-[#C90031] text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 transition flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> HOD
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevokeRole(lecturer.email, 'hod')}
                                disabled={!!assigning}
                                className="px-3 py-1.5 bg-white border border-red-300 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50 disabled:opacity-40 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
