// Marks API - Mark management and grading API calls
import { apiClient } from './client'

// ==================== Types ====================
export interface MarkData {
  id: string
  student_id: string
  student_name?: string
  assessment_id: string
  assessment_name?: string
  score?: number | null        // normalised field used by frontend
  raw_score?: number | null    // DB field name — same value, kept for compatibility
  max_score?: number
  status: 'draft' | 'delayed' | 'flagged' | 'published' | 'anomaly'
  is_flagged?: boolean
  flag_note?: string | null
  delayed_reason?: string
  expected_date?: string
  created_at?: string
  updated_at?: string
}

export interface MarkUpdateData {
  raw_score?: number | null
  score?: number | null       // alias — normalised to raw_score before sending
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
  // Normalise score → raw_score so the backend model field name matches
  const payload: Record<string, unknown> = { ...data }
  if ('score' in payload && !('raw_score' in payload)) {
    payload.raw_score = payload.score
  }
  delete payload.score
  const response = await apiClient.put(`/marks/${markId}`, payload)
  const mark = response.data
  // Normalise raw_score → score for frontend grid consumption
  if (mark.score == null && mark.raw_score != null) mark.score = mark.raw_score
  return mark
}

/**
 * Flag a mark for review
 */
export async function flagMark(markId: string, reason: string): Promise<MarkData> {
  // Backend expects reason as a query param, not a request body
  const response = await apiClient.post(`/marks/${markId}/flag`, null, { params: { reason } })
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
 * Create a new mark (lecturer entry)
 */
export async function createMark(data: {
  student_id: string
  course_id?: string          // not used by backend but kept for call-site compat
  assessment_id: string
  score?: number | null
}): Promise<MarkData> {
  // Backend expects raw_score, not score; course_id is not a marks column
  const payload = {
    student_id: data.student_id,
    assessment_id: data.assessment_id,
    raw_score: data.score ?? null,
  }
  const response = await apiClient.post('/marks', payload)
  const mark = response.data
  // Normalise raw_score → score for frontend grid consumption
  if (mark.score == null && mark.raw_score != null) mark.score = mark.raw_score
  return mark
}

/**
 * Get ALL marks for a course (Smart Grid — all students × all assessments)
 */
export async function getCourseAllMarks(courseId: string): Promise<MarkData[]> {
  const response = await apiClient.get(`/marks/course/${courseId}`)
  // Handle both plain array and wrapped {data:[...]} responses defensively
  const raw = response.data
  const marks: MarkData[] = Array.isArray(raw) ? raw : (raw?.data ?? [])
  // Normalise raw_score → score on the client side as a safety net
  for (const m of marks) {
    if (m.score == null && m.raw_score != null) m.score = m.raw_score
  }
  return marks
}

/**
 * Get student marks summary grouped by course (for student marks page)
 */
export interface StudentCourseSummary {
  course_id: string
  carry_total: number
  marks: {
    assessment_name: string
    assessment_type: string
    score: number
    max_score: number
    weight_percentage: number
    weighted_contribution: number
  }[]
}

export async function getStudentMarksSummary(studentId: string): Promise<StudentCourseSummary[]> {
  const response = await apiClient.get(`/marks/student/${studentId}/summary`)
  return response.data
}

/**
 * Publish a list of mark IDs (moves them from draft → published)
 */
export async function publishMarkIds(markIds: string[]): Promise<{ message: string; count: number }> {
  const response = await apiClient.post('/marks/publish', { mark_ids: markIds })
  return response.data
}

/**
 * Revert a list of published mark IDs back to draft for re-editing
 */
export async function unpublishMarkIds(markIds: string[]): Promise<{ message: string; count: number }> {
  const response = await apiClient.post('/marks/unpublish', { mark_ids: markIds })
  return response.data
}

/**
 * Publish marks for an assessment (legacy alias — wraps publishMarkIds)
 * @deprecated Use publishMarkIds directly with specific mark IDs
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

export interface FlaggedMark {
  id: string
  student_id: string
  assessment_id: string
  raw_score: number | null
  is_flagged: boolean
  flag_note: string | null
  status: string
  updated_at?: string
  student?: { full_name: string; email: string }
  assessments?: { name: string; type: string; max_score: number; weight_percentage: number }
  courses?: { code: string; name: string }
}

/**
 * Get all flagged marks — coordinator / HOD / admin only
 */
export async function getFlaggedMarks(courseId?: string): Promise<{ flagged_marks: FlaggedMark[]; count: number }> {
  const params = courseId ? { course_id: courseId } : {}
  const { data } = await apiClient.get('/marks/flagged', { params })
  return data
}

/**
 * Clear flag on a mark — coordinator / HOD / admin only
 */
export async function unflagMark(markId: string): Promise<FlaggedMark> {
  const { data } = await apiClient.post(`/marks/${markId}/unflag`)
  return data
}
