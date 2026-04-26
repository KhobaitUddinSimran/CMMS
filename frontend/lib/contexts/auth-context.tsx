'use client'

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react'
import { useAuthStore, isTokenValid } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import * as authApi from '@/lib/api/auth'
import { setCachedToken } from '@/lib/api/client'
import { getCurrentUser as getUserProfile } from '@/lib/api/users'
import { transformAuthUser } from '@/lib/auth/utils'
import type {
  AuthContextType,
  LoginRole,
  ApprovalStatusResponse,
} from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    token,
    loading,
    error,
    setUser,
    setToken,
    setLoading,
    setError,
    setApprovalStatus,
    clearAuth,
    clearError,
  } = useAuthStore()

  const { addToast } = useToastStore()

  /**
   * Login user with email, password, and role
   */
  const handleLogin = useCallback(
    async (email: string, password: string, role: LoginRole) => {
      setLoading(true)
      clearError()

      try {
        const response = await authApi.login({ email, password, role })
        
        // Transform user data with computed properties
        const transformedUser = transformAuthUser(response.user)
        
        // Set token (also saves to localStorage/cookie) + sync in-memory cache
        setCachedToken(response.token)
        setToken(response.token)
        
        // Set user data
        setUser(transformedUser)
        
        // Set approval status
        setApprovalStatus(response.approval_status)

        addToast('Login successful!', 'success')

        // Return so caller can handle navigation
        return {
          user: transformedUser!,
          approval_status: response.approval_status,
        }
      } catch (err: any) {
        const message = err.response?.data?.detail || err.message || 'Login failed'
        setError(message)
        addToast(message, 'error')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setUser, setToken, setLoading, setError, setApprovalStatus, clearError, addToast]
  )

  /**
   * Sign up new user
   */
  const handleSignup = useCallback(
    async (email: string, full_name: string, role: LoginRole, password: string, matric_number: string) => {
      setLoading(true)
      clearError()

      try {
        const response = await authApi.signup({
          email,
          full_name,
          role,
          password,
          matric_number,
        })

        addToast('Account created successfully! Pending admin approval.', 'success')

        return {
          user_id: response.user_id,
          approval_status: response.approval_status,
        }
      } catch (err: any) {
        const message = err.response?.data?.detail || err.message || 'Signup failed'
        setError(message)
        addToast(message, 'error')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, clearError, addToast]
  )

  /**
   * Logout user
   */
  const handleLogout = useCallback(async () => {
    setLoading(true)
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setCachedToken(null)
      clearAuth()
      setLoading(false)
      addToast('Logged out successfully', 'success')
      window.location.href = '/auth/login'
    }
  }, [clearAuth, setLoading, addToast])

  /**
   * Request password reset
   */
  const handleResetPassword = useCallback(
    async (email: string) => {
      setLoading(true)
      clearError()

      try {
        const response = await authApi.requestPasswordReset({ email })
        addToast('Password reset link sent to your email', 'success')
        return response
      } catch (err: any) {
        const message = err.response?.data?.detail || err.message || 'Reset request failed'
        setError(message)
        addToast(message, 'error')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, clearError, addToast]
  )

  /**
   * Check approval status
   */
  const handleCheckApprovalStatus = useCallback(
    async (userId: string): Promise<ApprovalStatusResponse> => {
      try {
        const response = await authApi.checkApprovalStatus(userId)
        setApprovalStatus(response.approval_status)
        return response
      } catch (err: any) {
        console.error('Error checking approval status:', err)
        throw err
      }
    },
    [setApprovalStatus]
  )

  /**
   * Get current authenticated user
   */
  const handleGetCurrentUser = useCallback(async () => {
    try {
      const user = await getUserProfile()
      const transformedUser = transformAuthUser(user)
      if (transformedUser) {
        setUser(transformedUser)
        setApprovalStatus(transformedUser.approval_status as any)
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth()
      }
    }
  }, [setUser, setApprovalStatus, clearAuth])

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    error,
    token,
    isAuthenticated: !!user && isTokenValid(token),

    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    checkApprovalStatus: handleCheckApprovalStatus,
    getCurrentUser: handleGetCurrentUser,
    clearError,
  }), [user, loading, error, token, handleLogin, handleSignup, handleLogout, handleResetPassword, handleCheckApprovalStatus, handleGetCurrentUser, clearError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
