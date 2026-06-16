import { cookies } from 'next/headers'
import { COOKIE_ACCESS_TOKEN, decodeJWT } from '@/lib/auth'
import { getOfficerSummary } from '@/lib/dashboard-api'
import OfficerDashboard from '@/components/dashboard/OfficerDashboard'
import DashboardError from '@/components/dashboard/DashboardError'

export default async function LoanOfficerOverviewPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value ?? ''
  const payload = decodeJWT(accessToken)
  const firstName = payload?.name?.split(' ')[0] ?? 'you'

  try {
    const summary = await getOfficerSummary(accessToken)
    return <OfficerDashboard firstName={firstName} summary={summary} />
  } catch {
    return <DashboardError />
  }
}
