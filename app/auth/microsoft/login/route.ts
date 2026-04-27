import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { COOKIE_SELECTED_ROLE, isRole } from '@/lib/auth'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
const TEN_MINUTES = 60 * 10

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role')
  const cookieStore = await cookies()

  if (isRole(role)) {
    cookieStore.set(COOKIE_SELECTED_ROLE, role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TEN_MINUTES,
      path: '/',
    })
  } else {
    cookieStore.delete(COOKIE_SELECTED_ROLE)
  }

  const target = new URL(`${AUTH_URL}/auth/microsoft/login`)
  if (isRole(role)) {
    target.searchParams.set('role', role)
  }

  redirect(target.toString())
}
