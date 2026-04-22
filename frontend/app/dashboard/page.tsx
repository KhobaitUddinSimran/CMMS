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
      // Check if user has special roles
      const specialRoles = (user as any)?.special_roles || []
      
      if (specialRoles.length > 0) {
        // If lecturer has special roles, prioritize HOD > Coordinator
        if (specialRoles.includes('hod')) {
          router.push('/dashboard/hod')
        } else if (specialRoles.includes('coordinator')) {
          router.push('/dashboard/coordinator')
        } else {
          // Fallback to base role
          router.push(`/dashboard/${user.role}`)
        }
      } else {
        // No special roles, use base role
        router.push(`/dashboard/${user.role}`)
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
