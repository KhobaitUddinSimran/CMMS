import { apiClient } from './client'

export interface SemesterTimeline {
  id: string
  academic_year: string
  semester: number
  start_date: string
  end_date: string
  grade_submission_deadline?: string | null
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
  grade_submission_deadline?: string
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

export async function getSemesterCourses(timelineId: string): Promise<string[]> {
  const { data } = await apiClient.get(`/semester-timelines/${timelineId}/courses`)
  return data?.course_ids || []
}

export async function setSemesterCourses(timelineId: string, courseIds: string[]): Promise<void> {
  await apiClient.put(`/semester-timelines/${timelineId}/courses`, { course_ids: courseIds })
}

export async function sendDeadlineReminders(timelineId: string): Promise<{ sent: number; skipped: number; message: string }> {
  const { data } = await apiClient.post(`/semester-timelines/${timelineId}/send-reminders`)
  return data
}
