import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_SELECTED_ROLE,
  ROLE_HOME,
  isRole,
  type AuthResponse,
} from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
const ONE_DAY = 60 * 60 * 24
const THIRTY_DAYS = ONE_DAY * 30

// Microsoft redirects here after OAuth: /auth/microsoft/callback?code=...&state=...
// We forward the query string to the backend, which exchanges the code and returns tokens.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    redirect(`/login?error=${error ?? 'auth_failed'}`)
  }

  // Forward code + state to backend callback endpoint
  const params = new URLSearchParams()
  if (code) params.set('code', code)
  if (state) params.set('state', state)

  const backendRes = await fetch(
    `${API_URL}/auth/microsoft/callback?${params.toString()}`,
    { cache: 'no-store' }
  ).catch(() => null)

  if (!backendRes?.ok) {
    redirect('/login?error=auth_failed')
  }

  const data: AuthResponse = await backendRes.json()
  const { appAccessToken, refreshToken, user } = data

  const isProduction = process.env.NODE_ENV === 'production'
  const cookieStore = await cookies()
  const selectedRole = cookieStore.get(COOKIE_SELECTED_ROLE)?.value
  const redirectRole = isRole(user.role) ? user.role : isRole(selectedRole) ? selectedRole : null

  cookieStore.set(COOKIE_ACCESS_TOKEN, appAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: ONE_DAY,
    path: '/',
  })

  cookieStore.set(COOKIE_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    path: '/',
  })

  if (redirectRole) {
    cookieStore.set(COOKIE_SELECTED_ROLE, redirectRole, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: THIRTY_DAYS,
      path: '/',
    })
  } else {
    cookieStore.delete(COOKIE_SELECTED_ROLE)
  }

  redirect(redirectRole ? ROLE_HOME[redirectRole] : '/login')
}
