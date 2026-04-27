'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { deleteClientAction } from '@/lib/client-actions'
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

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

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

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message })
    window.setTimeout(() => {
      setNotice((current) => (current?.message === message ? null : current))
    }, 4000)
  }

  const deleteClient = async (client: Client) => {
    setDeleteLoading(true)
    try {
      await deleteClientAction(client.type, client.id)
      setDeletingClient(null)
      showNotice('success', 'Client deleted successfully.')
      fetchClients()
    } catch (error) {
      console.error('Failed to delete client:', error)
      showNotice('error', 'Failed to delete client. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

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
      {notice && (
        <StatusDialog
          type={notice.type}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
            Client Management
          </p>
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
        </div>
        <h2 className="text-lg font-semibold text-gray-900">All Clients</h2>
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
          No clients yet. Add your first client above.
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
                    <button
                      onClick={() => setEditingClient(client)}
                      className="font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingClient(client)}
                      className="font-medium text-gray-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
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

      {deletingClient && (
        <DeleteClientDialog
          client={deletingClient}
          loading={deleteLoading}
          onCancel={() => {
            if (!deleteLoading) setDeletingClient(null)
          }}
          onConfirm={() => deleteClient(deletingClient)}
        />
      )}
    </div>
  )
}

function DeleteClientDialog({
  client,
  loading,
  onCancel,
  onConfirm,
}: {
  client: Client
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const clientName =
    client.individual?.fullName ||
    client.business?.businessName ||
    client.accountNumber

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-[1.75rem] border border-gray-200 bg-white p-6">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.83A1 1 0 003.75 18h16.5a1 1 0 00.86-1.51l-7.4-12.83a1 1 0 00-1.72 0z" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
          Delete Client
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-900">
          Remove {clientName}?
        </h3>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          This action will permanently delete the client record for account{' '}
          <span className="font-medium text-gray-700">{client.accountNumber}</span>. This cannot be
          undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusDialog({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}) {
  const isSuccess = type === 'success'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/35 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-[1.75rem] border border-gray-200 bg-white p-6">
        <div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
            isSuccess ? 'bg-[#f3fff6] text-[#36e07b]' : 'bg-red-50 text-red-500'
          }`}
        >
          {isSuccess ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.83A1 1 0 003.75 18h16.5a1 1 0 00.86-1.51l-7.4-12.83a1 1 0 00-1.72 0z" />
            </svg>
          )}
        </div>

        <p
          className={`text-xs font-semibold uppercase tracking-[0.2em] ${
            isSuccess ? 'text-[#36e07b]' : 'text-red-500'
          }`}
        >
          {isSuccess ? 'Success' : 'Delete Failed'}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-900">
          {isSuccess ? 'Client Removed' : 'Unable to Delete Client'}
        </h3>
        <p className="mt-3 text-sm leading-6 text-gray-500">{message}</p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              isSuccess
                ? 'bg-[#36e07b] text-gray-900 hover:bg-[#1bcb68]'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
