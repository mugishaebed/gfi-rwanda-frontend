import ClientManagement from '@/components/ClientManagement'

export default function GMClientsPage() {
  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Clients
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Client Directory</h1>
        <p className="mt-2 text-base text-gray-400">
          View individual and business client profiles, contact details, and uploaded documents.
        </p>
      </div>
      <ClientManagement
        kicker="Client Directory"
        title="All Clients"
        canCreate={false}
        canEdit={false}
        emptyMessage="No clients are available yet."
      />
    </div>
  )
}
