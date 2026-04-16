'use client'

import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { BookOpen, Zap } from 'lucide-react'

export default function MarksPage() {
  const marks = [
    { courseCode: 'CS101', courseName: 'Introduction to Programming', carryMark: 85, totalMarks: 100, percentage: 85 },
    { courseCode: 'CS102', courseName: 'Data Structures', carryMark: 78, totalMarks: 100, percentage: 78 },
    { courseCode: 'CS103', courseName: 'Web Development', carryMark: 92, totalMarks: 100, percentage: 92 },
    { courseCode: 'MATH201', courseName: 'Calculus II', carryMark: 88, totalMarks: 100, percentage: 88 },
    { courseCode: 'PHYS201', courseName: 'Physics II', carryMark: 75, totalMarks: 100, percentage: 75 },
  ]

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'published'
    if (percentage >= 70) return 'published'
    if (percentage >= 60) return 'delayed'
    return 'flagged'
  }

  const getStatusText = (percentage: number) => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 70) return 'Good'
    if (percentage >= 60) return 'Pass'
    return 'Needs Improvement'
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Carry Marks</h1>
        <p className="text-gray-600 mt-2">View your marks and academic performance across courses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{marks.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Carry Mark</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {(marks.reduce((acc, m) => acc + m.percentage, 0) / marks.length).toFixed(1)}%
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Passing Courses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {marks.filter(m => m.percentage >= 60).length}/{marks.length}
              </p>
            </div>
            <div className="w-8 h-8 text-green-500 text-lg">✓</div>
          </div>
        </Card>
      </div>

      {/* Marks Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Course Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Course Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Carry Mark</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((mark) => (
                <tr key={mark.courseCode} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-semibold text-gray-900">{mark.courseCode}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{mark.courseName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{mark.carryMark}/{mark.totalMarks}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{mark.percentage}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusColor(mark.percentage)}>
                      {getStatusText(mark.percentage)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
