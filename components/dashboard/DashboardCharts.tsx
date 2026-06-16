'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtCompactMoney } from '@/lib/dashboard-api'

export interface TrendPoint {
  month: string
  disbursed: number
  repaid: number
}
export interface SectorDatum {
  sector: string
  loans: number
  disbursed: number
}
export interface StatusDatum {
  name: string
  value: number
  color: string
}
export interface PipelineStage {
  stage: string
  count: number
}
export interface WeeklyThroughput {
  week: string
  submitted: number
  approved: number
}

const AXIS_TICK = { fill: '#9aa6a0', fontSize: 12 }
const GREEN = '#36e07b'
const GREEN_DARK = '#1bcb68'
const SKY = '#38bdf8'

function moneyTick(value: number) {
  if (Math.abs(value) >= 1e6) return `${value / 1e6}M`
  if (Math.abs(value) >= 1e3) return `${value / 1e3}K`
  return `${value}`
}

function TooltipShell({
  label,
  rows,
}: {
  label?: string
  rows: { name: string; value: string; color: string }[]
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg">
      {label && <p className="mb-1 text-xs font-semibold text-gray-900">{label}</p>}
      {rows.map((row) => (
        <p key={row.name} className="flex items-center gap-2 text-xs text-gray-600">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
          {row.name}: <span className="font-medium text-gray-900">{row.value}</span>
        </p>
      ))}
    </div>
  )
}

export function TrendAreaChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gDisbursed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gRepaid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY} stopOpacity={0.3} />
            <stop offset="100%" stopColor={SKY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={moneyTick} tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          cursor={{ stroke: '#e5e7eb' }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipShell
                label={String(label)}
                rows={[
                  { name: 'Disbursed', value: fmtCompactMoney(Number(payload[0]?.value ?? 0)), color: GREEN },
                  { name: 'Repaid', value: fmtCompactMoney(Number(payload[1]?.value ?? 0)), color: SKY },
                ]}
              />
            ) : null
          }
        />
        <Area type="monotone" dataKey="disbursed" stroke={GREEN_DARK} strokeWidth={2.5} fill="url(#gDisbursed)" />
        <Area type="monotone" dataKey="repaid" stroke={SKY} strokeWidth={2.5} fill="url(#gRepaid)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function SectorBarChart({ data }: { data: SectorDatum[] }) {
  const sorted = [...data].sort((a, b) => b.loans - a.loans)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="sector"
          tick={{ fill: '#5f7264', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={92}
        />
        <Tooltip
          cursor={{ fill: '#f3f6f4' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const datum = payload[0]?.payload as SectorDatum
            return (
              <TooltipShell
                label={datum.sector}
                rows={[
                  { name: 'Loans', value: String(datum.loans), color: GREEN },
                  { name: 'Disbursed', value: fmtCompactMoney(datum.disbursed), color: SKY },
                ]}
              />
            )
          }}
        />
        <Bar dataKey="loans" fill={GREEN} radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusDonutChart({ data }: { data: StatusDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TooltipShell
                  rows={[
                    {
                      name: String(payload[0]?.name),
                      value: String(payload[0]?.value),
                      color: (payload[0]?.payload as StatusDatum)?.color ?? GREEN,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-3xl font-semibold text-[#1f1724]">{total}</span>
        <span className="text-xs uppercase tracking-[0.15em] text-gray-400">Total loans</span>
      </div>
    </div>
  )
}

export function PipelineBarChart({ data }: { data: PipelineStage[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <XAxis dataKey="stage" tick={{ fill: '#5f7264', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: '#f3f6f4' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipShell
                label={String(payload[0]?.payload?.stage)}
                rows={[{ name: 'Loans', value: String(payload[0]?.value), color: GREEN_DARK }]}
              />
            ) : null
          }
        />
        <Bar dataKey="count" fill={GREEN} radius={[6, 6, 0, 0]} barSize={42}>
          {data.map((entry, index) => (
            <Cell key={entry.stage} fillOpacity={0.55 + (index / data.length) * 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ThroughputBarChart({ data }: { data: WeeklyThroughput[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
        <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: '#f3f6f4' }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipShell
                label={String(label)}
                rows={[
                  { name: 'Submitted', value: String(payload[0]?.value ?? 0), color: SKY },
                  { name: 'Approved', value: String(payload[1]?.value ?? 0), color: GREEN },
                ]}
              />
            ) : null
          }
        />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
        />
        <Bar name="Submitted" dataKey="submitted" fill={SKY} radius={[4, 4, 0, 0]} barSize={12} />
        <Bar name="Approved" dataKey="approved" fill={GREEN} radius={[4, 4, 0, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function InterestRadialChart({ received, expected }: { received: number; expected: number }) {
  const pct = expected > 0 ? Math.round((received / expected) * 100) : 0
  const chartData = [{ name: 'Interest', value: pct, fill: GREEN }]
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} background={{ fill: '#eef2f0' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-[#1f1724]">{pct}%</span>
        <span className="text-xs text-gray-400">of expected</span>
      </div>
    </div>
  )
}
