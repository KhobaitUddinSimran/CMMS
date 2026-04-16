'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RolesPage() {
  const router = useRouter()

  const roles = [
    { name: 'Student', permissions: 42, users: 1250, active: true },
    { name: 'Lecturer', permissions: 58, users: 120, active: true },
    { name: 'Coordinator', permissions: 75, users: 15, active: true },
    { name: 'HOD', permissions: 90, users: 8, active: true },
    { name: 'Admin', permissions: 150, users: 5, active: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Permissions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Users</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{role.name}</td>
                  <td className="px-6 py-4 text-gray-600">{role.permissions}</td>
                  <td className="px-6 py-4">{role.users}</td>
                  <td className="px-6 py-4"><span className="text-green-600">✓</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
