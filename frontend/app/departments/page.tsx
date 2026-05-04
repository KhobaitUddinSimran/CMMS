'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, BookOpen, GraduationCap, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { listCourses } from '@/lib/api/courses'
import { getEnrolledStudents } from '@/lib/api/enrollments'

interface CourseRec {
  id: string
  code: string
  name?: string
  section?: string
  semester?: string | number
  academic_year?: string
  year?: string
  credits?: number
  lecturer_id?: string
  lecturer_name?: string
}

interface DeptGroup {
  prefix: string
  label: string
  courses: CourseRec[]
  lecturers: Set<string>
  students: number
}

// Map common UTM course-code prefixes to programme labels.
// Falls back to the prefix itself if not recognised.
const PREFIX_LABELS: Record<string, string> = {
  SECJ: 'Software Engineering',
  SECR: 'Computer Networks & Security',
  SECP: 'Computer Science (General)',
  SECV: 'Computer Graphics & Multimedia',
  SECB: 'Bioinformatics',
  SECD: 'Data Engineering',
  SECI: 'Information Systems',
  SCSJ: 'Software Engineering (Postgrad)',
  SCSR: 'Computer Networks (Postgrad)',
  SCSV: 'Computer Graphics (Postgrad)',
}

function extractPrefix(code: string): string {
  // Take leading letters (up to 4) — handles "SECJ3104", "SECJ 3104", "Secr1234"
  const m = (code || '').toUpperCase().match(/^[A-Z]{2,5}/)
  return m ? m[0] : (code || 'OTHER').toUpperCase().slice(0, 4)
}

export default function DepartmentsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<DeptGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cRes = await listCourses({ limit: 500 })
        const courses: CourseRec[] = cRes.data || (cRes as any) || []

        // Group by code prefix
        const map = new Map<string, DeptGroup>()
        for (const c of courses) {
          const p = extractPrefix(c.code)
          if (!map.has(p)) {
            map.set(p, {
              prefix: p,
              label: PREFIX_LABELS[p] || p,
              courses: [],
              lecturers: new Set(),
              students: 0,
            })
          }
          const g = map.get(p)!
          g.courses.push(c)
          if (c.lecturer_id) g.lecturers.add(c.lecturer_id)
        }

        // Fetch enrolment counts in parallel
        await Promise.all(courses.map(async (c) => {
          try {
            const students = await getEnrolledStudents(c.id)
            const count = Array.isArray(students)
              ? students.filter((s: any) => s.status === 'active' || s.status === 'ACTIVE').length
              : 0
            const g = map.get(extractPrefix(c.code))
            if (g) g.students += count
          } catch { /* ignore */ }
        }))

        if (cancelled) return
        // Sort: largest first
        const arr = Array.from(map.values()).sort((a, b) => b.courses.length - a.courses.length)
        setGroups(arr)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const totalCourses = groups.reduce((s, g) => s + g.courses.length, 0)
  const totalLecturers = groups.reduce((s, g) => s + g.lecturers.size, 0)
  const totalStudents = groups.reduce((s, g) => s + g.students, 0)

  return (
    <MainLayout>
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Programme Overview</h1>
          <p className="text-[#6B7280] mt-1">
            Course distribution grouped by programme code (e.g. SECJ, SECR)
          </p>
        </div>
      </div>

      {/* Top totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Programmes', value: groups.length, icon: Building2, color: 'text-[#C90031]', bg: 'bg-[#FEE2E2]' },
          { label: 'Courses', value: totalCourses, icon: BookOpen, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
          { label: 'Faculty Assigned', value: totalLecturers, icon: Users, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
          { label: 'Active Enrolments', value: totalStudents, icon: GraduationCap, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                  <p className={`text-[26px] font-bold mt-1 ${s.color}`}>
                    {loading ? <Spinner size="sm" /> : s.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {loading ? (
        <Card><div className="flex justify-center py-12"><Spinner size="lg" /></div></Card>
      ) : groups.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-[#6B7280] font-medium">No courses configured yet</p>
            <button
              onClick={() => router.push('/courses/create')}
              className="mt-3 px-4 py-2 bg-[#C90031] text-white rounded-lg text-sm font-medium hover:bg-[#A80028] transition-colors"
            >
              Create First Course
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const isOpen = !!expanded[g.prefix]
            return (
              <Card key={g.prefix} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [g.prefix]: !e[g.prefix] }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#C90031]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#111827] truncate">{g.label}</p>
                      <p className="text-[12px] text-[#6B7280]">Code prefix: <span className="font-mono">{g.prefix}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-5 text-[13px]">
                      <div className="text-right">
                        <p className="font-bold text-[#111827]">{g.courses.length}</p>
                        <p className="text-[11px] text-[#6B7280]">Courses</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#111827]">{g.lecturers.size}</p>
                        <p className="text-[11px] text-[#6B7280]">Lecturers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#111827]">{g.students}</p>
                        <p className="text-[11px] text-[#6B7280]">Students</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#E5E7EB]">
                    <table className="w-full text-[13px]">
                      <thead className="bg-[#F9FAFB] text-[#6B7280] text-[12px]">
                        <tr>
                          <th className="text-left px-5 py-2 font-medium">Code</th>
                          <th className="text-left px-4 py-2 font-medium">Name</th>
                          <th className="text-left px-4 py-2 font-medium">Section</th>
                          <th className="text-left px-4 py-2 font-medium">Year / Sem</th>
                          <th className="text-left px-4 py-2 font-medium">Lecturer</th>
                          <th className="text-right px-5 py-2 font-medium">Credits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.courses.map((c) => (
                          <tr key={c.id} className="border-t border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer"
                              onClick={() => router.push(`/courses/${c.id}`)}>
                            <td className="px-5 py-2.5 font-mono font-semibold text-[#C90031]">{c.code}</td>
                            <td className="px-4 py-2.5 text-[#111827]">{c.name || '—'}</td>
                            <td className="px-4 py-2.5 text-[#6B7280]">{c.section || '—'}</td>
                            <td className="px-4 py-2.5 text-[#6B7280]">
                              {(c.academic_year || c.year || '—')} / {c.semester || '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              {c.lecturer_name
                                ? <span className="text-[#111827]">{c.lecturer_name}</span>
                                : <span className="text-[#F59E0B] text-xs font-medium">Unassigned</span>}
                            </td>
                            <td className="px-5 py-2.5 text-right text-[#6B7280] tabular-nums">{c.credits ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
    </MainLayout>
  )
}
