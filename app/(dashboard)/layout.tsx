import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_ACCESS_TOKEN, COOKIE_SELECTED_ROLE, decodeJWT, isRole } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  const selectedRole = cookieStore.get(COOKIE_SELECTED_ROLE)?.value

  if (!accessToken) redirect('/login')

  const payload = decodeJWT(accessToken)
  if (!payload) redirect('/login')
  if (!isRole(payload.role) && !isRole(selectedRole)) redirect('/login')

  return <div className="min-h-screen bg-white">{children}</div>
}
