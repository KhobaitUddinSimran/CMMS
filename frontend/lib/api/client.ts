// API Client - Axios instance with interceptors
import axios from 'axios'

// Use relative URL so Next.js rewrites proxy to backend (avoids CORS)
const BASE_URL = ''

// In-memory token cache — avoids localStorage lookup on every request
let _cachedToken: string | null = null

export function setCachedToken(token: string | null) {
  _cachedToken = token
}

export function getTokenFromCache(): string | null {
  if (_cachedToken) return _cachedToken
  if (typeof window !== 'undefined') {
    _cachedToken = localStorage.getItem('token')
  }
  return _cachedToken
}

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout
})

export const authApiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getTokenFromCache()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

authApiClient.interceptors.request.use((config: any) => {
  const token = getTokenFromCache()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Debounce flag — prevent redirect loop if multiple 401s fire at once
let _redirectingToLogin = false

function handleSessionExpiry() {
  if (_redirectingToLogin) return
  _redirectingToLogin = true
  _cachedToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict'
    // Small delay to let in-flight requests finish before redirect
    setTimeout(() => {
      window.location.href = '/auth/login'
      _redirectingToLogin = false
    }, 100)
  }
}

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleSessionExpiry()
    }
    throw error
  }
)

authApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Only trigger session expiry for authenticated auth endpoints
      if (url.includes('/auth/me') || url.includes('/auth/logout')) {
        handleSessionExpiry()
      }
    }
    throw error
  }
)
