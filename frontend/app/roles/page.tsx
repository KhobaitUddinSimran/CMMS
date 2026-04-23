'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RolesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/admin/roles')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Redirecting to role management...</div>
    </div>
  )
}
