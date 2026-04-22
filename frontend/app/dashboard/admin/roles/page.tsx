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

export default function RoleManagementPage() {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    fetchLecturers()
  }, [])

  const fetchLecturers = async () => {
    try {
      setLoading(true)
      const response = await adminApi.listLecturers()
      setLecturers(response.lecturers || [])
    } catch (error: any) {
      addToast('Failed to load lecturers', 'error')
      console.error('Error fetching lecturers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async (email: string, role: string) => {
    try {
      setAssigning(email)
      await adminApi.assignSpecialRole(email, role)
      addToast(`${role.charAt(0).toUpperCase() + role.slice(1)} role assigned successfully`, 'success')
      await fetchLecturers()
    } catch (error: any) {
      addToast('Failed to assign role', 'error')
    } finally {
      setAssigning(null)
    }
  }

  const handleRevokeRole = async (email: string, role: string) => {
    try {
      setAssigning(email)
      await adminApi.revokeSpecialRole(email, role)
      addToast(`${role.charAt(0).toUpperCase() + role.slice(1)} role revoked successfully`, 'success')
      await fetchLecturers()
    } catch (error: any) {
      addToast('Failed to revoke role', 'error')
    } finally {
      setAssigning(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'coordinator':
        return 'bg-purple-100 text-purple-800'
      case 'hod':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lecturer Role Management</h1>
            <p className="text-gray-600 mt-1">Assign or revoke Coordinator and HOD roles to lecturers</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <span className="ml-3 text-gray-600">Loading lecturers...</span>
          </div>
        )}

        {/* Lecturers Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {lecturers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No lecturers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Special Roles</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lecturers.map((lecturer) => (
                      <tr key={lecturer.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{lecturer.full_name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{lecturer.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {lecturer.special_roles && lecturer.special_roles.length > 0 ? (
                              lecturer.special_roles.map((role) => (
                                <span
                                  key={role}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                    role
                                  )}`}
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No special roles</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lecturer.is_active ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {!lecturer.special_roles?.includes('coordinator') ? (
                              <button
                                onClick={() => handleAssignRole(lecturer.email, 'coordinator')}
                                disabled={assigning === lecturer.email}
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" />
                                Coordinator
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevokeRole(lecturer.email, 'coordinator')}
                                disabled={assigning === lecturer.email}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Revoke Coord
                              </button>
                            )}

                            {!lecturer.special_roles?.includes('hod') ? (
                              <button
                                onClick={() => handleAssignRole(lecturer.email, 'hod')}
                                disabled={assigning === lecturer.email}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" />
                                HOD
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevokeRole(lecturer.email, 'hod')}
                                disabled={assigning === lecturer.email}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Revoke HOD
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
    </div>
  )
}
