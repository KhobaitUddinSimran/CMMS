// Courses API - Course management API calls
import { apiClient } from './client'

// ==================== Types ====================
export interface CourseData {
  name?: string
  academic_year?: string
  credits?: number
  description?: string
  id: string
  code: string
  section: string
  year: string
  semester: string
  lecturer_id?: string
  lecturer_name?: string
  coordinator_id?: string
  created_at?: string
  updated_at?: string
}

export interface CourseFormData {
  code: string
  name: string
  section: string
  year: string
  semester: string
  credits: number
  lecturer_id?: string
  coordinator_id?: string
}

export interface CourseListResponse {
  data: CourseData[]
  total: number
  skip: number
  limit: number
}

// ==================== Course API Methods ====================

/**
 * Create a new course
 */
export async function createCourse(data: CourseFormData): Promise<CourseData> {
  const response = await apiClient.post('/courses', data)
  return response.data
}

/**
 * List courses with pagination and filters
 */
export async function listCourses(params?: {
  skip?: number
  limit?: number
  semester?: string
  year?: string
}): Promise<CourseListResponse> {
  const response = await apiClient.get('/courses', { params })
  return response.data
}

/**
 * Get a specific course
 */
export async function getCourse(courseId: string): Promise<CourseData> {
  const response = await apiClient.get(`/courses/${courseId}`)
  return response.data
}

/**
 * Update a course
 */
export async function updateCourse(
  courseId: string,
  data: Partial<CourseFormData>
): Promise<CourseData> {
  const response = await apiClient.put(`/courses/${courseId}`, data)
  return response.data
}

/**
 * Delete a course (soft delete)
 */
export async function deleteCourse(courseId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/courses/${courseId}`)
  return response.data
}

/**
 * Get all lecturers for assignment
 */
export async function getLecturers(): Promise<{ lecturers: any[] }> {
  const response = await apiClient.get('/users?role=lecturer')
  return response.data
}

/**
 * Assign lecturer to course
 */
export async function assignLecturer(
  courseId: string,
  lecturerId: string
): Promise<CourseData> {
  const response = await apiClient.post(`/courses/${courseId}/lecturer`, {
    lecturer_id: lecturerId,
  })
  return response.data
}

/**
 * Get course with enrollments count
 */
export async function getCourseDetails(courseId: string): Promise<CourseData & { student_count: number }> {
  const response = await apiClient.get(`/courses/${courseId}`)
  return response.data
}

/**
 * List all lecturers as a flat array (used by course edit page)
 */
export async function listLecturers(): Promise<any[]> {
  const response = await apiClient.get('/users?role=lecturer')
  return response.data?.lecturers || []
}

export interface LecturerWorkload {
  lecturer_id: string
  full_name: string
  email: string
  used_credits: number
  remaining_credits: number
  is_full: boolean
}

/**
 * Get credit load per lecturer for a given semester/academic_year.
 * Max allowed: 9 credits per lecturer per semester.
 */
export async function getLecturerWorkloads(
  semester?: string | number,
  academic_year?: string
): Promise<LecturerWorkload[]> {
  const params: Record<string, string> = {}
  if (semester !== undefined && semester !== '') params.semester = String(semester)
  if (academic_year) params.academic_year = academic_year
  const response = await apiClient.get('/courses/lecturer-workloads', { params })
  return response.data || []
}
