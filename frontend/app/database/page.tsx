'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Database, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { getAdminStats, type AdminStats } from '@/lib/api/admin'

export default function DatabasePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      (async () => {
        try {
          setLoading(true)
          const data = await getAdminStats()
          setStats(data)
        } catch (err) {
          console.error('Failed to load DB stats:', err)
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [user])

  if (!isAuthenticated || user?.role !== 'admin') return null

  const tables = [
    { name: 'users', records: stats?.total_users ?? 0, description: 'Registered accounts (students, lecturers, admins)' },
    { name: 'courses', records: stats?.total_courses ?? 0, description: 'Active course offerings' },
    { name: 'enrollments', records: '—', description: 'Student–course enrollments' },
    { name: 'assessments', records: '—', description: 'Course assessments (quizzes, tests, etc.)' },
    { name: 'marks', records: '—', description: 'Student marks / scores' },
    { name: 'audit_log', records: '—', description: 'System audit trail' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Overview</h1>
            <p className="text-gray-600 mt-1">Live database statistics from Supabase</p>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : (stats?.total_users ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Total Courses</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : (stats?.total_courses ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Database Provider</p>
            <p className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-7 h-7 text-green-600" />
              Supabase
            </p>
          </div>
        </div>

        {/* Tables list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Database Tables</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Table</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Records</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tables.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-gray-600">{typeof t.records === 'number' ? t.records.toLocaleString() : t.records}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Note:</strong> Database management (migrations, backups, row-level policies) is handled via the Supabase dashboard.
          This page shows read-only statistics from the live database.
        </div>
      </div>
    </div>
  )
}
