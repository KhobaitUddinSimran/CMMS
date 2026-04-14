import { NextRequest, NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/password-reset']

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/marks',
  '/password-change',
  '/courses',
  '/certificate',
  '/queries',
  '/smart-grid',
  '/assessment-setup',
  '/roster',
  '/assessment-config',
  '/reports',
  '/departments',
  '/analytics',
  '/export',
  '/audit-log',
  '/users',
  '/roles',
  '/database',
  '/system-logs',
]

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.split(' ')[1]

  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublic = publicRoutes.some(route => pathname === route)

  // If it's public, allow it
  if (isPublic) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  // If it's protected but no token, redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login?role=student', request.url))
  }

  // If accessing login while authenticated, redirect to dashboard
  if (pathname.startsWith('/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For all other routes (undefined routes), let Next.js handle them
  // This will show the not-found page instead of redirecting
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
