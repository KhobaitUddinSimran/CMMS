'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/common/Spinner'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Only redirect when auth is loaded and user exists
    if (!loading && user?.role) {
      const specialRoles: string[] = (user as any)?.special_roles || []
      const baseRole = user.role

      // All teaching staff → unified lecturer dashboard
      // The lecturer dashboard renders coordinator/hod sections based on special_roles
      const isTeachingStaff = ['lecturer', 'coordinator', 'hod'].includes(baseRole)
        || specialRoles.includes('coordinator')
        || specialRoles.includes('hod')

      if (isTeachingStaff) {
        router.push('/dashboard/lecturer')
      } else {
        router.push(`/dashboard/${baseRole}`)
      }
    }
  }, [user, loading, router])

  // Show loading while auth context is initializing or if not yet redirected
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
      </div>
    </div>
  )
}
