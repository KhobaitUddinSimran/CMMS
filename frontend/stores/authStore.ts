// Auth Store - Zustand authentication state management
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, ApprovalStatus } from '@/types/auth'

/** Decode the `exp` claim from a JWT without a library (no signature verification needed here). */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

/** Returns true if the stored token is present and not yet expired. */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const exp = getTokenExpiry(token)
  if (!exp) return false
  return Date.now() / 1000 < exp - 30 // 30s buffer
}

function clearBrowserSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  document.cookie = 'token=; path=/; max-age=0; SameSite=Strict'
}

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
        if (typeof window !== 'undefined') {
          if (token) {
            const exp = getTokenExpiry(token)
            const maxAge = exp ? exp - Math.floor(Date.now() / 1000) : 86400
            localStorage.setItem('token', token)
            document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Strict`
          } else {
            clearBrowserSession()
          }
        }
        set({ token })
      },
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setApprovalStatus: (status) => set({ approval_status: status }),
      clearAuth: () => {
        clearBrowserSession()
        set({ user: null, token: null, approval_status: null, error: null })
      },
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
export const useIsAuthenticated = () =>
  useAuthStore((state) => !!state.token && !!state.user && isTokenValid(state.token))
export const useApprovalStatus = () => useAuthStore((state) => state.approval_status)
