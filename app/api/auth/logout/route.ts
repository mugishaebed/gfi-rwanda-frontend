import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_SELECTED_ROLE,
  decodeJWT,
} from '@/lib/auth'
import { apiFetch } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value

  if (accessToken) {
    const payload = decodeJWT(accessToken)
    if (payload?.sub) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userId: payload.sub }),
        accessToken,
      }).catch(() => {})
    }
  }

  cookieStore.delete(COOKIE_ACCESS_TOKEN)
  cookieStore.delete(COOKIE_REFRESH_TOKEN)
  cookieStore.delete(COOKIE_SELECTED_ROLE)

  redirect(`${API_URL}/auth/microsoft/logout`)
}
