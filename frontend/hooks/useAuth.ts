// useAuth Hook - Authentication state and methods
'use client'

import { useAuthStore } from '@/stores/authStore'

export const useAuth = () => {
  const { user, token, loading, login, logout, setUser } = useAuthStore()

  return {
    user,
    token,
    loading,
    login: async (email: string, password: string) => {
      // Call API
      return await login(email, password)
    },
    logout: () => logout(),
    setUser: (user: any) => setUser(user),
  }
}
