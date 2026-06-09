'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { BookOpen, FlaskConical, GraduationCap, ChevronDown } from 'lucide-react'
import type { CourseCategory } from '@/lib/api/courses'

export interface CourseFormData {
  code: string
  name: string
  section: string
  year: string
  semester: string
  credits: number
  category: CourseCategory
  has_final_exam: boolean
  lecture_hours: number
  tutorial_hours: number
  lab_hours: number
  lab_name: string
  special_notes: string
}

interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>
  loading?: boolean
  initialData?: Partial<CourseFormData>
}

const CATEGORY_OPTIONS: { value: CourseCategory; label: string }[] = [
  { value: 'engineering',  label: 'Engineering Course' },
  { value: 'mathematics',  label: 'Mathematics Course' },
  { value: 'university',   label: 'University General Course' },
  { value: 'language',     label: 'Language Course' },
]

const SELECT_CLS = (err?: string, disabled?: boolean) =>
  `w-full h-10 border rounded-lg px-3 text-[14px] transition-colors outline-none
   ${err ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB]'}
   ${disabled ? 'bg-[#F3F4F6] cursor-not-allowed' : 'bg-white'}`

export function CourseForm({ onSubmit, loading = false, initialData }: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    code: '',
    name: '',
    section: '',
    year: '',
    semester: '',
    credits: 3,
    category: 'engineering',
    has_final_exam: false,
    lecture_hours: 2,
    tutorial_hours: 0,
    lab_hours: 0,
    lab_name: '',
    special_notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({})

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {}

    if (!String(formData.code ?? '').trim())
      newErrors.code = 'Course code is required'
    else if (String(formData.code ?? '').length > 50)
      newErrors.code = 'Course code must be 50 characters or less'

    if (!String(formData.name ?? '').trim())
      newErrors.name = 'Course name is required'
    else if (String(formData.name ?? '').length > 255)
      newErrors.name = 'Course name must be 255 characters or less'

    if (!String(formData.section ?? '').trim())
      newErrors.section = 'Section is required'

    if (!formData.credits || formData.credits < 1 || formData.credits > 10)
      newErrors.credits = 'Credits must be between 1 and 10' as any

    if (!String(formData.year ?? '').trim())
      newErrors.year = 'Academic year is required'

    if (!String(formData.semester ?? '').trim())
      newErrors.semester = 'Semester is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try { await onSubmit(formData) } catch { /* handled by parent */ }
  }

  const handleChange = (field: keyof CourseFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const raw = e.target.value
    const numFields = ['credits', 'lecture_hours', 'tutorial_hours', 'lab_hours']
    const value: any = numFields.includes(field) ? Number(raw) : raw
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleFinalExam = () =>
    setFormData((prev) => ({ ...prev, has_final_exam: !prev.has_final_exam }))

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i
    return `${y}/${y + 1}`
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
        <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#C90031]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#111827]">Course Details</h3>
          <p className="text-xs text-[#6B7280]">Fill in the course information</p>
        </div>
      </div>

      {/* Basic info */}
      <Input label="Course Code" placeholder="e.g. SMJC3263"
        value={formData.code} onChange={handleChange('code')}
        error={errors.code} disabled={loading} />

      <Input label="Course Name" placeholder="e.g. Separation Processes 1"
        value={formData.name} onChange={handleChange('name')}
        error={errors.name} disabled={loading} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Section" placeholder="e.g. 1 or EB01"
          value={formData.section} onChange={handleChange('section')}
          error={errors.section} disabled={loading} />
        <Input label="Credits" type="number" placeholder="3"
          value={String(formData.credits)} onChange={handleChange('credits')}
          error={errors.credits as any} disabled={loading} />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[#111827]">Category</label>
        <div className="relative">
          <select value={formData.category} onChange={handleChange('category')}
            disabled={loading} className={SELECT_CLS(errors.category, loading)}>
            {CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        </div>
      </div>

      {/* Year / Semester */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#111827]">Academic Year</label>
          <select value={formData.year} onChange={handleChange('year')}
            disabled={loading} className={SELECT_CLS(errors.year, loading)}>
            <option value="">Select year</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.year && <p className="text-[12px] text-[#EF4444]">{errors.year}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#111827]">Semester</label>
          <select value={formData.semester} onChange={handleChange('semester')}
            disabled={loading} className={SELECT_CLS(errors.semester, loading)}>
            <option value="">Select semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Short Semester</option>
          </select>
          {errors.semester && <p className="text-[12px] text-[#EF4444]">{errors.semester}</p>}
        </div>
      </div>

      {/* Learning hours */}
      <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-4 h-4 text-[#6B7280]" />
          <span className="text-[12px] font-semibold text-[#374151]">Learning Hours / Week</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Lecture hrs" type="number" placeholder="2"
            value={String(formData.lecture_hours)} onChange={handleChange('lecture_hours')}
            disabled={loading} />
          <Input label="Tutorial hrs" type="number" placeholder="0"
            value={String(formData.tutorial_hours)} onChange={handleChange('tutorial_hours')}
            disabled={loading} />
          <Input label="Lab hrs" type="number" placeholder="0"
            value={String(formData.lab_hours)} onChange={handleChange('lab_hours')}
            disabled={loading} />
        </div>
      </div>

      {/* Final exam toggle */}
      <div className="flex items-center justify-between py-2 px-4 border border-[#E5E7EB] rounded-lg">
        <span className="text-[13px] text-[#374151]">Final Examination</span>
        <button type="button" onClick={toggleFinalExam} disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${formData.has_final_exam ? 'bg-[#C90031]' : 'bg-[#D1D5DB]'}
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
            ${formData.has_final_exam ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Lab name (only show when lab_hours > 0) */}
      {formData.lab_hours > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#6B7280]" />
            <label className="text-[12px] text-[#111827]">Laboratory Name</label>
          </div>
          <input
            type="text"
            value={formData.lab_name}
            onChange={handleChange('lab_name')}
            placeholder="e.g. Process Control & Instrumentation Lab"
            disabled={loading}
            className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-[14px] outline-none
              focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB] disabled:bg-[#F3F4F6]"
          />
        </div>
      )}

      {/* Special notes */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[#111827]">Special Notes / Constraints <span className="text-[#9CA3AF]">(optional)</span></label>
        <textarea
          value={formData.special_notes}
          onChange={handleChange('special_notes')}
          placeholder="e.g. Please avoid clash with SMJC3273"
          disabled={loading}
          rows={2}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] outline-none resize-none
            focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB] disabled:bg-[#F3F4F6]"
        />
      </div>

      <div className="pt-4 border-t border-[#E5E7EB]">
        <Button type="submit" loading={loading} className="w-full">
          {initialData ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}
