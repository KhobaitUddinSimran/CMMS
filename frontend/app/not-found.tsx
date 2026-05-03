'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been deleted or moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[#C90031] hover:bg-[#A80028] text-white rounded-lg transition-colors font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
