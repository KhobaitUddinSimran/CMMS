'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Search, Loader2, Power, PowerOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToastStore } from '@/stores/toastStore'
import { getAllUsers, toggleUserActive, type UserRecord } from '@/lib/api/admin'

export default function UsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addToast } = useToastStore()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllUsers({
        role: roleFilter || undefined,
        user_status: statusFilter || undefined,
        search: search || undefined,
      })
      setUsers(data.users)
    } catch (err) {
      console.error('Failed to load users:', err)
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter, search, addToast])

  useEffect(() => {
    if (user?.role === 'admin') {
      const timer = setTimeout(loadUsers, 300) // debounce search
      return () => clearTimeout(timer)
    }
    return undefined
  }, [user, loadUsers])

  const handleToggleActive = async (email: string, currentlyActive: boolean) => {
    try {
      setActionLoading(email)
      await toggleUserActive(email, !currentlyActive)
      addToast(`User ${!currentlyActive ? 'activated' : 'deactivated'}`, 'success')
      await loadUsers()
    } catch (err) {
      addToast('Failed to update user', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleBadge = (role: string, specialRoles: string[]) => {
    const colors: Record<string, string> = {
      student: 'bg-blue-100 text-blue-800',
      lecturer: 'bg-green-100 text-green-800',
      admin: 'bg-red-100 text-red-800',
    }
    return (
      <div className="flex gap-1 flex-wrap">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
        {specialRoles?.map((sr) => (
          <span key={sr} className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
            {sr.toUpperCase()}
          </span>
        ))}
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">View, search, and manage all users in the system</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{users.filter(u => u.approval_status === 'pending').length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No users match the current filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Approval</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.full_name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(u.role, u.special_roles)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                          u.approval_status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {u.approval_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleActive(u.email, u.is_active)}
                          disabled={actionLoading === u.email}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            u.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {actionLoading === u.email ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : u.is_active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
