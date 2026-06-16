'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  fmtCompactMoney,
  getGmSummary,
  monthShort,
  sectorLabel,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/lib/dashboard-api'
import type { DashboardPeriod, GmSummary } from '@/lib/dashboard-api'
import {
  InterestRadialChart,
  PipelineBarChart,
  SectorBarChart,
  StatusDonutChart,
  TrendAreaChart,
} from './DashboardCharts'
import { ActivityRow, ChartCard, KpiCard } from './primitives'

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'Last 3 months' },
  { value: 'ytd', label: 'Year to date' },
]

export default function GMDashboard({
  firstName,
  initialSummary,
  initialPeriod = 'month',
}: {
  firstName: string
  initialSummary: GmSummary
  initialPeriod?: DashboardPeriod
}) {
  const [period, setPeriod] = useState<DashboardPeriod>(initialPeriod)
  const [summary, setSummary] = useState<GmSummary>(initialSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? ''

  const onPeriodChange = async (next: DashboardPeriod) => {
    setPeriod(next)
    setLoading(true)
    setError('')
    try {
      setSummary(await getGmSummary(next))
    } catch {
      setError('Could not load this period. Showing the last result.')
    } finally {
      setLoading(false)
    }
  }

  const trend = summary.trend.map((point) => ({ ...point, month: monthShort(point.month) }))
  const sectors = summary.sectors.map((row) => ({ ...row, sector: sectorLabel(row.sector) }))
  const statuses = summary.statuses.map((row) => ({
    name: STATUS_LABELS[row.status],
    value: row.count,
    color: STATUS_COLORS[row.status],
  }))
  const pipeline = [
    { stage: 'Officer Review', count: summary.pipeline.officerReview },
    { stage: 'GM Approval', count: summary.pipeline.gmApproval },
    { stage: 'Disbursing', count: summary.pipeline.disbursing },
    { stage: 'Active', count: summary.pipeline.active },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="dashboard-panel flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="dashboard-kicker mb-2">Overview</p>
          <h2 className="dashboard-title">Management Snapshot for {firstName}</h2>
          <p className="dashboard-subtitle mt-3 max-w-2xl">
            Portfolio health, approval queues, and recovery trends in one control center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[#36e07b] disabled:opacity-60"
          >
            {PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          {error}
        </p>
      )}

      {/* Hero KPIs */}
      <div className={`grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
        <KpiCard
          label="Total Disbursed"
          value={summary.kpis.disbursed.value}
          format="currency"
          hint={`Disbursed · ${periodLabel}`}
          delta={{ pct: summary.kpis.disbursed.deltaPct, positiveIsGood: true }}
        />
        <KpiCard
          label="Outstanding Balance"
          value={summary.kpis.outstanding.value}
          format="currency"
          hint="Principal still in the field"
        />
        <KpiCard
          label="Interest Earned"
          value={summary.kpis.interestEarned.value}
          format="currency"
          hint={`Recognised · ${periodLabel}`}
          delta={{ pct: summary.kpis.interestEarned.deltaPct, positiveIsGood: true }}
        />
        <KpiCard
          label="Recovery Rate"
          value={summary.kpis.recoveryRate.value}
          format="percent"
          hint="Principal recovered vs disbursed"
        />
      </div>

      {/* Charts row 1 */}
      <div className={`grid gap-5 transition-opacity lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
        <ChartCard
          className="lg:col-span-2"
          title="Disbursements vs Repayments"
          subtitle="Monthly cash flow · trailing 12 months"
        >
          <TrendAreaChart data={trend} />
        </ChartCard>
        <ChartCard title="Loans by Sector" subtitle="Number of loans originated">
          <SectorBarChart data={sectors} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className={`grid gap-5 transition-opacity lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
        <ChartCard title="Loan Status" subtitle="Distribution across the book">
          <StatusDonutChart data={statuses} />
        </ChartCard>
        <ChartCard title="Approval Pipeline" subtitle="Loans per stage">
          <PipelineBarChart data={pipeline} />
        </ChartCard>
        <ChartCard title="Interest Recognised" subtitle="Received vs expected (lifetime)">
          <InterestRadialChart received={summary.interest.received} expected={summary.interest.expected} />
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-400">Received</span>
            <span className="font-medium text-gray-900">{fmtCompactMoney(summary.interest.received)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Expected</span>
            <span className="font-medium text-gray-900">{fmtCompactMoney(summary.interest.expected)}</span>
          </div>
        </ChartCard>
      </div>

      {/* Queues + Activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="dashboard-panel p-6">
          <p className="dashboard-kicker mb-1">Action required</p>
          <h3 className="text-xl font-semibold text-[#1f1724]">My Queues</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QueueCard
              label="Awaiting GM Approval"
              count={summary.queues.awaitingGm}
              href="/dashboard/general-manager/loans?filter=awaiting-gm"
              accent="text-[#238a4d]"
            />
            <QueueCard
              label="Pending Repayments"
              count={summary.queues.pendingRepayments}
              href="/dashboard/general-manager/repayments"
              accent="text-sky-600"
            />
            <QueueCard
              label="Online Review"
              count={summary.queues.onlineReview}
              href="/dashboard/general-manager/loans?filter=online-all"
              accent="text-amber-600"
            />
            <QueueCard
              label="Manual Review"
              count={summary.queues.manualReview}
              href="/dashboard/general-manager/loans?filter=manual-all"
              accent="text-violet-600"
            />
          </div>
        </div>

        <div className="dashboard-panel p-6">
          <p className="dashboard-kicker mb-1">Latest</p>
          <h3 className="text-xl font-semibold text-[#1f1724]">Recent Activity</h3>
          {summary.activity.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No recent activity.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {summary.activity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function QueueCard({
  label,
  count,
  href,
  accent,
}: {
  label: string
  count: number
  href: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 transition-colors hover:border-[#36e07b] hover:bg-white"
    >
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`text-2xl font-semibold ${accent}`}>{count}</span>
    </Link>
  )
}
