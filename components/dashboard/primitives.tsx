import {
  ACTIVITY_DOT,
  activityText,
  fmtCompactMoney,
  fmtKpiValue,
  fmtSignedPct,
  formatRelative,
} from '@/lib/dashboard-api'
import type { ActivityItem } from '@/lib/dashboard-api'

export function KpiCard({
  label,
  value,
  format,
  hint,
  delta,
}: {
  label: string
  value: number
  format: 'currency' | 'number' | 'percent'
  hint?: string
  /** Omit when the metric has no meaningful baseline (deltaPct is 0/ambiguous). */
  delta?: { pct: number; positiveIsGood: boolean }
}) {
  const showDelta = delta !== undefined
  const isGain = (delta?.pct ?? 0) >= 0
  const good = showDelta && isGain === delta!.positiveIsGood
  return (
    <div className="dashboard-panel p-6 transition-transform hover:-translate-y-0.5">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7ca089]">{label}</p>
        {showDelta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              good ? 'bg-[#e8faf0] text-[#238a4d]' : 'bg-red-50 text-red-600'
            }`}
          >
            {isGain ? '▲' : '▼'} {fmtSignedPct(delta!.pct)}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-[#1f1724]">{fmtKpiValue(value, format)}</p>
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export function ChartCard({
  title,
  subtitle,
  className = '',
  children,
}: {
  title: string
  subtitle: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`dashboard-panel p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#1f1724]">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${ACTIVITY_DOT[item.type]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{activityText(item)}</p>
        <p className="truncate font-mono text-xs text-gray-400">{item.loanNumber}</p>
      </div>
      <div className="shrink-0 text-right">
        {item.amount > 0 && (
          <p className="font-mono text-sm text-gray-700">{fmtCompactMoney(item.amount)}</p>
        )}
        <p className="text-xs text-gray-400" suppressHydrationWarning>
          {formatRelative(item.at)}
        </p>
      </div>
    </li>
  )
}
