// Main Layout - Wrapper for authenticated pages outside `/dashboard/*`.
// Provides the same Header + collapsible Sidebar + content area as the
// dashboard layout via the shared AppShell, ensuring navigation is
// consistent on every authenticated page.
'use client'

import { AppShell } from './AppShell'

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AppShell>{children}</AppShell>
}
