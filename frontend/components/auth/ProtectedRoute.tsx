// Protected Route Component - Wraps pages that need authentication
'use client'

import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) redirect('/login')

  return <>{children}</>
}
