import { cookies } from 'next/headers'
import { COOKIE_ACCESS_TOKEN, decodeJWT } from '@/lib/auth'
import { getGmSummary } from '@/lib/dashboard-api'
import GMDashboard from '@/components/dashboard/GMDashboard'
import DashboardError from '@/components/dashboard/DashboardError'

export default async function GeneralManagerPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value ?? ''
  const payload = decodeJWT(accessToken)
  const firstName = payload?.name?.split(' ')[0] ?? 'you'

  try {
    const summary = await getGmSummary('month', accessToken)
    return <GMDashboard firstName={firstName} initialSummary={summary} initialPeriod="month" />
  } catch {
    return <DashboardError />
  }
}
