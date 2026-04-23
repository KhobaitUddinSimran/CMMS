'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { BookOpen } from 'lucide-react'

export interface CourseFormData {
  code: string
  name: string
  section: string
  year: string
  semester: string
  credits: number
}

interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>
  loading?: boolean
  initialData?: Partial<CourseFormData>
}

export function CourseForm({ onSubmit, loading = false, initialData }: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    code: '',
    name: '',
    section: '',
    year: '',
    semester: '',
    credits: 3,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({})

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }))
    }
  }, [initialData])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Course code is required'
    } else if (formData.code.length > 50) {
      newErrors.code = 'Course code must be 50 characters or less'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required'
    } else if (formData.name.length > 255) {
      newErrors.name = 'Course name must be 255 characters or less'
    }

    if (!formData.section.trim()) {
      newErrors.section = 'Section is required'
    }

    if (!formData.credits || formData.credits < 1 || formData.credits > 10) {
      newErrors.credits = 'Credits must be between 1 and 10' as any
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Academic year is required'
    }

    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await onSubmit(formData)
    } catch {
      // Error handled by parent
    }
  }

  const handleChange = (field: keyof CourseFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const raw = e.target.value
    const value: any = field === 'credits' ? Number(raw) : raw
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Generate year options (current year ± 2)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i
    return `${y}/${y + 1}`
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
        <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#C90031]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#111827]">Course Details</h3>
          <p className="text-xs text-[#6B7280]">Fill in the course information</p>
        </div>
      </div>

      <Input
        label="Course Code"
        placeholder="e.g. SCSJ3104"
        value={formData.code}
        onChange={handleChange('code')}
        error={errors.code}
        disabled={loading}
      />

      <Input
        label="Course Name"
        placeholder="e.g. Software Engineering"
        value={formData.name}
        onChange={handleChange('name')}
        error={errors.name}
        disabled={loading}
      />

      <Input
        label="Section"
        placeholder="e.g. 01"
        value={formData.section}
        onChange={handleChange('section')}
        error={errors.section}
        disabled={loading}
      />

      <Input
        label="Credits"
        type="number"
        placeholder="e.g. 3"
        value={String(formData.credits)}
        onChange={handleChange('credits')}
        error={errors.credits as any}
        disabled={loading}
      />

      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#111827]">Academic Year</label>
        <select
          value={formData.year}
          onChange={handleChange('year')}
          disabled={loading}
          className={`w-full h-10 border rounded-lg px-3 text-[14px] transition-colors outline-none
            ${errors.year ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB]'}
            ${loading ? 'bg-[#F3F4F6] cursor-not-allowed' : 'bg-white'}`}
        >
          <option value="">Select year</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {errors.year && <p className="text-[12px] text-[#EF4444]">{errors.year}</p>}
      </div>

      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#111827]">Semester</label>
        <select
          value={formData.semester}
          onChange={handleChange('semester')}
          disabled={loading}
          className={`w-full h-10 border rounded-lg px-3 text-[14px] transition-colors outline-none
            ${errors.semester ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB]'}
            ${loading ? 'bg-[#F3F4F6] cursor-not-allowed' : 'bg-white'}`}
        >
          <option value="">Select semester</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Short Semester</option>
        </select>
        {errors.semester && <p className="text-[12px] text-[#EF4444]">{errors.semester}</p>}
      </div>

      <div className="pt-4 border-t border-[#E5E7EB]">
        <Button type="submit" loading={loading} className="w-full">
          {initialData ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}
