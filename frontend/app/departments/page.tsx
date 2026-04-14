'use client'

import { Building2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DepartmentsPage() {
  const router = useRouter()

  const departments = [
    { name: 'Computer Science', faculty: 15, students: 450, programs: 3 },
    { name: 'Information Technology', faculty: 12, students: 380, programs: 2 },
    { name: 'Software Engineering', faculty: 10, students: 320, programs: 2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Faculty</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Students</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Programs</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.map((dept, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{dept.name}</td>
                  <td className="px-6 py-4">{dept.faculty}</td>
                  <td className="px-6 py-4">{dept.students}</td>
                  <td className="px-6 py-4">{dept.programs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
