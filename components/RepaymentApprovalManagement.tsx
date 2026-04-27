'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { approveRepayment, rejectRepayment } from '@/lib/loan-actions'
import type { Repayment, RepaymentsResponse, RepaymentStatus } from '@/lib/types'

const STATUS_STYLES: Record<RepaymentStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#36e07b]',
  REJECTED: 'bg-red-50 text-red-600',
}

type Filter = 'ALL' | RepaymentStatus

interface ReviewModalProps {
  repaymentId: string
  action: 'approve' | 'reject'
  onClose: () => void
  onDone: () => void
}

function ReviewModal({ repaymentId, action, onClose, onDone }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (action === 'approve') {
        await approveRepayment(repaymentId, note || undefined)
      } else {
        await rejectRepayment(repaymentId, note || undefined)
      }
      onDone()
    } catch (err) {
      try {
        const parsed = JSON.parse((err as Error).message)
        setError(Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message)
      } catch {
        setError((err as Error).message || 'An error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-1 ${action === 'approve' ? 'text-[#36e07b]' : 'text-red-500'}`}>
              {action === 'approve' ? 'Approve' : 'Reject'} Repayment
            </p>
            <h3 className="text-xl font-bold text-gray-900">Confirm decision</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none mt-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a review comment…"
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b] resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                action === 'approve'
                  ? 'bg-[#36e07b] text-gray-900 hover:bg-[#1bcb68]'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {loading ? 'Processing…' : action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RepaymentDetailModal({ repayment, onClose }: { repayment: Repayment; onClose: () => void }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
  const statusLogs = repayment.statusLogs ?? []
  const documents = repayment.documents ?? []
  const clientName =
    repayment.loan.client.individual?.fullName ??
    repayment.loan.client.business?.businessName ??
    repayment.loan.client.accountNumber

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })

  const fmtMoney = (n: number) =>
    n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
              Repayment Details
            </p>
            <h3 className="text-xl font-bold text-gray-900">{clientName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[repayment.status]}`}>
              {repayment.status}
            </span>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none">
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs text-gray-400">Amount Paid</p>
              <p className="text-sm font-medium text-gray-900">{fmtMoney(repayment.amountPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Payment Date</p>
              <p className="text-sm font-medium text-gray-900">{fmt(repayment.paymentDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Loan</p>
              <p className="text-sm font-medium text-gray-900">{repayment.loan.purpose}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Original Loan Amount</p>
              <p className="text-sm font-medium text-gray-900">{fmtMoney(repayment.loan.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Submitted by</p>
              <p className="text-sm font-medium text-gray-900">
                {repayment.user?.name || 'Unknown user'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Submitted on</p>
              <p className="text-sm font-medium text-gray-900">{fmt(repayment.createdAt)}</p>
            </div>
            {repayment.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Notes</p>
                <p className="text-sm font-medium text-gray-900">{repayment.notes}</p>
              </div>
            )}
          </div>

          {statusLogs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">Status History</p>
              <div className="space-y-2">
                {statusLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[log.status as RepaymentStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                        {log.status}
                      </span>
                      {log.note && <p className="mt-1 text-xs text-gray-500 italic">{log.note}</p>}
                      <p className="mt-0.5 text-xs text-gray-400">
                        by {log.user?.name || 'Unknown user'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {fmt(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">Documents</p>
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`${API_URL}/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#36e07b] hover:text-gray-900 transition-colors"
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
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RepaymentApprovalManagement() {
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [viewingRepayment, setViewingRepayment] = useState<Repayment | null>(null)
  const [reviewing, setReviewing] = useState<{ repayment: Repayment; action: 'approve' | 'reject' } | null>(null)

  const fetchRepayments = useCallback(async () => {
    try {
      setLoading(true)
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : ''
      const res = await apiFetch<RepaymentsResponse>(`/repayments?page=${page}&limit=10${statusParam}`)
      setRepayments(res.data)
      setTotalPages(res.meta.totalPages)
    } catch (error) {
      console.error('Failed to fetch repayments:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchRepayments()
  }, [fetchRepayments])

  const onFilterChange = (f: Filter) => {
    setFilter(f)
    setPage(1)
  }

  const clientName = (r: Repayment) =>
    r.loan.client.individual?.fullName ??
    r.loan.client.business?.businessName ??
    r.loan.client.accountNumber

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })

  const fmtMoney = (n: number) =>
    n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })

  const FILTER_TABS: { label: string; value: Filter }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: 'ALL' },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Repayments
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Repayment Records</h1>
        <p className="mt-2 text-base text-gray-400">
          Review and approve or reject repayment submissions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex gap-1 bg-gray-50 rounded-xl p-1 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
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
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Loading…
        </div>
      ) : repayments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} repayments
          </p>
          <p className="text-sm text-gray-400">Try a different filter above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Client</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Amount Paid</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Payment Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Loan Purpose</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Officer</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {repayments.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {clientName(r)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {fmtMoney(r.amountPaid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fmt(r.paymentDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[140px] truncate">
                    {r.loan.purpose}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {r.user?.name || 'Unknown user'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                    <button
                      onClick={() => setViewingRepayment(r)}
                      className="font-medium text-[#36e07b] hover:text-[#1bcb68] transition-colors"
                    >
                      View
                    </button>
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setReviewing({ repayment: r, action: 'approve' })}
                          className="font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setReviewing({ repayment: r, action: 'reject' })}
                          className="font-medium text-gray-400 hover:text-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
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
      )}

      {viewingRepayment && (
        <RepaymentDetailModal repayment={viewingRepayment} onClose={() => setViewingRepayment(null)} />
      )}

      {reviewing && (
        <ReviewModal
          repaymentId={reviewing.repayment.id}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            fetchRepayments()
          }}
        />
      )}
    </div>
  )
}
