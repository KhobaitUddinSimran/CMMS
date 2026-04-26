// Queries API — student mark queries and lecturer responses
import { apiClient } from './client'

// ==================== Types ====================
// Real DB table: course_queries
// Columns: id, mark_id, student_id, query_text, lecturer_response, resolved_at, created_at, updated_at

export interface QueryData {
  id: string
  mark_id: string
  student_id: string
  query_text: string
  lecturer_response: string | null
  resolved_at: string | null
  created_at: string
  updated_at?: string
  // Derived field added by backend
  status: 'OPEN' | 'RESOLVED'
  // Enriched fields
  student?: { full_name: string; email: string }
  mark?: { id: string; assessment_id: string; raw_score: number | null }
  assessments?: { name: string; type: string; max_score?: number }
  courses?: { code: string; name: string }
}

export interface QueriesListResponse {
  queries: QueryData[]
  count: number
}

export interface CreateQueryPayload {
  assessment_id: string
  query_text: string
}

export interface RespondPayload {
  response: string
}

// ==================== API Functions ====================

/**
 * Submit a new query (student only)
 */
export async function submitQuery(payload: CreateQueryPayload): Promise<QueryData> {
  const { data } = await apiClient.post('/queries', payload)
  return data
}

/**
 * List queries — role-based (student: own; lecturer: their courses; coordinator+: all)
 */
export async function listQueries(params?: {
  course_id?: string
  status?: string
}): Promise<QueriesListResponse> {
  const { data } = await apiClient.get('/queries', { params })
  return data
}

/**
 * Get a single query with all responses
 */
export async function getQuery(queryId: string): Promise<QueryData> {
  const { data } = await apiClient.get(`/queries/${queryId}`)
  return data
}

/**
 * Respond to a query (lecturer / coordinator / admin)
 */
export async function respondToQuery(queryId: string, payload: RespondPayload): Promise<QueryData> {
  const { data } = await apiClient.post(`/queries/${queryId}/respond`, payload)
  return data
}

/**
 * Update query status
 */
export async function updateQueryStatus(queryId: string, status: string): Promise<QueryData> {
  const { data } = await apiClient.patch(`/queries/${queryId}/status`, { status })
  return data
}
