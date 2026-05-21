'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Select } from '@/components/common/Select'
import { Spinner } from '@/components/common/Spinner'
import { AssessmentForm, type AssessmentFormData } from '@/components/assessment/AssessmentForm'
import { useToastStore } from '@/stores/toastStore'
import { listCourses } from '@/lib/api/courses'
import { listAssessments, createAssessment, deleteAssessment, lockAssessmentSchema } from '@/lib/api/assessments'
import { getCarryTotals, type CarryTotalData } from '@/lib/api/marks'
import { Lock, TrendingUp, ClipboardList } from 'lucide-react'

interface CourseData {
  id: string
  code: string
  section: string
  year: string
  semester: string
  assessment_schema_locked: boolean
}

interface Assessment extends AssessmentFormData {
  id: string
}

export default function AssessmentSetupPage() {
  const { addToast } = useToastStore()

  const [, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseData[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'carry'>('config')
  const [carryTotals, setCarryTotals] = useState<CarryTotalData[]>([])
  const [loadingCarry, setLoadingCarry] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourseId) {
      loadAssessments()
    }
  }, [selectedCourseId])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await listCourses()
      setCourses((data.data || (data as any)) as CourseData[])
    } catch (error) {
      addToast('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAssessments = async () => {
    try {
      setLoadingAssessments(true)
      const course = courses.find((c) => c.id === selectedCourseId)
      if (course) {
        setSelectedCourse(course)
        const data = await listAssessments(selectedCourseId)
        setAssessments(data.data || data)
      }
    } catch (error) {
      addToast('Failed to load assessments', 'error')
    } finally {
      setLoadingAssessments(false)
    }
  }

  const handleCreateAssessment = async (data: AssessmentFormData) => {
    if (!selectedCourseId) {
      addToast('Please select a course first', 'error')
      return
    }

    setLoadingCreate(true)
    try {
      const result = await createAssessment(selectedCourseId, data)
      setAssessments([...assessments, result])
      addToast('Assessment created successfully', 'success')
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to create assessment'
      addToast(errorMsg, 'error')
    } finally {
      setLoadingCreate(false)
    }
  }

  const handleLockSchema = async () => {
    if (!selectedCourseId) return

    try {
      await lockAssessmentSchema(selectedCourseId)
      addToast('Assessment schema locked', 'success')
      await loadAssessments()
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to lock schema',
        'error'
      )
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!selectedCourseId) return

    try {
      await deleteAssessment(selectedCourseId, assessmentId)
      setAssessments(assessments.filter((a) => a.id !== assessmentId))
      addToast('Assessment deleted', 'success')
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to delete assessment',
        'error'
      )
    }
  }

  const loadCarryTotals = async (courseId: string) => {
    setLoadingCarry(true)
    try {
      const data = await getCarryTotals(courseId)
      setCarryTotals(Array.isArray(data) ? data : [])
    } catch {
      addToast('Failed to load carry totals', 'error')
    } finally {
      setLoadingCarry(false)
    }
  }

  const courseOptions = courses.map((c) => ({
    label: `${c.code}-${c.section} (${c.year}, Sem ${c.semester})`,
    value: c.id,
  }))

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Setup</h1>
          <p className="text-gray-600 mt-2">
            Configure assessments and define grading scheme for courses
          </p>
        </div>

        {/* Course Selection */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Select Course</h2>
            <Select
              label="Course"
              value={selectedCourseId}
              onChange={(value) => setSelectedCourseId(value)}
              options={courseOptions}
              placeholder="Choose a course..."
            />
          </div>
        </Card>

        {selectedCourseId && selectedCourse && (
          <>
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  activeTab === 'config' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Assessment Config
              </button>
              <button
                onClick={() => { setActiveTab('carry'); loadCarryTotals(selectedCourseId) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  activeTab === 'carry' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Carry Marks Summary
              </button>
            </div>
            {activeTab === 'carry' && (
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#111827]">Carry Marks Summary</h3>
                      <p className="text-[13px] text-[#6B7280] mt-0.5">Cumulative carry % per student (published marks only)</p>
                    </div>
                    <button
                      onClick={() => loadCarryTotals(selectedCourseId)}
                      className="text-[13px] text-[#6B7280] border border-[#E5E7EB] px-3 py-1.5 rounded-lg hover:bg-[#F9FAFB]"
                    >
                      Refresh
                    </button>
                  </div>
                  {loadingCarry ? (
                    <div className="flex justify-center py-10"><Spinner /></div>
                  ) : carryTotals.length === 0 ? (
                    <div className="text-center py-10">
                      <TrendingUp className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                      <p className="text-[#6B7280]">No published marks yet for this course</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            <th className="text-left px-4 py-2.5 font-semibold text-[#374151]">#</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-[#374151]">Student</th>
                            <th className="text-right px-4 py-2.5 font-semibold text-[#374151]">Carry %</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-[#374151]">Grade Band</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...carryTotals]
                            .sort((a, b) => b.carry_total - a.carry_total)
                            .map((row, i) => {
                              const pct = Number(row.carry_total)
                              const band = pct >= 70 ? { label: 'Strong', cls: 'bg-green-100 text-green-700' }
                                : pct >= 50 ? { label: 'Satisfactory', cls: 'bg-amber-100 text-amber-700' }
                                : { label: 'At Risk', cls: 'bg-red-100 text-red-700' }
                              return (
                                <tr key={row.student_id} className={`border-b border-[#E5E7EB] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                                  <td className="px-4 py-2.5 text-[#9CA3AF] text-[13px]">{i + 1}</td>
                                  <td className="px-4 py-2.5">
                                    <p className="font-medium text-[#111827]">{row.student_name || '—'}</p>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span className={`font-bold text-[15px] ${
                                      pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'
                                    }`}>
                                      {isNaN(pct) ? '—' : pct.toFixed(1) + '%'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${band.cls}`}>{band.label}</span>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'config' && selectedCourse.assessment_schema_locked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Assessment Schema Locked</p>
                  <p className="text-sm text-green-800 mt-1">
                    The assessment schema is locked. No further changes can be made to the assessment structure.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'config' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Assessment Form */}
              {!selectedCourse.assessment_schema_locked && (
                <div className="lg:col-span-1">
                  <Card>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Add Assessment</h3>
                      <AssessmentForm
                        onSubmit={handleCreateAssessment}
                        isLoading={loadingCreate}
                        existingAssessments={assessments}
                      />
                    </div>
                  </Card>
                </div>
              )}

              {/* Assessments List */}
              <div className={selectedCourse.assessment_schema_locked ? 'lg:col-span-3' : 'lg:col-span-2'}>
                <Card>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Assessments ({assessments.length})
                      </h3>
                      {!selectedCourse.assessment_schema_locked && assessments.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleLockSchema}
                          icon={<Lock className="w-4 h-4" />}
                        >
                          Lock Schema
                        </Button>
                      )}
                    </div>

                    {loadingAssessments ? (
                      <div className="flex items-center justify-center py-8">
                        <Spinner />
                      </div>
                    ) : assessments.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <p className="text-gray-600">
                          No assessments configured yet. Add assessments to define the grading scheme.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className="border border-gray-200 rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{assessment.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Type: {assessment.type} • Max: {assessment.max_score} points
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">
                                  {assessment.weight}%
                                </p>
                                <p className="text-xs text-gray-500">Weight</p>
                              </div>
                            </div>

                            {!selectedCourse.assessment_schema_locked && (
                              <button
                                onClick={() => handleDeleteAssessment(assessment.id)}
                                className="text-sm text-red-600 hover:text-red-700 py-2"
                              >
                                Delete Assessment
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>}
          </>
        )}

        {!selectedCourseId && (
          <Card className="bg-gray-50 text-center py-8">
            <p className="text-gray-600">Select a course to configure assessments</p>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
