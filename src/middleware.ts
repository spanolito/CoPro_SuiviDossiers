import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Allowlist stricte pour les accès anonymes
  const isPublic = 
    path === '/login' ||
    path === '/register' ||
    path === '/api/auth/login' ||
    path === '/api/auth/register' ||
    path === '/api/auth/logout' ||
    path.startsWith('/_next') ||
    path === '/favicon.ico'

  if (isPublic) {
    return addSecurityHeaders(NextResponse.next())
  }

  const token = request.cookies.get('auth_token')?.value

  // 2. Protection par défaut
  if (!token) {
    if (path.startsWith('/api/')) {
      return addSecurityHeaders(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
    }
    return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  // Verify token
  const payload = await verifyToken(token)

  if (!payload) {
    if (path.startsWith('/api/')) {
      return addSecurityHeaders(NextResponse.json({ error: 'Session invalide' }, { status: 401 }))
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    return addSecurityHeaders(response)
  }

  // Add user info to headers for API routes
  if (path.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id as string)
    requestHeaders.set('x-user-role', payload.role as string)
    
    return addSecurityHeaders(NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }))
  }

  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
