'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { PaymentProvider, Repayment, RepaymentsResponse, RepaymentStatus } from '@/lib/types'

const PAGE_SIZE = 20

const money = new Intl.NumberFormat('en-RW', {
  style: 'currency',
  currency: 'RWF',
  maximumFractionDigits: 0,
})

const dateTime = new Intl.DateTimeFormat('en-RW', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_STYLES: Record<RepaymentStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#258a4f]',
  REJECTED: 'bg-red-50 text-red-600',
}

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  MOBILE_MONEY: 'Mobile money',
}

type RepaymentDetailResponse = Repayment | { data: Repayment }

function unwrapRepayment(response: RepaymentDetailResponse): Repayment {
  if ('data' in response) return response.data
  return response
}

function formatMoney(value: number | undefined) {
  return typeof value === 'number' ? money.format(value) : '-'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return dateTime.format(parsed)
}

function formatProvider(value: PaymentProvider | null | undefined) {
  return value ? PROVIDER_LABELS[value] : '-'
}

function formatText(value: string | null | undefined) {
  return value?.trim() ? value : '-'
}

function getClientName(repayment: Repayment) {
  return (
    repayment.loan.client.individual?.fullName ??
    repayment.loan.client.business?.businessName ??
    'Unknown client'
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
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

function DetailModal({
  repayment,
  loading,
  error,
  onClose,
}: {
  repayment: Repayment | null
  loading: boolean
  error: string
  onClose: () => void
}) {
  const documents = repayment?.documents ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
              Online Payment
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              {repayment ? getClientName(repayment) : 'Payment details'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {repayment && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[repayment.status]}`}
              >
                {repayment.status}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-lg leading-none text-gray-300 transition-colors hover:text-gray-600"
              aria-label="Close payment details"
            >
              x
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-400">
            Loading payment details...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : repayment ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Payment date" value={formatDate(repayment.paymentDate)} />
              <DetailField label="Amount paid" value={formatMoney(repayment.amountPaid)} />
              <DetailField label="Provider" value={formatProvider(repayment.paymentProvider)} />
              <DetailField label="Reference" value={formatText(repayment.paymentReference)} />
              <DetailField label="Phone number" value={formatText(repayment.paymentPhoneNumber)} />
              <DetailField label="Loan number" value={formatText(repayment.loan.loanNumber)} />
              <DetailField
                label="Loan amount"
                value={formatMoney(repayment.loan.amount)}
              />
              <DetailField
                label="Outstanding balance"
                value={formatMoney(repayment.loan.outstandingBalance)}
              />
              <DetailField
                label="Total repaid"
                value={formatMoney(repayment.loan.totalRepaidAmount)}
              />
              <DetailField label="Approved at" value={formatDate(repayment.approvedAt)} />
              <DetailField label="Loan purpose" value={formatText(repayment.loan.purpose)} full />
              {repayment.notes && (
                <DetailField label="Notes" value={repayment.notes} full />
              )}
            </div>

            {documents.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Documents
                </p>
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
                    >
                      {doc.label || doc.filename || 'Document'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
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

export default function OnlinePaymentsManagement() {
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [viewingRepayment, setViewingRepayment] = useState<Repayment | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const fetchRepayments = useCallback(async () => {
    const params = new URLSearchParams({
      source: 'CLIENT_ONLINE',
      status: 'APPROVED',
      page: String(page),
      limit: String(PAGE_SIZE),
    })

    setLoading(true)
    setError('')

    try {
      const response = await apiFetch<RepaymentsResponse>(`/repayments?${params}`)
      setRepayments(response.data)
      setTotal(response.meta.total)
      setTotalPages(Math.max(1, response.meta.totalPages))
    } catch (err) {
      console.error('Failed to fetch online payments:', err)
      setRepayments([])
      setTotal(0)
      setTotalPages(1)
      setError('Unable to load online payments right now.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    let cancelled = false

    async function run() {
      await fetchRepayments()
      if (cancelled) return
    }

    run()

    return () => {
      cancelled = true
    }
  }, [fetchRepayments])

  useEffect(() => {
    if (!viewingId) return

    let cancelled = false

    async function fetchDetail() {
      setDetailLoading(true)
      setDetailError('')
      setViewingRepayment(null)

      try {
        const response = await apiFetch<RepaymentDetailResponse>(`/repayments/${viewingId}`)
        if (!cancelled) setViewingRepayment(unwrapRepayment(response))
      } catch (err) {
        console.error('Failed to fetch online payment detail:', err)
        if (!cancelled) setDetailError('Unable to load this payment detail.')
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    fetchDetail()

    return () => {
      cancelled = true
    }
  }, [viewingId])

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
          Online Payments
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Client Online Payments</h1>
        <p className="mt-2 max-w-3xl text-base text-gray-400">
          Review approved mobile money repayments submitted by clients from the online portal.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
              Approved client payments
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {total.toLocaleString('en-RW')} records from online repayments
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRepayments}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          Loading...
        </div>
      ) : repayments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <p className="mb-1 text-sm font-semibold text-gray-900">No online payments</p>
          <p className="text-sm text-gray-400">
            Approved client payments will appear here once clients pay online.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-[1180px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Client
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Loan number
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Payment date
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Amount paid
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Provider
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Reference
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Phone number
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Loan balance
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {repayments.map((repayment) => (
                <tr key={repayment.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                    {getClientName(repayment)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {formatText(repayment.loan.loanNumber)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {formatDate(repayment.paymentDate)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-sm text-gray-700">
                    {formatMoney(repayment.amountPaid)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {formatProvider(repayment.paymentProvider)}
                  </td>
                  <td className="max-w-[160px] px-5 py-4 text-sm text-gray-500">
                    <span className="block truncate">{formatText(repayment.paymentReference)}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {formatText(repayment.paymentPhoneNumber)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-sm text-gray-700">
                    {formatMoney(repayment.loan.outstandingBalance)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[repayment.status]}`}
                    >
                      {repayment.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setViewingId(repayment.id)}
                      className="font-medium text-[#258a4f] transition-colors hover:text-[#1bcb68]"
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
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {viewingId && (
        <DetailModal
          repayment={viewingRepayment}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setViewingId(null)
            setViewingRepayment(null)
            setDetailError('')
          }}
        />
      )}
    </div>
  )
}
