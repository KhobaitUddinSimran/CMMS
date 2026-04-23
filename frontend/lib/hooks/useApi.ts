'use client'

import { useToast } from '@/lib/contexts/toast-context'
import { AxiosError } from 'axios'
import { useCallback } from 'react'
import { apiClient } from '@/lib/api/client'

interface ApiCallOptions {
  showSuccess?: boolean
  successMessage?: string
  showError?: boolean
  errorPrefix?: string
}

/**
 * Custom hook to make API calls with automatic error toast handling
 * Provides a consistent way to handle API errors across the application
 */
export function useApi() {
  const { showToast } = useToast()

  const handleError = useCallback(
    (error: unknown, options: ApiCallOptions = {}) => {
      const { showError = true, errorPrefix = 'Error' } = options

      if (!showError) return

      let message = 'An unexpected error occurred'

      if (error instanceof AxiosError) {
        if (error.response?.data?.detail) {
          message = error.response.data.detail
        } else if (error.response?.statusText) {
          message = error.response.statusText
        } else if (error.message) {
          message = error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      const finalMessage = errorPrefix ? `${errorPrefix}: ${message}` : message
      showToast('error', finalMessage)
    },
    [showToast]
  )

  const get = useCallback(
    async <T,>(
      url: string,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      try {
        const response = await apiClient.get<T>(url)
        if (options.showSuccess && options.successMessage) {
          showToast('success', options.successMessage)
        }
        return response.data
      } catch (error) {
        handleError(error, options)
        return null
      }
    },
    [handleError, showToast]
  )

  const post = useCallback(
    async <T,>(
      url: string,
      data?: unknown,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      try {
        const response = await apiClient.post<T>(url, data)
        if (options.showSuccess && options.successMessage) {
          showToast('success', options.successMessage)
        }
        return response.data
      } catch (error) {
        handleError(error, options)
        return null
      }
    },
    [handleError, showToast]
  )

  const put = useCallback(
    async <T,>(
      url: string,
      data?: unknown,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      try {
        const response = await apiClient.put<T>(url, data)
        if (options.showSuccess && options.successMessage) {
          showToast('success', options.successMessage)
        }
        return response.data
      } catch (error) {
        handleError(error, options)
        return null
      }
    },
    [handleError, showToast]
  )

  const delete_ = useCallback(
    async <T,>(
      url: string,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      try {
        const response = await apiClient.delete<T>(url)
        if (options.showSuccess && options.successMessage) {
          showToast('success', options.successMessage)
        }
        return response.data
      } catch (error) {
        handleError(error, options)
        return null
      }
    },
    [handleError, showToast]
  )

  return { get, post, put, delete: delete_, handleError }
}
