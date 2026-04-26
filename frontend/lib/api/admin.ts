// Admin API - Admin management functions
import axios from 'axios'

// Use relative URL so Next.js rewrites proxy to backend (avoids CORS)
const BASE_URL = ''

// Create a dedicated admin client with token
const adminApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Add token to requests
adminApiClient.interceptors.request.use((config: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ==================== Types ====================
export interface PendingUser {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string | null
}

export interface PendingUsersResponse {
  count: number
  users: PendingUser[]
}

export interface ApprovalResponse {
  message: string
  email: string
  status: string
}

export interface RejectionResponse {
  message: string
  email: string
  status: string
}

export interface Lecturer {
  id: string
  email: string
  full_name: string
  role: string
  special_roles: string[]
  is_active: boolean
}

export interface ListLecturersResponse {
  count: number
  lecturers: Lecturer[]
}

export interface RoleAssignmentResponse {
  message: string
  email: string
  special_roles: string[]
}

// ==================== Admin Endpoints ====================

/**
 * Get list of pending user signups
 */
export async function getPendingUsers(): Promise<PendingUsersResponse> {
  const { data } = await adminApiClient.get('/api/admin/pending-users')
  return data
}

/**
 * Approve a pending user
 */
export async function approveUser(email: string): Promise<ApprovalResponse> {
  const { data } = await adminApiClient.post('/api/admin/approve-user', { email })
  return data
}

/**
 * Reject a pending user
 */
export async function rejectUser(email: string, reason?: string): Promise<RejectionResponse> {
  const { data } = await adminApiClient.post('/api/admin/reject-user', { email, reason })
  return data
}

/**
 * Get list of all lecturers with their special roles
 */
export async function listLecturers(): Promise<ListLecturersResponse> {
  const { data } = await adminApiClient.get('/api/admin/lecturers')
  return data
}

/**
 * Assign a special role (coordinator/hod) to a lecturer
 */
export async function assignSpecialRole(email: string, specialRole: string): Promise<RoleAssignmentResponse> {
  const { data } = await adminApiClient.post('/api/admin/assign-special-role', {
    email,
    special_role: specialRole,
  })
  return data
}

/**
 * Revoke a special role from a lecturer
 */
export async function revokeSpecialRole(email: string, specialRole: string): Promise<RoleAssignmentResponse> {
  const { data } = await adminApiClient.post('/api/admin/revoke-special-role', {
    email,
    special_role: specialRole,
  })
  return data
}


// ==================== New Types ====================
export interface AdminStats {
  total_users: number
  active_users: number
  pending_approvals: number
  total_courses: number
  students: number
  lecturers: number
  coordinators: number
  hods: number
}

export interface UserRecord {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  approval_status: string
  special_roles: string[]
  created_at: string | null
}

export interface UsersListResponse {
  count: number
  users: UserRecord[]
}

export interface AuditLogEntry {
  id: string
  action: string
  user_id: string | null
  entity_type: string | null
  entity_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  created_at: string
  actor_email?: string
  actor_name?: string
}

export interface AuditLogsResponse {
  count: number
  logs: AuditLogEntry[]
}

// ==================== New Admin Endpoints ====================
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await adminApiClient.get('/api/admin/stats')
  return data
}

export async function getAllUsers(params?: {
  role?: string
  user_status?: string
  search?: string
}): Promise<UsersListResponse> {
  const { data } = await adminApiClient.get('/api/admin/users', { params })
  return data
}

export async function toggleUserActive(email: string, is_active: boolean): Promise<{ message: string; email: string; is_active: boolean }> {
  const { data } = await adminApiClient.post('/api/admin/toggle-user-active', { email, is_active })
  return data
}

export async function getAuditLogs(params?: {
  limit?: number
  offset?: number
  action?: string
}): Promise<AuditLogsResponse> {
  const { data } = await adminApiClient.get('/api/admin/audit-logs', { params })
  return data
}

export interface HodStats {
  total_students: number
  total_faculty: number
  active_courses: number
  flagged_marks: number
  avg_performance: number
  pass_rate: number
}

export async function getHodStats(): Promise<HodStats> {
  const { data } = await adminApiClient.get('/api/admin/hod-stats')
  return data
}
