'use client'

import { AuthProvider } from '@/lib/contexts/auth-context'
import { ToastProvider } from '@/lib/contexts/toast-context'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}
