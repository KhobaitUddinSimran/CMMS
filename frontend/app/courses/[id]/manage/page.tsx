'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ManageCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  useEffect(() => {
    router.replace(`/roster?course=${courseId}`)
  }, [courseId, router])

  return null
}
