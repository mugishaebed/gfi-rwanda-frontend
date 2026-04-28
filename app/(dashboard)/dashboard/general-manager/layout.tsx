import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_ACCESS_TOKEN, COOKIE_SELECTED_ROLE, decodeJWT, isRole } from '@/lib/auth'
import DashboardFrame from '@/components/DashboardFrame'
import GeneralManagerSidebar from '@/components/GeneralManagerSidebar'

export default async function GeneralManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  const selectedRole = cookieStore.get(COOKIE_SELECTED_ROLE)?.value
  const payload = accessToken ? decodeJWT(accessToken) : null
  const userRoles = payload?.roles ?? []
  const hasAccess = userRoles.includes('GENERAL_MANAGER') || selectedRole === 'GENERAL_MANAGER'
  if (!hasAccess) redirect('/login')

  return (
    <DashboardFrame
      sidebar={<GeneralManagerSidebar />}
      name={payload?.name}
      email={payload?.email}
      roleLabel="General Manager"
    >
      {children}
    </DashboardFrame>
  )
}
