import ClientManagement from '@/components/ClientManagement'

export default function ClientsPage() {
  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Clients
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
        <p className="mt-2 text-base text-gray-400">
          Create, update, and manage individual and business clients.
        </p>
      </div>
      <ClientManagement />
    </div>
  )
}
