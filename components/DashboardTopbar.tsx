'use client'

import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Home',
  'loan-officer': 'Loan Officer',
  'general-manager': 'General Manager',
  clients: 'Clients',
  loans: 'Loans',
  repayments: 'Repayments',
}

function formatSegment(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getDisplayName(name?: string, email?: string) {
  if (name?.trim()) return name.trim()
  if (!email) return 'there'

  const localPart = email.split('@')[0] ?? ''
  if (!localPart) return 'there'

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function DashboardTopbar({
  name,
  email,
  roleLabel,
}: {
  name?: string
  email?: string
  roleLabel: string
}) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean).slice(0, 3)
  const crumbs = segments.map(formatSegment)
  const greeting = getGreeting()
  const displayName = getDisplayName(name, email)

  return (
    <header className="border-b border-[#dceee2] bg-white/94 backdrop-blur">
      <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1f1724]">
            {greeting}, {displayName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#6f8776]">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="flex items-center gap-2">
                {index > 0 && <span className="text-[#b4cfbe]">/</span>}
                <span className={index === crumbs.length - 1 ? 'font-medium text-[#36e07b]' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 self-start lg:self-center">
          <div className="min-w-0 text-right">
            <p className="truncate text-base font-semibold text-[#355340]">{roleLabel}</p>
            <p className="truncate text-sm text-[#93b09d]">{email ?? 'No email available'}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
