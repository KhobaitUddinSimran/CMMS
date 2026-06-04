import { describe, expect, it } from 'vitest'
import { buildTeachingLoadReport } from '@/lib/utils/teachingLoadReport'

describe('buildTeachingLoadReport', () => {
  it('uses backend workload totals and flags mismatches', () => {
    const report = buildTeachingLoadReport(
      [
        { id: 'c1', code: 'CS101', semester: '1', academic_year: '2025/2026', credits: 3, lecturer_id: 'u1', lecturer_name: 'Dr. Ada' },
        { id: 'c2', code: 'CS102', semester: '1', academic_year: '2025/2026', credits: 2, lecturer_id: 'u1', lecturer_name: 'Dr. Ada' },
        { id: 'c3', code: 'CS103', semester: '1', academic_year: '2025/2026', credits: 1, lecturer_name: 'Missing Person' },
        { id: 'c4', code: 'CS104', semester: '1', academic_year: '2025/2026', credits: 2 },
      ],
      [
        { lecturer_id: 'u1', full_name: 'Dr. Ada', email: 'ada@example.com', used_credits: 4, max_credits: 6, remaining_credits: 2, is_full: false },
      ] as any
    )

    expect(report.metrics.backend_assigned_credits).toBe(4)
    expect(report.metrics.recomputed_assigned_credits).toBe(5)
    expect(report.metrics.mismatch_count).toBe(1)
    expect(report.lecturer_summaries[0].backend_credits).toBe(4)
    expect(report.lecturer_summaries[0].recomputed_credits).toBe(5)
    expect(report.unassigned_courses).toHaveLength(1)
    expect(report.unmatched_assigned_courses).toHaveLength(1)
  })

  it('groups courses by academic year and semester', () => {
    const report = buildTeachingLoadReport(
      [
        { id: 'c1', code: 'CS101', semester: '1', academic_year: '2025/2026', credits: 3 },
        { id: 'c2', code: 'CS102', semester: '2', academic_year: '2025/2026', credits: 2 },
      ],
      []
    )

    expect(report.groups).toHaveLength(2)
    expect(report.groups[0].academic_year).toBe('2025/2026')
    expect(report.groups[0].semester).toBe('1')
    expect(report.groups[1].semester).toBe('2')
  })
})