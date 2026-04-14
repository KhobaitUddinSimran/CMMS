// useToast Hook - Toast notifications
'use client'

import { useToastStore } from '@/stores/toastStore'

export const useToast = () => {
  return useToastStore()
}
