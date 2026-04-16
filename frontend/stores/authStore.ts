// Auth Store - Zustand authentication state management
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, ApprovalStatus } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  approval_status: ApprovalStatus | null
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setApprovalStatus: (status: ApprovalStatus | null) => void
  clearAuth: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      approval_status: null,
      
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token)
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`
        } else {
          localStorage.removeItem('token')
          document.cookie = 'token=; path=/; max-age=0; SameSite=Strict'
        }
        set({ token })
      },
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setApprovalStatus: (status) => set({ approval_status: status }),
      clearAuth: () => set({
        user: null,
        token: null,
        approval_status: null,
        error: null,
      }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        approval_status: state.approval_status,
      }),
    }
  )
)

// Selector hooks for better performance
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthToken = () => useAuthStore((state) => state.token)
export const useAuthLoading = () => useAuthStore((state) => state.loading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useIsAuthenticated = () => useAuthStore((state) => !!state.token && !!state.user)
export const useApprovalStatus = () => useAuthStore((state) => state.approval_status)
