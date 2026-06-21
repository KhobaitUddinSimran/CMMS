// Root Layout - Global layout wrapper for all pages
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Marcellus } from 'next/font/google'
import { Providers } from './providers'
import { ToastContainer } from '@/components/common/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const brand = Marcellus({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'UTM MarkDesk',
  description: 'UTM MarkDesk – Carry Mark & Workload Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${brand.variable}`}>
      <body className={inter.className}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
