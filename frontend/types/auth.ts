// Auth Types
export type UserRole = 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  name?: string // Alias for full_name (for UI compatibility)
  initials?: string // Computed from full_name
  role: UserRole
  is_active: boolean
  email_verified: boolean
  approval_status: ApprovalStatus
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
  role: UserRole
}

export interface LoginResponse {
  token: string
  user: AuthUser
  approval_status: ApprovalStatus
}

export interface SignupRequest {
  email: string
  full_name: string
  role: UserRole
  password: string
  matric_number: string
}

export interface SignupResponse {
  user_id: string
  email: string
  approval_status: ApprovalStatus
  message: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  message: string
  token_sent_at: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export interface ApprovalStatusResponse {
  approval_status: ApprovalStatus
  approved_at?: string
  rejection_reason?: string
  approved_by?: string
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  token: string | null
  isAuthenticated: boolean
  
  login: (email: string, password: string, role: UserRole) => Promise<{ user: AuthUser; approval_status: ApprovalStatus }>
  signup: (email: string, full_name: string, role: UserRole, password: string, matric_number: string) => Promise<{ user_id: string; approval_status: ApprovalStatus }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<PasswordResetResponse>
  checkApprovalStatus: (userId: string) => Promise<ApprovalStatusResponse>
  getCurrentUser: () => Promise<void>
  clearError: () => void
}
