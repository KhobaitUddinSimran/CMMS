import type { LecturerWorkload, CourseCategory } from '@/lib/api/courses'
import { yearLevelFromCode } from '@/lib/data/mjiit-curriculum'

export interface TeachingLoadCourseRow {
  id: string
  code: string
  name?: string
  section?: string
  semester?: string
  academic_year?: string
  year?: string
  credits?: number
  lecturer_id?: string
  lecturer_name?: string
  coordinator_id?: string
  coordinator_name?: string
  enrolled_count?: number
  max_students?: number
  category?: CourseCategory
  has_final_exam?: boolean
  lecture_hours?: number
  tutorial_hours?: number
  lab_hours?: number
  lab_name?: string
  special_notes?: string
}

// ── Derivation helpers ────────────────────────────────────────────────────────

/** Map DB category value to the CSV-style section header label. */
export function categoryLabel(category?: CourseCategory | null): string {
  switch (category) {
    case 'mathematics': return 'MATHEMATICS COURSES'
    case 'university':  return 'UNIVERSITY GENERAL COURSES'
    case 'language':    return 'LANGUAGE COURSES'
    default:            return 'ENGINEERING COURSES'
  }
}

/** Derive a human-readable course type from the UTM course code prefix.
 *  Accepts an optional DB category to use as the authoritative source. */
export function getCourseType(code: string, category?: CourseCategory | null): string {
  if (category === 'mathematics') return 'Mathematics'
  if (category === 'university')  return 'University'
  if (category === 'language')    return 'Language'
  const upper = code.trim().toUpperCase().replace(/\s+/g, '')
  if (/^SECJ|^SECV|^SECR|^SECD|^SECE|^SECF|^SECP|^SECI/.test(upper)) return 'SE Core'
  if (/^SCSE|^SCSR|^SCST|^SCSI|^SCSD/.test(upper)) return 'Computing'
  if (/^SMJ/.test(upper)) return 'ChE / MJIIT'
  if (/^UHL[BMJ]|^SHLJ/.test(upper)) return 'Language'
  if (/^UHIS|^UHMS|^ULRS|^UBSS|^UMJT|^SECD3761/.test(upper)) return 'University'
  if (/^U/.test(upper)) return 'General Elective'
  return 'Engineering'
}

/** Map UTM code first-digit to "Year N" label; returns null if not determinable. */
export function getYearLevelLabel(code: string): string {
  const level = yearLevelFromCode(code)
  if (level === null) return '—'
  return `Year ${level}`
}

/** Compute fill percentage string; returns "N/A" if cap is falsy. */
export function fillPct(enrolled: number, max?: number | null): string {
  if (!max) return 'N/A'
  return `${Math.min(100, Math.round((enrolled / max) * 100))}%`
}

/** Build a text progress bar for a 0–100 percentage value. */
export function fillBar(pct: number, width = 10): string {
  const filled = Math.round((pct / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

/** Section status label based on fill percentage. */
export function sectionStatus(enrolled: number, max?: number | null): string {
  if (!max) return '⚪ No Cap'
  const pct = (enrolled / max) * 100
  if (pct >= 95) return '🔴 Full'
  if (pct >= 70) return '🟡 High'
  return '🟢 Available'
}

export interface TeachingLoadLecturerSummary {
  lecturer_id: string
  full_name: string
  email: string
  backend_credits: number
  recomputed_credits: number
  max_credits: number | null
  remaining_credits: number | null
  is_full: boolean
  mismatch: boolean
  delta_credits: number
  assigned_courses: TeachingLoadCourseRow[]
}

export interface TeachingLoadGroup {
  academic_year: string
  semester: string
  courses: TeachingLoadCourseRow[]
}

export interface TeachingLoadReport {
  lecturer_summaries: TeachingLoadLecturerSummary[]
  groups: TeachingLoadGroup[]
  unassigned_courses: TeachingLoadCourseRow[]
  unmatched_assigned_courses: TeachingLoadCourseRow[]
  course_assignment_source_by_id: Record<string, 'id' | 'name' | 'unassigned' | 'unmatched'>
  metrics: {
    total_courses: number
    assigned_courses: number
    unassigned_courses: number
    unmatched_assigned_courses: number
    backend_assigned_credits: number
    recomputed_assigned_credits: number
    unassigned_credits: number
    unmatched_assigned_credits: number
    lecturer_count: number
    mismatch_count: number
  }
}

function normalizeKey(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase()
  return normalized ? normalized : null
}

function groupCourses(courses: TeachingLoadCourseRow[]): TeachingLoadGroup[] {
  const grouped = new Map<string, TeachingLoadCourseRow[]>()

  for (const course of courses) {
    const academicYear = course.academic_year || course.year || '—'
    const semester = course.semester || '—'
    const key = `${academicYear}||${semester}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(course)
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => {
      const [leftYear, leftSemester] = left.split('||')
      const [rightYear, rightSemester] = right.split('||')
      return rightYear !== leftYear ? rightYear.localeCompare(leftYear) : leftSemester.localeCompare(rightSemester)
    })
    .map(([key, groupedCourses]) => {
      const [academicYear, semester] = key.split('||')
      return {
        academic_year: academicYear,
        semester,
        courses: groupedCourses,
      }
    })
}

export function buildTeachingLoadReport(
  courses: TeachingLoadCourseRow[],
  workloads: LecturerWorkload[]
): TeachingLoadReport {
  const workloadById = new Map(workloads.map((workload) => [workload.lecturer_id, workload]))
  const workloadByName = new Map<string, LecturerWorkload>()

  for (const workload of workloads) {
    const fullNameKey = normalizeKey(workload.full_name)
    const emailKey = normalizeKey(workload.email)
    if (fullNameKey) workloadByName.set(fullNameKey, workload)
    if (emailKey) workloadByName.set(emailKey, workload)
  }

  const groupedCoursesByLecturer = new Map<string, TeachingLoadCourseRow[]>()
  const unassignedCourses: TeachingLoadCourseRow[] = []
  const unmatchedAssignedCourses: TeachingLoadCourseRow[] = []
  const courseAssignmentSourceById: Record<string, 'id' | 'name' | 'unassigned' | 'unmatched'> = {}
  let backendAssignedCredits = 0
  let recomputedAssignedCredits = 0
  let unassignedCredits = 0
  let unmatchedAssignedCredits = 0

  for (const course of courses) {
    const credits = course.credits ?? 0
    const lecturerId = course.lecturer_id?.trim() || ''
    const lecturerName = course.lecturer_name?.trim() || ''
    const matchedById = lecturerId ? workloadById.get(lecturerId) : undefined
    const matchedByName = !matchedById && lecturerName ? workloadByName.get(normalizeKey(lecturerName) || '') : undefined
    const matchedWorkload = matchedById || matchedByName

    if (matchedWorkload) {
      const matchedKey = matchedWorkload.lecturer_id
      if (!groupedCoursesByLecturer.has(matchedKey)) groupedCoursesByLecturer.set(matchedKey, [])
      groupedCoursesByLecturer.get(matchedKey)!.push(course)
      courseAssignmentSourceById[course.id] = matchedById ? 'id' : 'name'
      recomputedAssignedCredits += credits
      continue
    }

    if (lecturerId || lecturerName) {
      unmatchedAssignedCourses.push(course)
      unmatchedAssignedCredits += credits
      courseAssignmentSourceById[course.id] = 'unmatched'
    } else {
      unassignedCourses.push(course)
      unassignedCredits += credits
      courseAssignmentSourceById[course.id] = 'unassigned'
    }
  }

  const lecturerSummaries = workloads
    .map((workload) => {
      const assignedCourses = groupedCoursesByLecturer.get(workload.lecturer_id) || []
      const recomputedCredits = assignedCourses.reduce((sum, course) => sum + (course.credits ?? 0), 0)
      const backendCredits = workload.used_credits ?? 0
      const maxCredits = workload.max_credits ?? null
      const delta = Math.round((backendCredits - recomputedCredits) * 10) / 10
      const mismatch = Math.abs(delta) > 0.05

      backendAssignedCredits += backendCredits

      return {
        lecturer_id: workload.lecturer_id,
        full_name: workload.full_name?.trim() || workload.email?.trim() || workload.lecturer_id,
        email: workload.email?.trim() || '',
        backend_credits: backendCredits,
        recomputed_credits: recomputedCredits,
        max_credits: maxCredits,
        remaining_credits: maxCredits !== null ? Math.max(0, Math.round((maxCredits - backendCredits) * 10) / 10) : null,
        is_full: workload.is_full,
        mismatch,
        delta_credits: delta,
        assigned_courses: assignedCourses,
      }
    })
    .sort((left, right) => left.full_name.localeCompare(right.full_name))

  return {
    lecturer_summaries: lecturerSummaries,
    groups: groupCourses(courses),
    unassigned_courses: unassignedCourses,
    unmatched_assigned_courses: unmatchedAssignedCourses,
    course_assignment_source_by_id: courseAssignmentSourceById,
    metrics: {
      total_courses: courses.length,
      assigned_courses: courses.length - unassignedCourses.length - unmatchedAssignedCourses.length,
      unassigned_courses: unassignedCourses.length,
      unmatched_assigned_courses: unmatchedAssignedCourses.length,
      backend_assigned_credits: Math.round(backendAssignedCredits * 10) / 10,
      recomputed_assigned_credits: Math.round(recomputedAssignedCredits * 10) / 10,
      unassigned_credits: Math.round(unassignedCredits * 10) / 10,
      unmatched_assigned_credits: Math.round(unmatchedAssignedCredits * 10) / 10,
      lecturer_count: lecturerSummaries.length,
      mismatch_count: lecturerSummaries.filter((summary) => summary.mismatch).length,
    },
  }
}

export function resolveLecturerMatchSource(course: TeachingLoadCourseRow): 'id' | 'name' | 'missing' {
  if (course.lecturer_id?.trim()) return 'id'
  if (course.lecturer_name?.trim()) return 'name'
  return 'missing'
}