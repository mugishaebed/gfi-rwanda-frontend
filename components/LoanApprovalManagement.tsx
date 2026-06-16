'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { approveLoan, rejectLoan } from '@/lib/loan-actions'
import type { Loan, LoansResponse, LoanStatus } from '@/lib/types'

const STATUS_STYLES: Record<string, string> = {
  PENDING_OFFICER_REVIEW: 'bg-yellow-50 text-yellow-700',
  PENDING_GM_APPROVAL: 'bg-sky-50 text-sky-700',
  APPROVED: 'bg-amber-50 text-amber-700',
  DISBURSING: 'bg-purple-50 text-purple-700',
  DISBURSEMENT_FAILED: 'bg-red-50 text-red-600',
  ACTIVE: 'bg-[#e8faf0] text-[#238a4d]',
  REJECTED: 'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_OFFICER_REVIEW: 'Awaiting officer review',
  PENDING_GM_APPROVAL: 'Awaiting GM approval',
  APPROVED: 'Approved — disbursing',
  DISBURSING: 'Disbursing…',
  DISBURSEMENT_FAILED: 'Disbursement failed',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
}

type Filter = 'ALL' | LoanStatus

interface ReviewModalProps {
  loanId: string
  action: 'approve' | 'reject'
  onClose: () => void
  onDone: () => void
}

function ReviewModal({ loanId, action, onClose, onDone }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (action === 'approve') {
        await approveLoan(loanId, note || undefined)
      } else {
        await rejectLoan(loanId, note || undefined)
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
              {action === 'approve' ? 'Approve' : 'Reject'} Loan
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

export default function LoanApprovalManagement() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [reviewing, setReviewing] = useState<{ loan: Loan; action: 'approve' | 'reject' } | null>(null)

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true)
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : ''
      const res = await apiFetch<LoansResponse>(`/loans?page=${page}&limit=10${statusParam}`)
      setLoans(res.data)
      setTotalPages(res.meta.totalPages)
    } catch (error) {
      console.error('Failed to fetch loans:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoans()
  }, [fetchLoans])

  const onFilterChange = (f: Filter) => {
    setFilter(f)
    setPage(1)
  }

  const clientName = (loan: Loan) =>
    loan.client.individual?.fullName ??
    loan.client.business?.businessName ??
    loan.client.accountNumber

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })

  const fmtMoney = (n: number) =>
    `${n.toLocaleString('en-RW', { maximumFractionDigits: 2 })} Rwf`

  const FILTER_TABS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Awaiting GM', value: 'PENDING_GM_APPROVAL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Loans
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
        <p className="mt-2 text-base text-gray-400">
          Review and approve or reject pending loan applications.
        </p>
      </div>

      {/* Filter tabs */}
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

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Loading…
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} loans
          </p>
          <p className="text-sm text-gray-400">Try a different filter above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Client</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Amount</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {clientName(loan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {fmtMoney(loan.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fmt(loan.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[loan.status]}`}>
                      {STATUS_LABELS[loan.status] ?? loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                    <Link
                      href={`/dashboard/general-manager/loans/${loan.id}`}
                      className="font-medium text-[#36e07b] hover:text-[#1bcb68] transition-colors"
                    >
                      View
                    </Link>
                    {loan.status === 'PENDING_GM_APPROVAL' && (
                      <>
                        <button
                          onClick={() => setReviewing({ loan, action: 'approve' })}
                          className="font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setReviewing({ loan, action: 'reject' })}
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

      {/* Pagination */}
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

      {reviewing && (
        <ReviewModal
          loanId={reviewing.loan.id}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            fetchLoans()
          }}
        />
      )}
    </div>
  )
}
