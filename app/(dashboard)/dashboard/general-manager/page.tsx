import { cookies } from 'next/headers'
import Link from 'next/link'
import { COOKIE_ACCESS_TOKEN, decodeJWT } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import type { LoansResponse, RepaymentsResponse } from '@/lib/types'

interface CountResponse {
  meta: { total: number }
}

function fmtMoney(v: number | string) {
  const n = Number(v)
  return isFinite(n)
    ? n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })
    : String(v)
}

async function fetchStats(token: string) {
  const [allLoans, allClients, pendingLoans, pendingRepayments] = await Promise.allSettled([
    apiFetch<LoansResponse>('/loans?limit=1000&status=APPROVED', { accessToken: token }),
    apiFetch<CountResponse>('/clients?limit=1', { accessToken: token }),
    apiFetch<LoansResponse>('/loans?limit=1&status=PENDING', { accessToken: token }),
    apiFetch<RepaymentsResponse>('/repayments?limit=1&status=PENDING', { accessToken: token }),
  ])

  const totalOutstanding = allLoans.status === 'fulfilled'
    ? allLoans.value.data.reduce((sum, loan) => sum + (loan.outstandingBalance ?? loan.amount), 0)
    : 0

  return {
    totalLoans:
      allLoans.status === 'fulfilled' ? String(allLoans.value.meta.total) : '—',
    totalClients:
      allClients.status === 'fulfilled' ? String(allClients.value.meta.total) : '—',
    pendingLoans:
      pendingLoans.status === 'fulfilled' ? String(pendingLoans.value.meta.total) : '—',
    pendingRepayments:
      pendingRepayments.status === 'fulfilled'
        ? String(pendingRepayments.value.meta.total)
        : '—',
    totalOutstanding: fmtMoney(totalOutstanding),
  }
}

export default async function GeneralManagerPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value ?? ''
  const payload = decodeJWT(accessToken)

  const stats = await fetchStats(accessToken)

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="dashboard-panel px-6 py-6 lg:px-8">
        <p className="dashboard-kicker mb-2">Overview</p>
        <h2 className="dashboard-title">
          Management Snapshot for {payload?.name?.split(' ')[0] ?? 'you'}
        </h2>
        <p className="dashboard-subtitle mt-3 max-w-3xl">
          Keep a close eye on pending decisions, portfolio volume, and the repayment queue from
          one polished control center.
        </p>
      </div>

      <div className="dashboard-grid">
        <StatCard label="Total Loans" value={stats.totalLoans} />
        <StatCard label="Total Clients" value={stats.totalClients} />
        <StatCard label="Pending Loans" value={stats.pendingLoans} />
        <StatCard label="Outstanding Balance" value={stats.totalOutstanding} />
      </div>

      <div className="dashboard-panel p-8">
        <p className="dashboard-kicker mb-2">Management</p>
        <h2 className="text-2xl font-semibold text-[#1f1724]">Review the critical queues</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b7f72]">
          Approvals and follow-ups are grouped here so you can move through the highest-impact
          decisions without digging around the interface.
        </p>
        <div className="divide-y divide-gray-100">
          <ActionRow label="View Client Directory" href="/dashboard/general-manager/clients" />
          <ActionRow label="View All Loans" href="/dashboard/general-manager/loans" />
          <ActionRow label="Review Pending Repayments" href="/dashboard/general-manager/repayments" />
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
