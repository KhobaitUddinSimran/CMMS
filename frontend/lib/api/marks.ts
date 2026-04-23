// Marks API - Mark management and grading API calls
import { apiClient } from './client'

// ==================== Types ====================
export interface MarkData {
  id: string
  student_id: string
  student_name: string
  assessment_id: string
  assessment_name: string
  score: number
  max_score: number
  status: 'draft' | 'delayed' | 'flagged' | 'published' | 'anomaly'
  delayed_reason?: string
  expected_date?: string
  created_at?: string
  updated_at?: string
}

export interface MarkUpdateData {
  score: number
  status?: string
  delayed_reason?: string
  expected_date?: string
}

export interface MarksListResponse {
  data: MarkData[]
  total: number
  skip: number
  limit: number
}

export interface CarryTotalData {
  student_id: string
  student_name: string
  carry_total: number
  max_possible: number
  percentage: number
  status: 'pass' | 'at_risk' | 'fail'
}

// ==================== Marks API Methods ====================

/**
 * Get marks for a course (Smart Grid data)
 */
export async function getCourseMarks(
  courseId: string,
  params?: {
    skip?: number
    limit?: number
    assessment_id?: string
    status?: string
  }
): Promise<MarksListResponse> {
  const response = await apiClient.get(`/courses/${courseId}/marks`, { params })
  return response.data
}

/**
 * Get marks for a specific assessment
 */
export async function getAssessmentMarks(
  assessmentId: string,
  params?: { skip?: number; limit?: number }
): Promise<MarksListResponse> {
  const response = await apiClient.get(`/assessments/${assessmentId}/marks`, { params })
  return response.data
}

/**
 * Get marks for a student
 */
export async function getStudentMarks(
  studentId: string,
  params?: { course_id?: string; assessment_id?: string }
): Promise<MarksListResponse> {
  const response = await apiClient.get(`/students/${studentId}/marks`, { params })
  return response.data
}

/**
 * Update a mark (DRAFT status)
 */
export async function updateMark(markId: string, data: MarkUpdateData): Promise<MarkData> {
  const response = await apiClient.put(`/marks/${markId}`, data)
  return response.data
}

/**
 * Flag a mark for review
 */
export async function flagMark(markId: string, reason: string): Promise<MarkData> {
  const response = await apiClient.post(`/marks/${markId}/flag`, { reason })
  return response.data
}

/**
 * Mark as DELAYED with expected date
 */
export async function markAsDelayed(
  markId: string,
  reason: string,
  expectedDate: string
): Promise<MarkData> {
  const response = await apiClient.post(`/marks/${markId}/delay`, {
    reason,
    expected_date: expectedDate,
  })
  return response.data
}

/**
 * Get carry totals for a course
 */
export async function getCarryTotals(courseId: string): Promise<CarryTotalData[]> {
  const response = await apiClient.get(`/courses/${courseId}/carry-totals`)
  return response.data
}

/**
 * Get carry total for a student
 */
export async function getStudentCarryTotal(studentId: string): Promise<CarryTotalData> {
  const response = await apiClient.get(`/students/${studentId}/carry-total`)
  return response.data
}

/**
 * Bulk import marks from Excel
 */
export async function bulkImportMarks(courseId: string, file: File): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`/courses/${courseId}/marks/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Preview bulk import (dry-run)
 */
export async function previewMarksImport(courseId: string, file: File): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`/courses/${courseId}/marks/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Publish marks for an assessment
 */
export async function publishAssessment(assessmentId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/assessments/${assessmentId}/publish`)
  return response.data
}

/**
 * Publish all marks for a course
 */
export async function publishAllMarks(courseId: string): Promise<{ message: string; count: number }> {
  const response = await apiClient.post(`/courses/${courseId}/marks/publish-all`)
  return response.data
}
