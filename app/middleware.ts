import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginRoute = request.nextUrl.pathname === '/login'
  const isAdminAPI = request.nextUrl.pathname.startsWith('/api/admin')
  const isLoginAPI = request.nextUrl.pathname === '/api/admin/login'

  const sessionToken = request.cookies.get('admin_session')?.value

  if ((isAdminRoute || (isAdminAPI && !isLoginAPI)) && !sessionToken) {
    if (isAdminAPI) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginRoute && sessionToken) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/admin/:path*'],
}
