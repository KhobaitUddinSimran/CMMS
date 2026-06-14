import { apiClient } from './client'

// ==================== Academic Year ====================

export interface AcademicYear {
  id: string
  name: string
  is_active: boolean
  created_by?: string | null
  created_at: string
  updated_at: string
}

export async function listAcademicYears(): Promise<AcademicYear[]> {
  const { data } = await apiClient.get('/academic-years')
  return data || []
}

export async function getActiveAcademicYear(): Promise<AcademicYear | null> {
  const { data } = await apiClient.get('/academic-years/active')
  return data || null
}

export async function createAcademicYear(name: string): Promise<AcademicYear> {
  const { data } = await apiClient.post('/academic-years', { name })
  return data
}

export async function activateAcademicYear(id: string): Promise<AcademicYear> {
  const { data } = await apiClient.put(`/academic-years/${id}/activate`)
  return data
}

export async function deleteAcademicYear(id: string): Promise<void> {
  await apiClient.delete(`/academic-years/${id}`)
}

// ==================== Semester Timelines ====================

export interface SemesterTimeline {
  id: string
  academic_year: string
  academic_year_id?: string | null
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
  academic_year_id?: string
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
