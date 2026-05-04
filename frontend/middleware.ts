import { NextRequest, NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/password-reset',
  '/auth/pending-approval',
  '/password-reset',
]

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
  '/flagged-marks',
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
  '/semester-timeline',
  '/messages',
  '/course-management',
]

/** Decode JWT exp claim in Edge runtime (no crypto needed — just base64). */
function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (typeof payload.exp !== 'number') return false
    return Date.now() / 1000 > payload.exp - 30 // 30s buffer
  } catch {
    return true // treat malformed tokens as expired
  }
}

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.split(' ')[1]

  const { pathname } = request.nextUrl

  // Check if route is public (exact match)
  const isPublic = publicRoutes.some((route) => pathname === route)
  if (isPublic) return NextResponse.next()

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected) {
    // No token → redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Expired token → clear cookie and redirect to login
    if (isTokenExpired(token)) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('expired', '1')
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set('token', '', { maxAge: 0, path: '/' })
      return response
    }
  }

  // If accessing login while authenticated with a valid token, redirect to dashboard
  if (pathname.startsWith('/auth/login') && token && !isTokenExpired(token)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

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
