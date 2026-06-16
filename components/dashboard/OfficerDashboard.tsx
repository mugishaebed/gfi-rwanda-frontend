'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ageDays,
  fmtCompactMoney,
  overdueDays,
  sectorLabel,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/lib/dashboard-api'
import type { OfficerSummary } from '@/lib/dashboard-api'
import { StatusDonutChart, ThroughputBarChart } from './DashboardCharts'
import { ActivityRow, ChartCard, KpiCard } from './primitives'

const LOANS_BASE = '/dashboard/loan-officer/loans'

type ReviewSource = OfficerSummary['reviewQueue'][number]['source']

const SOURCE_STYLES: Record<ReviewSource, string> = {
  CLIENT_ONLINE: 'bg-indigo-50 text-indigo-700',
  STAFF_MANUAL: 'bg-gray-100 text-gray-700',
}
const SOURCE_LABELS: Record<ReviewSource, string> = {
  CLIENT_ONLINE: 'Online',
  STAFF_MANUAL: 'Manual',
}

type ReviewTab = 'all' | ReviewSource
const REVIEW_TABS: { key: ReviewTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'CLIENT_ONLINE', label: 'Online' },
  { key: 'STAFF_MANUAL', label: 'Manual' },
]

type ReviewItem = OfficerSummary['reviewQueue'][number]
type RepaymentDueItem = OfficerSummary['repaymentsDue'][number]

export default function OfficerDashboard({
  firstName,
  summary,
}: {
  firstName: string
  summary: OfficerSummary
}) {
  const [reviewTab, setReviewTab] = useState<ReviewTab>('all')

  const queue =
    reviewTab === 'all'
      ? summary.reviewQueue
      : summary.reviewQueue.filter((item) => item.source === reviewTab)

  const collectionPct =
    summary.collections.target > 0
      ? Math.min(100, Math.round((summary.collections.recorded / summary.collections.target) * 100))
      : 0

  const pipeline = summary.pipeline.map((row) => ({
    name: STATUS_LABELS[row.status],
    value: row.count,
    color: STATUS_COLORS[row.status],
  }))

  const throughput = summary.throughput.map((row) => ({
    ...row,
    week: row.week.split('-')[1] ?? row.week,
  }))

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="dashboard-panel flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="dashboard-kicker mb-2">Overview</p>
          <h2 className="dashboard-title">Your Workspace, {firstName}</h2>
          <p className="dashboard-subtitle mt-3 max-w-2xl">
            What needs you today — reviews, collections, and your client pipeline at a glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${LOANS_BASE}/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#36e07b] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68]"
          >
            + New Application
          </Link>
          <Link
            href="/dashboard/loan-officer/clients/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#36e07b] hover:text-gray-900"
          >
            + Add Client
          </Link>
          <Link
            href="/dashboard/loan-officer/repayments"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#36e07b] hover:text-gray-900"
          >
            Record Repayment
          </Link>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="To Review" value={summary.kpis.toReview.value} format="number" hint="Awaiting officer review" />
        <KpiCard label="Awaiting GM" value={summary.kpis.awaitingGm.value} format="number" hint="Sent up for approval" />
        <KpiCard
          label="Collections (mo.)"
          value={summary.kpis.collections.value}
          format="currency"
          hint="Repayments you recorded"
          delta={{ pct: summary.kpis.collections.deltaPct, positiveIsGood: true }}
        />
        <KpiCard label="My Active Loans" value={summary.kpis.activeLoans.value} format="number" hint="In the field" />
      </div>

      {/* Worklists */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Needs your review */}
        <div className="dashboard-panel p-6 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#1f1724]">Needs Your Review</h3>
              <p className="text-xs text-gray-400">Oldest first — clear the aging requests</p>
            </div>
            <div className="flex gap-1 rounded-xl bg-gray-50 p-1">
              {REVIEW_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReviewTab(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    reviewTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {queue.length === 0 ? (
            <EmptyState message="Nothing waiting in this queue. Nice and clear." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {[...queue]
                .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
                .map((item) => (
                  <ReviewRow key={item.loanId} item={item} />
                ))}
            </ul>
          )}
        </div>

        {/* Repayments due */}
        <div className="dashboard-panel p-6">
          <h3 className="text-base font-semibold text-[#1f1724]">Repayments Due</h3>
          <p className="text-xs text-gray-400">Overdue first</p>

          {summary.repaymentsDue.length === 0 ? (
            <EmptyState message="No repayments due right now." />
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {[...summary.repaymentsDue]
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((item) => (
                  <RepaymentRow key={item.loanId} item={item} />
                ))}
            </ul>
          )}

          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#7ca089]">
                Collections this month
              </span>
              <span className="text-xs text-gray-400">{collectionPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-[#36e07b]" style={{ width: `${collectionPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="font-medium text-gray-900">
                {fmtCompactMoney(summary.collections.recorded)}
              </span>
              <span className="text-gray-400">of {fmtCompactMoney(summary.collections.target)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics (secondary) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="My Throughput"
          subtitle="Applications submitted vs approved · last 8 weeks"
        >
          <ThroughputBarChart data={throughput} />
        </ChartCard>
        <ChartCard title="My Pipeline" subtitle="Loans by stage">
          <StatusDonutChart data={pipeline} />
        </ChartCard>
      </div>

      {/* Recent activity */}
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
  )
}

function ageStyle(days: number) {
  if (days >= 4) return 'bg-red-50 text-red-600'
  if (days >= 2) return 'bg-amber-50 text-amber-700'
  return 'bg-gray-100 text-gray-500'
}

function ReviewRow({ item }: { item: ReviewItem }) {
  const days = ageDays(item.submittedAt)
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{item.client}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SOURCE_STYLES[item.source]}`}
          >
            {SOURCE_LABELS[item.source]}
          </span>
        </div>
        <p className="truncate font-mono text-xs text-gray-400">
          {item.loanNumber} · {sectorLabel(item.sector)}
        </p>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono text-sm text-gray-700">{fmtCompactMoney(item.amount)}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ageStyle(days)}`}
        suppressHydrationWarning
      >
        {days === 0 ? 'today' : `${days}d waiting`}
      </span>
      <Link
        href={`${LOANS_BASE}/${item.loanId}`}
        className="shrink-0 text-sm font-medium text-[#238a4d] transition-colors hover:text-[#1bcb68]"
      >
        Review →
      </Link>
    </li>
  )
}

function dueBadge(days: number): { className: string; label: string } {
  if (days > 0) return { className: 'bg-red-50 text-red-600', label: `${days}d overdue` }
  if (days === 0) return { className: 'bg-amber-50 text-amber-700', label: 'Due today' }
  return { className: 'bg-gray-100 text-gray-500', label: `in ${-days}d` }
}

function RepaymentRow({ item }: { item: RepaymentDueItem }) {
  const badge = dueBadge(overdueDays(item.dueDate))
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{item.client}</p>
        <p className="truncate font-mono text-xs text-gray-400">{item.loanNumber}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
        suppressHydrationWarning
      >
        {badge.label}
      </span>
      <Link
        href={`${LOANS_BASE}/${item.loanId}`}
        className="shrink-0 font-mono text-sm text-[#238a4d] transition-colors hover:text-[#1bcb68]"
      >
        {fmtCompactMoney(item.amount)}
      </Link>
    </li>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#e8faf0]">
        <svg className="h-5 w-5 text-[#36e07b]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
