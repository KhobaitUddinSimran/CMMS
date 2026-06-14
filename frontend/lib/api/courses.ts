// Courses API - Course management API calls
import { apiClient } from './client'

// ==================== Types ====================
export type CourseCategory = 'engineering' | 'mathematics' | 'university' | 'language'

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
  coordinator_name?: string
  max_students?: number
  category?: CourseCategory
  has_final_exam?: boolean
  lecture_hours?: number
  tutorial_hours?: number
  lab_hours?: number
  lab_name?: string
  special_notes?: string
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
  category?: CourseCategory
  lecturer_id?: string
  coordinator_id?: string
  has_final_exam?: boolean
  lecture_hours?: number
  tutorial_hours?: number
  lab_hours?: number
  lab_name?: string
  special_notes?: string
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
  lecturerId: string | null | undefined
): Promise<CourseData> {
  const response = await apiClient.post(`/courses/${courseId}/lecturer`, {
    lecturer_id: lecturerId || null,
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
  max_credits: number
  remaining_credits: number
  is_overloaded: boolean
  is_full: boolean
}

/**
 * Get annual credit load per lecturer for a given academic year.
 * Credits are summed across ALL semesters in the year — cap is 12 cr/year by default.
 */
export async function getLecturerWorkloads(
  academic_year_id?: string,
  academic_year?: string,
  timeline_id?: string
): Promise<LecturerWorkload[]> {
  const params: Record<string, string> = {}
  if (academic_year_id) {
    params.academic_year_id = academic_year_id
  } else if (academic_year) {
    params.academic_year = academic_year
  } else if (timeline_id) {
    params.timeline_id = timeline_id
  }
  const response = await apiClient.get('/courses/lecturer-workloads', { params })
  return response.data || []
}

/**
 * Get active enrollment counts for all courses as {courseId: count}.
 * Single DB aggregation query — avoids N per-course requests.
 */
export async function getCourseEnrollmentCounts(): Promise<Record<string, number>> {
  const response = await apiClient.get('/courses/enrollment-counts')
  return response.data || {}
}
