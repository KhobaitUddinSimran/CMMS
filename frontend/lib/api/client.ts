// API Client - Axios instance with interceptors
import axios from 'axios'

// Use relative URL so Next.js rewrites proxy to backend (avoids CORS)
const BASE_URL = ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 for authentication endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      
      // Only logout if trying to access protected endpoint with invalid token
      if (url.includes('/auth/me') || url.includes('/auth/logout')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          document.cookie = 'token=; path=/; max-age=0; SameSite=Strict'
          window.location.href = '/auth/login?role=student'
        }
      }
      // For other endpoints, just pass the error to be handled by the component
    }
    
    throw error
  }
)
