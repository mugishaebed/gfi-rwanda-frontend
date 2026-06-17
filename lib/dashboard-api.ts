import { apiFetch } from './api'

// ---- API contract types (mirror the backend integration guide) ----

export type LoanStatus =
  | 'PENDING_OFFICER_REVIEW'
  | 'PENDING_GM_APPROVAL'
  | 'REJECTED'
  | 'APPROVED'
  | 'DISBURSING'
  | 'DISBURSEMENT_FAILED'
  | 'ACTIVE'

export type LoanSector =
  | 'COFFEE'
  | 'GENERAL_TRADE'
  | 'CONSTRUCTION'
  | 'REAL_ESTATE'
  | 'TENDERS'
  | 'HOSPITALITY'

export type ActivityType =
  | 'application'
  | 'officer_approval'
  | 'gm_approval'
  | 'rejection'
  | 'disbursing'
  | 'disbursement'
  | 'disbursement_failed'
  | 'status_change'

export type DashboardPeriod = 'month' | 'quarter' | 'ytd'

export interface Kpi {
  value: number
  deltaPct: number
}

export interface ActivityItem {
  id: string
  type: ActivityType
  loanId: string
  loanNumber: string
  client: string
  amount: number
  at: string
}

export interface GmSummary {
  kpis: {
    disbursed: Kpi
    disbursedTotal: Kpi
    outstanding: Kpi
    interestEarned: Kpi
    recoveryRate: Kpi
  }
  trend: { month: string; disbursed: number; repaid: number }[]
  sectors: { sector: LoanSector; loans: number; disbursed: number }[]
  statuses: { status: LoanStatus; count: number }[]
  pipeline: { officerReview: number; gmApproval: number; disbursing: number; active: number }
  interest: { received: number; expected: number }
  queues: { awaitingGm: number; pendingRepayments: number; onlineReview: number; manualReview: number }
  activity: ActivityItem[]
}

export interface OfficerSummary {
  kpis: {
    toReview: Kpi
    awaitingGm: Kpi
    collections: Kpi
    activeLoans: Kpi
  }
  reviewQueue: {
    loanId: string
    loanNumber: string
    client: string
    sector: LoanSector | null
    amount: number
    source: 'CLIENT_ONLINE' | 'STAFF_MANUAL'
    submittedAt: string
  }[]
  repaymentsDue: {
    loanId: string
    loanNumber: string
    client: string
    amount: number
    dueDate: string
  }[]
  collections: { recorded: number; target: number }
  throughput: { week: string; submitted: number; approved: number }[]
  pipeline: { status: LoanStatus; count: number }[]
  activity: ActivityItem[]
}

// ---- Fetchers (server: pass accessToken; client: routes through /api/proxy) ----

export function getGmSummary(period: DashboardPeriod = 'month', accessToken?: string) {
  return apiFetch<GmSummary>(
    `/dashboard/gm-summary?period=${period}`,
    accessToken ? { accessToken } : {}
  )
}

export function getOfficerSummary(accessToken?: string) {
  return apiFetch<OfficerSummary>(
    '/dashboard/officer-summary',
    accessToken ? { accessToken } : {}
  )
}

// ---- Presentation maps (frontend owns labels/colors, per "send data, not presentation") ----

export const SECTOR_LABELS: Record<LoanSector, string> = {
  COFFEE: 'Coffee',
  GENERAL_TRADE: 'General Trade',
  CONSTRUCTION: 'Construction',
  REAL_ESTATE: 'Real Estate',
  TENDERS: 'Tenders',
  HOSPITALITY: 'Hospitality',
}

export const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING_OFFICER_REVIEW: 'Officer Review',
  PENDING_GM_APPROVAL: 'Awaiting GM',
  REJECTED: 'Rejected',
  APPROVED: 'Approved',
  DISBURSING: 'Disbursing',
  DISBURSEMENT_FAILED: 'Disb. Failed',
  ACTIVE: 'Active',
}

export const STATUS_COLORS: Record<LoanStatus, string> = {
  ACTIVE: '#36e07b',
  PENDING_GM_APPROVAL: '#38bdf8',
  PENDING_OFFICER_REVIEW: '#fbbf24',
  DISBURSING: '#a78bfa',
  APPROVED: '#34d399',
  DISBURSEMENT_FAILED: '#fb7185',
  REJECTED: '#f87171',
}

export const ACTIVITY_DOT: Record<ActivityType, string> = {
  application: 'bg-amber-400',
  officer_approval: 'bg-emerald-400',
  gm_approval: 'bg-[#36e07b]',
  rejection: 'bg-red-400',
  disbursing: 'bg-violet-300',
  disbursement: 'bg-violet-400',
  disbursement_failed: 'bg-red-500',
  status_change: 'bg-gray-400',
}

export function activityText(item: ActivityItem): string {
  const verb: Record<ActivityType, string> = {
    application: 'New application',
    officer_approval: 'Officer approved',
    gm_approval: 'GM approved',
    rejection: 'Rejected',
    disbursing: 'Disbursing',
    disbursement: 'Disbursed',
    disbursement_failed: 'Disbursement failed',
    status_change: 'Updated',
  }
  return `${verb[item.type]} · ${item.client}`
}

const SECTOR_DASH = '—'

export function sectorLabel(sector: LoanSector | null): string {
  return sector ? SECTOR_LABELS[sector] : SECTOR_DASH
}

// ---- Formatters & time helpers (presentation, computed client-side) ----

export function fmtCompactMoney(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B RWF`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M RWF`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K RWF`
  return `${n} RWF`
}

export function fmtKpiValue(value: number, format: 'currency' | 'number' | 'percent'): string {
  if (format === 'currency') return fmtCompactMoney(value)
  if (format === 'percent') return `${value}%`
  return value.toLocaleString('en-RW')
}

export function fmtSignedPct(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

const DAY_MS = 86_400_000

/** Whole days since an ISO timestamp (never negative). */
export function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS))
}

/** Days a YYYY-MM-DD due date is past today; >0 overdue, 0 today, <0 upcoming. */
export function overdueDays(ymd: string): number {
  const today = new Date()
  const todayMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const due = new Date(`${ymd}T00:00:00Z`).getTime()
  return Math.round((todayMidnight - due) / DAY_MS)
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}w ago`
  return new Date(iso).toLocaleDateString('en-RW', { day: '2-digit', month: 'short' })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-01" -> "Jan" */
export function monthShort(ym: string): string {
  const month = Number(ym.split('-')[1])
  return MONTHS[month - 1] ?? ym
}

/** "2026-W18" -> "W18" */
export function weekShort(w: string): string {
  return w.split('-')[1] ?? w
}
