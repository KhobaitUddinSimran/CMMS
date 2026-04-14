// Role Guard Component - Restricts access by user role
'use client'

import { useRole } from '@/hooks/useRole'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRoles: string[]
  fallback?: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles,
  fallback = <div>Access Denied</div>,
}) => {
  const userRole = useRole()

  if (!userRole || !requiredRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
