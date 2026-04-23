// Auth API - Authentication API calls
import axios from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ApprovalStatusResponse,
  AuthUser,
} from '@/types/auth'

// Use /api prefix so Next.js rewrites proxy to backend (avoids CORS)
const BASE_URL = '/api'

// Create a dedicated auth client without the /api prefix
const authApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Add token to requests
authApiClient.interceptors.request.use((config: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Login with email, password, and role
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await authApiClient.post('/auth/login', payload)
  return data
}

/**
 * Sign up a new user
 */
export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const { data } = await authApiClient.post('/auth/signup', payload)
  return data
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await authApiClient.post('/auth/logout')
  } catch (error) {
    // Still clear local state even if logout fails on server
    console.error('Logout error:', error)
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await authApiClient.get('/auth/me')
  return data.user
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  payload: PasswordResetRequest
): Promise<PasswordResetResponse> {
  const { data } = await authApiClient.post('/auth/password-reset', payload)
  return data
}

/**
 * Reset password with token
 */
export async function resetPassword(
  payload: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const { data } = await authApiClient.post('/auth/reset-password', payload)
  return data
}

/**
 * Check approval status for a user
 */
export async function checkApprovalStatus(userId: string): Promise<ApprovalStatusResponse> {
  const { data } = await authApiClient.get(`/auth/approval-status/${userId}`)
  return data
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const { data } = await authApiClient.post('/auth/verify-email', { token })
  return data
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const { data } = await authApiClient.post('/auth/resend-verification', { email })
  return data
}

export interface RejectSignupRequest {
  reason: string
}

export interface PendingSignupsResponse {
  total: number
  skip: number
  limit: number
  approval_status: string
  users: Array<{
    user_id: string
    email: string
    full_name: string
    role: string
    matric_number?: string
    email_verified: boolean
    approval_status: string
    submitted_at: string
  }>
}
