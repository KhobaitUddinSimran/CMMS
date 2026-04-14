'use client'

import { Award, Download, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CertificatePage() {
  const router = useRouter()

  const certificates = [
    {
      id: 1,
      name: 'Advanced Programming Certificate',
      issuer: 'Computer Science Department',
      date: 'December 2023',
      status: 'Completed',
      color: 'gold',
    },
    {
      id: 2,
      name: 'Web Development Specialization',
      issuer: 'Computer Science Department',
      date: 'August 2023',
      status: 'Completed',
      color: 'silver',
    },
    {
      id: 3,
      name: 'Data Science Fundamentals',
      issuer: 'Computer Science Department',
      date: 'In Progress',
      status: 'In Progress',
      color: 'bronze',
    },
  ]

  const getBgColor = (color: string) => {
    switch (color) {
      case 'gold':
        return 'from-yellow-400 to-yellow-600'
      case 'silver':
        return 'from-gray-300 to-gray-500'
      case 'bronze':
        return 'from-orange-300 to-orange-600'
      default:
        return 'from-blue-400 to-blue-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Certificates</h1>
            <p className="text-gray-600">View and download your certificates and achievements</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Certificates List */}
        <div className="space-y-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6">
                {/* Certificate Info */}
                <div className="flex gap-4 flex-1 mb-4 md:mb-0">
                  <div className={`p-4 rounded-lg bg-gradient-to-br ${getBgColor(cert.color)} flex-shrink-0`}>
                    <Award size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{cert.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{cert.issuer}</p>
                    <p className="text-gray-500 text-xs">{cert.date}</p>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap text-center ${
                      cert.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {cert.status}
                  </span>
                  {cert.status === 'Completed' && (
                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
                      <Download size={16} />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">2</p>
              <p className="text-gray-600">Certificates Earned</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">How to Use Your Certificates</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Download and save for your records</li>
              <li>✓ Share on LinkedIn or other platforms</li>
              <li>✓ Print for physical portfolio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
