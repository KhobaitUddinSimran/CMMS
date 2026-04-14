// API Types - API request/response types
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface ApiError {
  detail: string
  status_code: number
}
