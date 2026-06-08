import Link from 'next/link'
import ClientManagement from '@/components/ClientManagement'

export default function OnlineClientsPage() {
  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Clients
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Online Client Approvals</h1>
        <p className="mt-2 text-base text-gray-400">
          Review completed client profiles submitted from the loan portal and activate approved
          accounts.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/loan-officer/clients"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm"
          >
            Manual clients
          </Link>
          <Link
            href="/dashboard/loan-officer/clients/online"
            className="rounded-full border border-[#36e07b] bg-[#effdf4] px-4 py-2 text-sm font-medium text-[#1f472e] shadow-sm"
          >
            Online clients
          </Link>
        </div>
      </div>
      <ClientManagement
        kicker="Pending Approval"
        title="Online Client Profiles"
        canCreate={false}
        canEdit={false}
        canApprove
        source="online"
        emptyMessage="No online client profiles are waiting for approval."
      />
    </div>
  )
}
