export type UserRole = 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  initials: string
  firstLogin: boolean
  special_roles?: string[]
  full_name?: string
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export type AlertType = 'info' | 'success' | 'error' | 'warning'
export type BadgeVariant = 'draft' | 'published' | 'flagged' | 'delayed' | 'anomaly' | 'role'
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'
