// Dashboard Shell Layout — delegates to the shared AppShell so /dashboard/*
// and the rest of the authenticated app share identical navigation, auth
// checking and the collapsible sidebar.
'use client'

import { AppShell } from '@/components/layout/AppShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
