// Assessments API - Assessment configuration and management API calls
import { apiClient } from './client'

// ==================== Types ====================
export interface AssessmentData {
  id: string
  course_id: string
  name: string
  type: 'assignment' | 'exam' | 'quiz' | 'project' | 'test'
  max_score: number
  weight: number
  status: 'locked' | 'unlocked'
  created_at?: string
  updated_at?: string
}

export interface AssessmentFormData {
  name: string
  type: 'assignment' | 'exam' | 'quiz' | 'project' | 'test'
  max_score: number
  weight: number
}

export interface AssessmentsListResponse {
  data: AssessmentData[]
  total: number
  skip: number
  limit: number
}

// ==================== Assessments API Methods ====================

/**
 * Create a new assessment
 */
export async function createAssessment(
  courseId: string,
  data: AssessmentFormData
): Promise<AssessmentData> {
  const response = await apiClient.post(`/courses/${courseId}/assessments`, data)
  // Transform weight_percentage to weight for frontend consistency
  return {
    ...response.data,
    weight: response.data.weight_percentage ?? response.data.weight ?? 0
  }
}

/**
 * List assessments for a course
 */
export async function listAssessments(
  courseId: string,
  params?: { skip?: number; limit?: number }
): Promise<AssessmentsListResponse> {
  const response = await apiClient.get(`/courses/${courseId}/assessments`, { params })
  // Transform weight_percentage to weight for frontend consistency
  const data = Array.isArray(response.data) ? response.data : response.data.data || []
  const transformed = data.map((item: any) => ({
    ...item,
    weight: item.weight_percentage ?? item.weight ?? 0
  }))
  return Array.isArray(response.data) 
    ? transformed 
    : { ...response.data, data: transformed }
}

/**
 * Get a specific assessment
 */
export async function getAssessment(assessmentId: string): Promise<AssessmentData> {
  const response = await apiClient.get(`/assessments/${assessmentId}`)
  return response.data
}

/**
 * Update assessment (if schema not locked)
 */
export async function updateAssessment(
  assessmentId: string,
  data: Partial<AssessmentFormData>
): Promise<AssessmentData> {
  const response = await apiClient.put(`/assessments/${assessmentId}`, data)
  return response.data
}

/**
 * Delete assessment (if schema not locked)
 */
export async function deleteAssessment(
  courseId: string,
  assessmentId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete(`/courses/${courseId}/assessments/${assessmentId}`)
  return response.data
}

/**
 * Lock assessment schema (prevent further changes)
 */
export async function lockAssessmentSchema(courseId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/courses/${courseId}/assessments/lock`)
  return response.data
}

/**
 * Validate cumulative weight (client-side check)
 */
export function validateCumulativeWeight(assessments: AssessmentData[], newWeight: number): {
  valid: boolean
  total: number
  remaining: number
} {
  const existingWeight = assessments.reduce((sum, a) => sum + a.weight, 0)
  const total = existingWeight + newWeight

  return {
    valid: total <= 100,
    total,
    remaining: 100 - existingWeight,
  }
}
