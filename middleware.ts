import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwtToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPublicApi = request.nextUrl.pathname.startsWith('/api/auth/login')

  const verifiedToken = token && (await verifyJwtToken(token))

  if (isLoginPage) {
    if (verifiedToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!verifiedToken && !isPublicApi) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (public API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)',
  ],
}
