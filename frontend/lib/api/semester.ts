import { apiClient } from './client'

export interface SemesterTimeline {
  id: string
  academic_year: string
  semester: number
  start_date: string
  end_date: string
  midterm_deadline?: string | null
  grade_submission_deadline?: string | null
  final_deadline?: string | null
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SemesterTimelineInput {
  academic_year: string
  semester: number | string
  start_date: string
  end_date: string
  midterm_deadline?: string
  grade_submission_deadline?: string
  final_deadline?: string
  notes?: string
}

export async function listTimelines(): Promise<SemesterTimeline[]> {
  const { data } = await apiClient.get('/semester-timelines')
  return data || []
}

export async function upsertTimeline(payload: SemesterTimelineInput): Promise<SemesterTimeline> {
  const { data } = await apiClient.post('/semester-timelines', payload)
  return data
}

export async function deleteTimeline(id: string): Promise<void> {
  await apiClient.delete(`/semester-timelines/${id}`)
}
