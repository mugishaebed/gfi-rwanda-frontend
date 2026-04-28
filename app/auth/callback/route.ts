import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_SELECTED_ROLE,
  ROLE_HOME,
  isRole,
} from '@/lib/auth'

const ONE_DAY = 60 * 60 * 24
const THIRTY_DAYS = ONE_DAY * 30

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const authStatus = searchParams.get('authStatus')
  const appAccessToken = searchParams.get('appAccessToken')
  const refreshToken = searchParams.get('refreshToken')
  const rolesParam = searchParams.get('roles')

  if (authStatus !== 'success' || !appAccessToken || !refreshToken) {
    redirect('/login?error=auth_failed')
  }

  const userRoles = rolesParam ? rolesParam.split(',').filter(isRole) : []

  const isProduction = process.env.NODE_ENV === 'production'
  const cookieStore = await cookies()
  const selectedRole = cookieStore.get(COOKIE_SELECTED_ROLE)?.value

  // Prefer the role the user explicitly selected on the login page
  const redirectRole =
    isRole(selectedRole) && userRoles.includes(selectedRole)
      ? selectedRole
      : userRoles[0] ?? null

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
