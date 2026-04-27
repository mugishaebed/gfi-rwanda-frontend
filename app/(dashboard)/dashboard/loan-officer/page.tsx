import { cookies } from 'next/headers'
import { COOKIE_ACCESS_TOKEN, decodeJWT } from '@/lib/auth'
import Link from 'next/link'

export default async function LoanOfficerOverviewPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  const payload = accessToken ? decodeJWT(accessToken) : null

  return (
    <div className="space-y-6">
      <div className="dashboard-panel animate-fade-up px-6 py-6 lg:px-8">
        <p className="dashboard-kicker mb-2">Overview</p>
        <h2 className="dashboard-title">
          Portfolio Snapshot for {payload?.name?.split(' ')[0] ?? 'you'}
        </h2>
        <p className="dashboard-subtitle mt-3 max-w-3xl">
          Monitor lending activity, move quickly between operational tasks, and keep your
          client pipeline flowing from one calm, focused workspace.
        </p>
      </div>

      <div className="dashboard-grid animate-fade-up" style={{ animationDelay: '0.08s' }}>
        <StatCard label="Active Loans" value="—" />
        <StatCard label="Pending Applications" value="—" />
        <StatCard label="Approved This Month" value="—" />
      </div>

      <div className="dashboard-panel animate-fade-up p-8" style={{ animationDelay: '0.14s' }}>
        <p className="dashboard-kicker mb-2">Quick Actions</p>
        <h2 className="text-2xl font-semibold text-[#1f1724]">What would you like to manage?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b7f72]">
          Jump directly into the parts of the workflow you use most often throughout the day.
        </p>
        <div className="divide-y divide-gray-100">
          <ActionRow label="Manage Clients" href="/dashboard/loan-officer/clients" />
          <ActionRow label="View Loan Applications" href="/dashboard/loan-officer/loans" />
          <ActionRow label="Track Repayment Records" href="/dashboard/loan-officer/repayments" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-panel p-6 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7ca089]">{label}</p>
        <span className="mt-0.5 block h-2.5 w-2.5 rounded-full bg-[#36e07b]" />
      </div>
      <p className="text-4xl font-semibold tracking-tight text-[#1f1724]">{value}</p>
    </div>
  )
}

function ActionRow({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between py-4 text-sm font-medium text-[#5f7264] transition-colors hover:text-[#1f1724]"
    >
      {label}
      <span className="text-[#36e07b] transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  )
}
