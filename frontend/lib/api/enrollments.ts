// Enrollments API - Student enrollment and roster management API calls
import { apiClient } from './client'

// ==================== Types ====================
export interface EnrolledStudent {
  id: string
  email: string
  full_name: string
  enrollment_date: string
  status: 'active' | 'dropped'
}

export interface EnrollmentData {
  id: string
  course_id: string
  student_id: string
  student_email: string
  student_name: string
  enrollment_date: string
  source: 'manual' | 'roster_upload' | 'self_seeding'
  status: 'active' | 'dropped'
  created_at?: string
  updated_at?: string
}

export interface RosterImportResult {
  total_rows: number
  created_students: number
  existing_students: number
  failed_students: number
  errors: string[]
}

// ==================== Enrollments API Methods ====================

/**
 * Get all students enrolled in a course
 */
export async function getEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
  const response = await apiClient.get(`/courses/${courseId}/students`)
  return response.data
}

/**
 * Add a student to a course
 */
export async function addStudent(courseId: string, studentEmail: string): Promise<EnrolledStudent> {
  const response = await apiClient.post(`/courses/${courseId}/enrollments`, {
    student_email: studentEmail,
  })
  return response.data
}

/**
 * Drop a student from a course (soft delete)
 */
export async function dropStudent(courseId: string, studentId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/courses/${courseId}/enrollments/${studentId}`)
  return response.data
}

/**
 * Get course enrollments with pagination
 */
export async function getCourseEnrollments(
  courseId: string,
  params?: { skip?: number; limit?: number; status?: string }
) {
  const response = await apiClient.get(`/courses/${courseId}/enrollments`, { params })
  return response.data
}

// ==================== Roster Upload Methods ====================

/**
 * Upload Excel roster file (dry-run preview)
 */
export async function previewRosterUpload(courseId: string, file: File): Promise<RosterImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`/courses/${courseId}/roster/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Upload and process Excel roster (actual import)
 */
export async function uploadRoster(courseId: string, file: File): Promise<RosterImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`/courses/${courseId}/roster/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Confirm roster import after preview
 */
export async function confirmRosterImport(
  courseId: string,
  previewId: string
): Promise<RosterImportResult> {
  const response = await apiClient.post(`/courses/${courseId}/roster/confirm`, { preview_id: previewId })
  return response.data
}
