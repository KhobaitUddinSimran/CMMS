'use client'

import { useToast } from '@/lib/contexts/toast-context'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import type { ToastType } from '@/types'

const toastConfig: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-500',
    icon: <CheckCircle size={20} className="text-green-600" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-l-4 border-red-500',
    icon: <XCircle size={20} className="text-red-600" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-l-4 border-yellow-500',
    icon: <AlertCircle size={20} className="text-yellow-600" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-l-4 border-blue-500',
    icon: <Info size={20} className="text-blue-600" />,
  },
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type]
        return (
          <div
            key={toast.id}
            className={`${config.bg} ${config.border} rounded-r-lg p-4 flex items-center gap-3 shadow-lg animate-slide-in`}
          >
            <div className="shrink-0">{config.icon}</div>
            <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
