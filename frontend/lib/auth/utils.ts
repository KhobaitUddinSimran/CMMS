// Auth utilities
import type { AuthUser } from '@/types/auth'

/**
 * Calculate initials from full name
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Transform API user response to AuthUser with computed properties
 */
export function transformAuthUser(user: any): AuthUser | null {
  if (!user) return null
  const fullName = user.full_name || user.name || ''
  const initials = getInitials(fullName)

  return {
    ...user,
    full_name: fullName,
    name: fullName, // Add name alias
    initials, // Add computed initials
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: AuthUser | null, token: string | null): boolean {
  return !!user && !!token
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * Check if user account is approved
 */
export function isApproved(user: AuthUser | null): boolean {
  if (!user) return false
  return user.approval_status === 'approved'
}

/**
 * Check if user can access dashboard
 */
export function canAccessDashboard(user: AuthUser | null): boolean {
  return isAuthenticated(user, null) && isApproved(user)
}
