'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/common/Spinner'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user?.role) {
      const specialRoles: string[] = user?.special_roles || []
      const baseRole = user.role

      // Route by highest-priority effective role: hod > coordinator > lecturer
      // Each dashboard pulls its own real data (no more hardcoded "—" placeholders)
      if (baseRole === 'hod' || specialRoles.includes('hod')) {
        router.push('/dashboard/hod')
      } else if (baseRole === 'coordinator' || specialRoles.includes('coordinator')) {
        router.push('/dashboard/coordinator')
      } else if (baseRole === 'lecturer') {
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
