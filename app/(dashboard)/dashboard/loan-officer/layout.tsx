import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_ACCESS_TOKEN, COOKIE_SELECTED_ROLE, decodeJWT, isRole } from '@/lib/auth'
import DashboardFrame from '@/components/DashboardFrame'
import LoanOfficerSidebar from '@/components/LoanOfficerSidebar'

export default async function LoanOfficerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  const selectedRole = cookieStore.get(COOKIE_SELECTED_ROLE)?.value
  const payload = accessToken ? decodeJWT(accessToken) : null
  const activeRole = payload?.role ?? (isRole(selectedRole) ? selectedRole : undefined)

  if (activeRole !== 'LOAN_OFFICER') redirect('/login')

  return (
    <DashboardFrame
      sidebar={<LoanOfficerSidebar />}
      name={payload?.name}
      email={payload?.email}
      roleLabel="Loan Officer"
    >
      {children}
    </DashboardFrame>
  )
}
