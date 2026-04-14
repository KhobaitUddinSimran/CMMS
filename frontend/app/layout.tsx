// Root Layout - Global layout wrapper for all pages
import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { ToastContainer } from '@/components/common/Toast'

export const metadata: Metadata = {
  title: 'CMMS - Carry Mark Management System',
  description: 'University carry mark tracking platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
