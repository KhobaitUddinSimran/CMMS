// Users API - User management and profile API calls
import { apiClient } from './client'

// ==================== Types ====================
export interface UserData {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  email_verified: boolean
  approval_status: string
  created_at?: string
  updated_at?: string
}

export interface UserListResponse {
  data: UserData[]
  total: number
  skip: number
  limit: number
}

export interface EnrolledStudent extends UserData {
  enrollment_date: string
  status: 'active' | 'dropped'
}

// ==================== Users API Methods ====================

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserData> {
  const response = await apiClient.get('/users/me')
  return response.data
}

/**
 * Get a specific user
 */
export async function getUser(userId: string): Promise<UserData> {
  const response = await apiClient.get(`/users/${userId}`)
  return response.data
}

/**
 * List all users with optional filtering
 */
export async function listUsers(params?: {
  skip?: number
  limit?: number
  role?: string
  is_active?: boolean
}): Promise<UserListResponse> {
  const response = await apiClient.get('/users', { params })
  return response.data
}

/**
 * List all lecturers
 */
export async function listLecturers(): Promise<UserData[]> {
  const response = await apiClient.get('/users?role=lecturer')
  return response.data.data || response.data
}

/**
 * Get students enrolled in a course
 */
export async function getEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
  const response = await apiClient.get(`/courses/${courseId}/students`)
  return response.data.data || response.data
}

/**
 * Change password for current user
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await apiClient.post('/users/password-change', {
    old_password: oldPassword,
    new_password: newPassword,
  })
  return response.data
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<UserData>): Promise<UserData> {
  const response = await apiClient.put('/users/me', data)
  return response.data
}

/**
 * Add a student to a course (enrollment)
 */
export async function addStudentToCourse(
  courseId: string,
  studentEmail: string
): Promise<EnrolledStudent> {
  const response = await apiClient.post(`/courses/${courseId}/enrollments`, {
    student_email: studentEmail,
  })
  return response.data
}

/**
 * Drop a student from a course (soft delete)
 */
export async function dropStudent(
  courseId: string,
  studentId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete(`/courses/${courseId}/enrollments/${studentId}`)
  return response.data
}

/**
 * Get user's queries (for students)
 */
export async function getUserQueries(userId: string): Promise<any[]> {
  const response = await apiClient.get(`/users/${userId}/queries`)
  return response.data
}
