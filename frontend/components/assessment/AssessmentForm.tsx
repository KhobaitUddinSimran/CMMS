'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { AlertCircle } from 'lucide-react'

export interface AssessmentFormData {
  name: string
  type: 'assignment' | 'exam' | 'quiz' | 'project' | 'test'
  max_score: number
  weight: number
}

interface AssessmentFormProps {
  onSubmit: (data: AssessmentFormData) => Promise<void>
  existingAssessments?: AssessmentFormData[]
  isLoading?: boolean
}

export function AssessmentForm({
  onSubmit,
  existingAssessments = [],
  isLoading = false,
}: AssessmentFormProps) {
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    type: 'assignment',
    max_score: 100,
    weight: 0,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof AssessmentFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalWeight, setTotalWeight] = useState(0)
  const [remainingWeight, setRemainingWeight] = useState(100)

  useEffect(() => {
    // Map database field weight_percentage to form field weight
    const existing = existingAssessments.reduce((sum, a) => {
      const weight = a.weight || (a as any).weight_percentage || 0
      return sum + weight
    }, 0)
    setTotalWeight(existing)
    setRemainingWeight(100 - existing)
  }, [existingAssessments])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AssessmentFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Assessment name is required'
    }

    if (formData.max_score <= 0) {
      newErrors.max_score = 'Max score must be greater than 0'
    }

    if (formData.weight < 0 || formData.weight > 100) {
      newErrors.weight = 'Weight must be between 0 and 100'
    }

    const newTotal = totalWeight + formData.weight
    if (newTotal > 100) {
      newErrors.weight = `Total weight cannot exceed 100% (current: ${newTotal}%)`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof AssessmentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        name: '',
        type: 'assignment',
        max_score: 100,
        weight: 0,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const assessmentTypes = [
    { label: 'Assignment', value: 'assignment' },
    { label: 'Exam', value: 'exam' },
    { label: 'Quiz', value: 'quiz' },
    { label: 'Project', value: 'project' },
    { label: 'Test', value: 'test' },
  ]

  const newTotal = totalWeight + formData.weight
  const isWeightValid = newTotal <= 100
  const weightPercentage = remainingWeight > 0 ? (formData.weight / 100) * 100 : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Assessment Name"
          placeholder="e.g., Midterm Exam"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          disabled={isLoading || isSubmitting}
          required
        />

        <Select
          label="Assessment Type"
          value={formData.type}
          onChange={(value) => handleChange('type', value)}
          options={assessmentTypes}
          disabled={isLoading || isSubmitting}
        />

        <Input
          label="Max Score"
          type="number"
          placeholder="100"
          value={formData.max_score}
          onChange={(e) => handleChange('max_score', parseFloat(e.target.value) || 0)}
          error={errors.max_score}
          disabled={isLoading || isSubmitting}
          min="1"
          step="0.01"
          required
        />

        <Input
          label="Weight (%)"
          type="number"
          placeholder="0-100"
          value={formData.weight}
          onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
          error={errors.weight}
          disabled={isLoading || isSubmitting}
          min="0"
          max="100"
          step="0.01"
          required
        />
      </div>

      {/* Weight Distribution Info */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Weight Distribution</span>
          <span className={`font-semibold ${isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
            {newTotal}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${isWeightValid ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(newTotal, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>Used: {totalWeight}%</span>
          <span>This form: {formData.weight}%</span>
          <span>Remaining: {Math.max(0, remainingWeight - formData.weight)}%</span>
        </div>

        {!isWeightValid && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertCircle className="w-4 h-4" />
            <span>Total weight exceeds 100%</span>
          </div>
        )}
      </div>

      {/* Existing Assessments List */}
      {existingAssessments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Existing Assessments</h3>
          <div className="space-y-2">
            {existingAssessments.map((assessment, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{assessment.name}</p>
                  <p className="text-xs text-gray-600">
                    {assessment.type} • {assessment.max_score} points
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900">{assessment.weight}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
        <Button
          type="submit"
          disabled={isLoading || isSubmitting || !isWeightValid}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Assessment'}
        </Button>
      </div>
    </form>
  )
}
