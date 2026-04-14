// Navigation Component - Role-based menu items
'use client'

import Link from 'next/link'
import styles from './Navigation.module.css'

interface NavigationProps {
  role: string
}

const navItems: Record<string, { label: string; href: string }[]> = {
  student: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Courses', href: '/my-courses' },
    { label: 'My Marks', href: '/my-marks' },
    { label: 'Queries', href: '/queries' },
    { label: 'Profile', href: '/profile' },
  ],
  lecturer: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Courses', href: '/my-courses' },
    { label: 'Smart Grid', href: '/smart-grid' },
    { label: 'Assessment Setup', href: '/assessment-setup' },
    { label: 'Queries', href: '/queries' },
    { label: 'Profile', href: '/profile' },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Courses', href: '/courses' },
    { label: 'Roster', href: '/roster' },
    { label: 'Assessment Config', href: '/assessment-config' },
    { label: 'Reports', href: '/reports' },
    { label: 'Profile', href: '/profile' },
  ],
  hod: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Export', href: '/export' },
    { label: 'Audit Log', href: '/audit-log' },
    { label: 'Profile', href: '/profile' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Users', href: '/users' },
    { label: 'Roles', href: '/roles' },
    { label: 'Database', href: '/database' },
    { label: 'Settings', href: '/settings' },
    { label: 'Logs', href: '/logs' },
  ],
}

export const Navigation: React.FC<NavigationProps> = ({ role }) => {
  const items = navItems[role.toLowerCase()] || navItems.student

  return (
    <nav className={styles.nav}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={styles.navItem}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
