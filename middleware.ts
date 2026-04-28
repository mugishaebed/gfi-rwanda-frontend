import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN, isTokenExpired } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/login',
  '/auth/microsoft/login',
  '/auth/microsoft/callback',
  '/auth/callback',
  '/api/auth/logout',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const accessToken = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value
  const refreshToken = request.cookies.get(COOKIE_REFRESH_TOKEN)?.value

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isTokenExpired(accessToken) && refreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url)
    const refreshRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null)

    if (!refreshRes?.ok) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'session_expired')
      return NextResponse.redirect(loginUrl)
    }

    const { appAccessToken, refreshToken: newRefresh } = await refreshRes.json()
    const response = NextResponse.next()
    const ONE_DAY = 60 * 60 * 24
    const THIRTY_DAYS = ONE_DAY * 30
    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set(COOKIE_ACCESS_TOKEN, appAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: ONE_DAY,
      path: '/',
    })
    response.cookies.set(COOKIE_REFRESH_TOKEN, newRefresh, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: THIRTY_DAYS,
      path: '/',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
