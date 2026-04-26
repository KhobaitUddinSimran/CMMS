'use client'

import { useState, useRef } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { Button } from '../common/Button'

interface RosterUploadProps {
  courseId: string
  onUploadStart: () => void
  onUploadComplete: (data: any, file: File) => void
  onError: (error: string) => void
}

export function RosterUpload({ courseId, onUploadStart, onUploadComplete, onError }: RosterUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    const validExtensions = ['.xlsx', '.xls']
    
    if (!validTypes.includes(file.type)) {
      onError('Invalid file format. Please upload an Excel file (.xlsx or .xls)')
      return false
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validExtensions.includes(fileExtension)) {
      onError('Invalid file extension. Please upload an Excel file')
      return false
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      onError('File size exceeds 5MB limit')
      return false
    }

    return true
  }

  const handleFile = async (file: File) => {
    if (!validateFile(file)) return

    setIsLoading(true)
    onUploadStart()

    try {
      const { previewRosterUpload } = await import('@/lib/api/enrollments')
      const data = await previewRosterUpload(courseId, file)
      onUploadComplete(data, file)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <Upload className="w-6 h-6 text-blue-600" />
        </div>

        <div>
          <p className="text-gray-900 font-medium text-base">
            {isLoading ? 'Processing file...' : 'Drag and drop your Excel file here'}
          </p>
          <p className="text-gray-600 text-sm mt-1">or click to browse</p>
        </div>

        <p className="text-gray-500 text-xs">
          Supported formats: .xlsx, .xls (Max 5MB)
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Processing' : 'Select File'}
        </Button>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left w-full">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Required columns in your Excel file:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>student_id (or matric_number)</li>
                <li>email (@utm.my or @graduate.utm.my)</li>
                <li>first_name</li>
                <li>last_name (or full_name)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
