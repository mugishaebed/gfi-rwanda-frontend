'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { Repayment, RepaymentsResponse, RepaymentStatus } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

const STATUS_STYLES: Record<RepaymentStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#36e07b]',
  REJECTED: 'bg-red-50 text-red-600',
}

type Filter = 'ALL' | RepaymentStatus

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-RW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })
}

function RepaymentDetailModal({
  repayment,
  onClose,
}: {
  repayment: Repayment
  onClose: () => void
}) {
  const statusLogs = repayment.statusLogs ?? []
  const documents = repayment.documents ?? []
  const clientName =
    repayment.loan.client.individual?.fullName ??
    repayment.loan.client.business?.businessName ??
    repayment.loan.client.accountNumber

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
              Repayment Details
            </p>
            <h3 className="text-xl font-bold text-gray-900">{clientName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[repayment.status]}`}
            >
              {repayment.status}
            </span>
            <button
              onClick={onClose}
              className="text-lg leading-none text-gray-300 transition-colors hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <DetailField label="Amount Paid" value={fmtMoney(repayment.amountPaid)} />
            <DetailField label="Payment Date" value={fmt(repayment.paymentDate)} />
            <DetailField
              label="Principal Paid"
              value={repayment.principalPaid != null ? fmtMoney(repayment.principalPaid) : '—'}
            />
            <DetailField
              label="Interest Paid"
              value={repayment.interestPaid != null ? fmtMoney(repayment.interestPaid) : '—'}
            />
            <DetailField label="Loan" value={repayment.loan.purpose} />
            <DetailField label="Original Loan Amount" value={fmtMoney(repayment.loan.amount)} />
            <DetailField label="Submitted by" value={repayment.user?.name || 'Unknown user'} />
            <DetailField label="Submitted on" value={fmt(repayment.createdAt)} />
            {repayment.notes && <DetailField label="Notes" value={repayment.notes} full />}
          </div>

          {statusLogs.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                Status History
              </p>
              <div className="space-y-2">
                {statusLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                          STATUS_STYLES[log.status as RepaymentStatus] ?? 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.note && <p className="mt-1 text-xs italic text-gray-500">{log.note}</p>}
                      <p className="mt-0.5 text-xs text-gray-400">
                        by {log.user?.name || 'Unknown user'}
                      </p>
                    </div>
                    <span className="ml-4 whitespace-nowrap text-xs text-gray-400">
                      {fmt(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                Documents
              </p>
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`${API_URL}/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
                  >
                    {doc.label || doc.filename}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailField({
  label,
  value,
  full,
}: {
  label: string
  value: string
  full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

export default function LoanOfficerRepaymentManagement() {
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [viewingRepayment, setViewingRepayment] = useState<Repayment | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRepayments() {
      try {
        setLoading(true)
        const statusParam = filter !== 'ALL' ? `&status=${filter}` : ''
        const res = await apiFetch<RepaymentsResponse>(`/repayments?page=${page}&limit=10${statusParam}`)
        if (cancelled) return
        setRepayments(res.data)
        setTotalPages(res.meta.totalPages)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch repayments:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRepayments()

    return () => {
      cancelled = true
    }
  }, [filter, page])

  const clientName = (repayment: Repayment) =>
    repayment.loan.client.individual?.fullName ??
    repayment.loan.client.business?.businessName ??
    repayment.loan.client.accountNumber

  const FILTER_TABS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
          Repayments
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Repayment Records</h1>
        <p className="mt-2 text-base text-gray-400">
          Track the repayments you have submitted and review their approval status.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="w-fit rounded-xl bg-gray-50 p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value)
                setPage(1)
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-white text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          Loading…
        </div>
      ) : repayments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <p className="mb-1 text-sm font-semibold text-gray-900">
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} repayments
          </p>
          <p className="text-sm text-gray-400">Record a repayment from the loans page to see it here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Client
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Amount Paid
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Payment Date
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Loan Purpose
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {repayments.map((repayment) => (
                <tr key={repayment.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {clientName(repayment)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-700">
                    {fmtMoney(repayment.amountPaid)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {fmt(repayment.paymentDate)}
                  </td>
                  <td className="max-w-[180px] px-6 py-4 text-sm text-gray-500">
                    <span className="block truncate">{repayment.loan.purpose}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[repayment.status]}`}
                    >
                      {repayment.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => setViewingRepayment(repayment)}
                      className="font-medium text-[#36e07b] transition-colors hover:text-[#1bcb68]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {viewingRepayment && (
        <RepaymentDetailModal
          repayment={viewingRepayment}
          onClose={() => setViewingRepayment(null)}
        />
      )}
    </div>
  )
}
