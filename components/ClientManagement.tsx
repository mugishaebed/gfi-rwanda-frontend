'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import CreateClientForm from './CreateClientForm'
import ClientDetailModal from './ClientDetailModal'

interface Client {
  id: string
  type: 'INDIVIDUAL' | 'BUSINESS'
  email: string
  phoneNumber: string
  address: string
  accountNumber: string
  createdAt: string
  individual?: {
    fullName: string
    nationalId: string
    gender: string
    dateOfBirth: string
    nationality?: string
    maritalStatus?: string
    occupation?: string
    employerName?: string
    monthlyIncome?: string
    bankName?: string
    bankAccountNumber?: string
    pep: boolean
    referenceName?: string
  }
  business?: {
    businessName: string
    registrationNumber: string
    businessType: 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'
    incorporationDate: string
    pep: boolean
    businessShareholders: Array<{ name: string; ownershipPercentage: number }>
    businessWebsite?: string
    bankName?: string
    bankAccountNumber?: string
    authorizedSignatory?: string
    annualRevenue?: string
  }
  documents: Array<{ id: string; filename: string; label?: string }>
}

interface ClientsResponse {
  data: Client[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ClientManagementProps {
  kicker?: string
  title?: string
  canCreate?: boolean
  canEdit?: boolean
  emptyMessage?: string
}

export default function ClientManagement({
  kicker = 'Client Management',
  title = 'All Clients',
  canCreate = true,
  canEdit = true,
  emptyMessage = 'No clients yet. Add your first client above.',
}: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch<ClientsResponse>(`/clients?page=${page}&limit=10`)
      setClients(response.data)
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchClients()
  }, [fetchClients]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredClients = clients.filter((client) => {
    const query = search.trim().toLowerCase()
    if (!query) return true

    const clientName = (client.individual?.fullName || client.business?.businessName || '').toLowerCase()
    return (
      client.accountNumber.toLowerCase().includes(query) ||
      clientName.includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
            {kicker}
          </p>
          {canCreate && (
            <div className="flex gap-2">
              <Link
                href="/dashboard/loan-officer/clients/new?type=INDIVIDUAL"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
              >
                + Individual
              </Link>
              <Link
                href="/dashboard/loan-officer/clients/new?type=BUSINESS"
                className="rounded-lg bg-[#36e07b] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68]"
              >
                + Business
              </Link>
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="mt-4">
          <label htmlFor="client-search" className="sr-only">
            Search clients by account number or name
          </label>
          <input
            id="client-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Account No. or Name"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#36e07b]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Loading clients…
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          No clients match that account number or name.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Account No.</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Phone</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{client.accountNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.individual?.fullName || client.business?.businessName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                    <button
                      onClick={() => setViewingClient(client)}
                      className="font-medium text-[#36e07b] hover:text-[#1bcb68] transition-colors"
                    >
                      View
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setEditingClient(client)}
                        className="font-medium text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Page {page} of {totalPages}
          {search.trim() && (
            <span className="ml-2">
              • {filteredClients.length} match{filteredClients.length === 1 ? '' : 'es'} on this page
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {viewingClient && (
        <ClientDetailModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
        />
      )}

      {editingClient && (
        <CreateClientForm
          type={editingClient.type}
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={() => {
            setEditingClient(null)
            fetchClients()
          }}
        />
      )}
    </div>
  )
}
