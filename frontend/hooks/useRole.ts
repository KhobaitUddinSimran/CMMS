// useRole Hook - Get current user role
'use client'

import { useAuthStore } from '@/stores/authStore'

export const useRole = () => {
  const { user } = useAuthStore()
  return user?.role
}
