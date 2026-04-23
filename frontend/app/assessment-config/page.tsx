'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Select } from '@/components/common/Select'
import { Spinner } from '@/components/common/Spinner'
import { AssessmentForm, type AssessmentFormData } from '@/components/assessment/AssessmentForm'
import { useToastStore } from '@/stores/toastStore'
import { listCourses, getCourse } from '@/lib/api/courses'
import { listAssessments, createAssessment, deleteAssessment, lockAssessmentSchema } from '@/lib/api/assessments'
import { Lock, Trash2, ClipboardList, AlertTriangle } from 'lucide-react'

interface CourseItem {
  id: string
  code: string
  name?: string
  section: string
  year: string
  semester: string
  assessment_schema_locked?: boolean
}

interface Assessment extends AssessmentFormData {
  id: string
}

export default function AssessmentConfigPage() {
  const { addToast } = useToastStore()

  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [confirmLock, setConfirmLock] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourseId) loadAssessments()
  }, [selectedCourseId])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await listCourses()
      setCourses(data.data || (data as any))
    } catch {
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
        const detail = await getCourse(selectedCourseId)
        setSelectedCourse({ ...course, assessment_schema_locked: (detail as any).assessment_schema_locked })
        const data = await listAssessments(selectedCourseId)
        const list: Assessment[] = Array.isArray(data) ? data : (data as any).data || []
        setAssessments(list)
      }
    } catch {
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
      setAssessments((prev) => [...prev, result as Assessment])
      addToast('Assessment added successfully', 'success')
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Failed to create assessment'
      addToast(msg, 'error')
    } finally {
      setLoadingCreate(false)
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!selectedCourseId) return
    if (!confirm('Delete this assessment?')) return
    try {
      await deleteAssessment(selectedCourseId, assessmentId)
      setAssessments((prev) => prev.filter((a) => a.id !== assessmentId))
      addToast('Assessment deleted', 'success')
    } catch (error: any) {
      addToast(error?.message || 'Failed to delete assessment', 'error')
    }
  }

  const handleLockSchema = async () => {
    if (!selectedCourseId) return
    try {
      await lockAssessmentSchema(selectedCourseId)
      setSelectedCourse((prev) => prev ? { ...prev, assessment_schema_locked: true } : prev)
      setConfirmLock(false)
      addToast('Assessment schema locked — no further changes allowed', 'success')
    } catch (error: any) {
      addToast(error?.message || 'Failed to lock schema', 'error')
    }
  }

  const totalWeight = assessments.reduce((sum, a) => sum + (a.weight ?? 0), 0)
  const courseOptions = courses.map((c) => ({
    label: `${c.code} – Sec ${c.section} (${c.year} Sem ${c.semester})`,
    value: c.id,
  }))

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Assessment Configuration</h1>
          <p className="text-[#6B7280] mt-2">
            Define and manage assessment schemas for your courses
          </p>
        </div>

        {/* Course Selector */}
        <Card>
          <div className="space-y-3">
            <h2 className="font-semibold text-[#111827]">Select Course</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-[#6B7280]">
                <Spinner />
                <span className="text-sm">Loading courses…</span>
              </div>
            ) : (
              <Select
                label=""
                value={selectedCourseId}
                onChange={setSelectedCourseId}
                options={courseOptions}
                placeholder="Choose a course to configure…"
              />
            )}
          </div>
        </Card>

        {/* No course selected placeholder */}
        {!selectedCourseId && !loading && (
          <Card>
            <div className="text-center py-10">
              <ClipboardList className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-medium text-[#6B7280]">Select a course above to configure its assessments</p>
            </div>
          </Card>
        )}

        {/* Assessment schema locked banner */}
        {selectedCourse?.assessment_schema_locked && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Schema Locked</p>
              <p className="text-sm text-green-800 mt-0.5">
                No further changes can be made to this course&apos;s assessment structure.
              </p>
            </div>
          </div>
        )}

        {selectedCourseId && selectedCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Assessment Form */}
            {!selectedCourse.assessment_schema_locked && (
              <div className="lg:col-span-1">
                <Card>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#111827]">Add Assessment</h3>
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
                  {/* Header row with weight summary and lock button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#111827]">
                        Assessments ({assessments.length})
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Total weight: <span className={totalWeight > 100 ? 'text-red-600 font-bold' : 'text-[#111827] font-semibold'}>{totalWeight}%</span>
                        {' '}/ 100%
                      </p>
                    </div>
                    {!selectedCourse.assessment_schema_locked && assessments.length > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Lock className="w-4 h-4" />}
                        onClick={() => setConfirmLock(true)}
                      >
                        Lock Schema
                      </Button>
                    )}
                  </div>

                  {/* Weight progress bar */}
                  {assessments.length > 0 && (
                    <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${totalWeight > 100 ? 'bg-red-500' : totalWeight === 100 ? 'bg-green-500' : 'bg-[#C90031]'}`}
                        style={{ width: `${Math.min(totalWeight, 100)}%` }}
                      />
                    </div>
                  )}

                  {loadingAssessments ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  ) : assessments.length === 0 ? (
                    <div className="text-center py-8 text-[#6B7280]">
                      <p className="font-medium">No assessments configured</p>
                      <p className="text-xs mt-1">Add assessments using the form to define the grading scheme</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="border border-[#E5E7EB] rounded-lg p-4 flex items-start justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#111827]">{assessment.name}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5">
                              {assessment.type} &nbsp;·&nbsp; Max: {assessment.max_score} pts
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-xl font-bold text-[#C90031]">{assessment.weight}%</p>
                              <p className="text-[10px] text-[#9CA3AF]">weight</p>
                            </div>
                            {!selectedCourse.assessment_schema_locked && (
                              <button
                                onClick={() => handleDeleteAssessment(assessment.id)}
                                className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Delete assessment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Lock confirmation modal */}
        {confirmLock && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#111827]">Lock Assessment Schema?</p>
                  <p className="text-sm text-[#6B7280] mt-1">
                    This is irreversible. Once locked, no assessments can be added, edited, or deleted for this course.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmLock(false)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleLockSchema}>
                  Yes, Lock It
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
