'use client'

import { useState } from 'react'
import ClientManagement from '@/components/ClientManagement'

type ClientFilter = 'all' | 'manual' | 'online'

const FILTERS: Array<{ label: string; value: ClientFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Manual', value: 'manual' },
  { label: 'Online', value: 'online' },
]

export default function ClientsPage() {
  const [filter, setFilter] = useState<ClientFilter>('all')

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Clients
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Client source filters">
          {FILTERS.map((item) => {
            const active = item.value === filter

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={
                  active
                    ? 'rounded-full border border-[#36e07b] bg-[#effdf4] px-4 py-2 text-sm font-medium text-[#1f472e] shadow-sm'
                    : 'rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-[#36e07b] hover:text-gray-900'
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <ClientManagement
        key={filter}
        kicker="Clients"
        title="Client Management"
        canApprove
        source={filter}
        emptyMessage="No clients are available for this filter."
      />
    </div>
  )
}
