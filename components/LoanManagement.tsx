'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import {
  approveLoan,
  approveLoanByOfficer,
  rejectLoan,
  rejectLoanByOfficer,
} from '@/lib/loan-actions'
import type { Loan, LoansResponse, LoanSource, LoanStatus } from '@/lib/types'
import RecordRepaymentForm from './RecordRepaymentForm'

const STATUS_STYLES: Record<LoanStatus, string> = {
  PENDING_OFFICER_REVIEW: 'bg-yellow-50 text-yellow-700',
  PENDING_GM_APPROVAL: 'bg-sky-50 text-sky-700',
  APPROVED: 'bg-amber-50 text-amber-700',
  DISBURSING: 'bg-purple-50 text-purple-700',
  DISBURSEMENT_FAILED: 'bg-red-50 text-red-600',
  ACTIVE: 'bg-[#e8faf0] text-[#238a4d]',
  REJECTED: 'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING_OFFICER_REVIEW: 'Awaiting officer review',
  PENDING_GM_APPROVAL: 'Awaiting GM approval',
  APPROVED: 'Approved — disbursing',
  DISBURSING: 'Disbursing…',
  DISBURSEMENT_FAILED: 'Disbursement failed',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
}

const SOURCE_STYLES: Record<LoanSource, string> = {
  CLIENT_ONLINE: 'bg-indigo-50 text-indigo-700',
  STAFF_MANUAL: 'bg-gray-100 text-gray-700',
}

const SOURCE_LABELS: Record<LoanSource, string> = {
  CLIENT_ONLINE: 'Online',
  STAFF_MANUAL: 'Manual',
}

type FilterKey =
  | 'online-pending'
  | 'manual-pending'
  | 'awaiting-gm'
  | 'online-all'
  | 'manual-all'
  | 'approved'
  | 'rejected'
  | 'all'

type LoanFilter = {
  key: FilterKey
  label: string
  status?: LoanStatus
  source?: LoanSource
  emptyTitle: string
  emptyHint: string
}

const LOAN_OFFICER_FILTERS: LoanFilter[] = [
  {
    key: 'all',
    label: 'All Loans',
    emptyTitle: 'No loans yet',
    emptyHint: 'Submit or receive a new application to get started.',
  },
  {
    key: 'online-pending',
    label: 'Online Requests',
    source: 'CLIENT_ONLINE',
    status: 'PENDING_OFFICER_REVIEW',
    emptyTitle: 'No pending online requests',
    emptyHint: 'Client-submitted loan requests will appear here.',
  },
  {
    key: 'manual-pending',
    label: 'Manual Requests',
    source: 'STAFF_MANUAL',
    status: 'PENDING_OFFICER_REVIEW',
    emptyTitle: 'No pending manual requests',
    emptyHint: 'Staff-created applications waiting for review will appear here.',
  },
  {
    key: 'awaiting-gm',
    label: 'Awaiting GM',
    status: 'PENDING_GM_APPROVAL',
    emptyTitle: 'No loans awaiting GM approval',
    emptyHint: 'Officer-approved loans move here before final approval.',
  },
  {
    key: 'approved',
    label: 'Active',
    status: 'ACTIVE',
    emptyTitle: 'No active loans',
    emptyHint: 'Disbursed loans in repayment will appear here.',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    status: 'REJECTED',
    emptyTitle: 'No rejected loans',
    emptyHint: 'Rejected loan applications will appear here.',
  },
]

const GENERAL_MANAGER_FILTERS: LoanFilter[] = [
  {
    key: 'all',
    label: 'All Loans',
    emptyTitle: 'No loans yet',
    emptyHint: 'Loan applications will appear here.',
  },
  {
    key: 'awaiting-gm',
    label: 'Awaiting Review',
    status: 'PENDING_GM_APPROVAL',
    emptyTitle: 'No loans awaiting GM approval',
    emptyHint: 'Manual loans and officer-approved online loans move here for final approval.',
  },
  {
    key: 'manual-all',
    label: 'Manual Pipeline',
    source: 'STAFF_MANUAL',
    emptyTitle: 'No manual loans',
    emptyHint: 'Staff-created loans will appear here.',
  },
  {
    key: 'online-all',
    label: 'Online Pipeline',
    source: 'CLIENT_ONLINE',
    emptyTitle: 'No online loans',
    emptyHint: 'Client-submitted loans will appear here.',
  },
  {
    key: 'approved',
    label: 'Active',
    status: 'ACTIVE',
    emptyTitle: 'No active loans',
    emptyHint: 'Disbursed loans in repayment will appear here.',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    status: 'REJECTED',
    emptyTitle: 'No rejected loans',
    emptyHint: 'Rejected loans will appear here.',
  },
]

interface Props {
  role?: 'LOAN_OFFICER' | 'GENERAL_MANAGER'
  initialFilter?: string
}

interface ReviewModalProps {
  loan: Loan
  action: 'approve' | 'reject'
  role: 'LOAN_OFFICER' | 'GENERAL_MANAGER'
  onClose: () => void
  onDone: () => void
}

function parseActionError(err: unknown) {
  try {
    const parsed = JSON.parse((err as Error).message)
    return Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message
  } catch {
    return (err as Error).message || 'An error occurred.'
  }
}

function ReviewModal({ loan, action, role, onClose, onDone }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [disbursedAmount, setDisbursedAmount] = useState<string>('')
  const [disbursedAt, setDisbursedAt] = useState<string>('')
  const [amountError, setAmountError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isApprove = action === 'approve'
  const isGMApproving = role === 'GENERAL_MANAGER' && action === 'approve'
  const isManualLoan = loan.source === 'STAFF_MANUAL'
  const reviewerLabel = role === 'LOAN_OFFICER' ? 'Loan Officer Review' : 'GM Review'
  const disbursedAmountNum = disbursedAmount ? parseFloat(disbursedAmount) : null

  const validateAmount = (value: string) => {
    if (!value) {
      setAmountError('')
      return true
    }
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      setAmountError('Amount must be greater than 0')
      return false
    }
    if (num > loan.amount) {
      setAmountError(`Cannot exceed requested amount of ${fmtMoney(loan.amount)}`)
      return false
    }
    setAmountError('')
    return true
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDisbursedAmount(value)
    validateAmount(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isGMApproving && isManualLoan) {
      if (!disbursedAmount || !disbursedAt) {
        setError('Disbursed Amount and Disbursement Date are required for manual loans')
        return
      }
      if (!validateAmount(disbursedAmount)) {
        return
      }
    }

    setLoading(true)

    try {
      if (role === 'LOAN_OFFICER') {
        if (isApprove) {
          await approveLoanByOfficer(loan.id, note || undefined)
        } else {
          await rejectLoanByOfficer(loan.id, note || undefined)
        }
      } else if (isApprove) {
        await approveLoan(loan.id, note || undefined, disbursedAmountNum || undefined, disbursedAt || undefined)
      } else {
        await rejectLoan(loan.id, note || undefined)
      }
      onDone()
    } catch (err) {
      setError(parseActionError(err))
    } finally {
      setLoading(false)
    }
  }

  const fmtMoney = (n: number) =>
    `${n.toLocaleString('en-RW', { maximumFractionDigits: 2 })} Rwf`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className={`mb-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                isApprove ? 'text-[#36e07b]' : 'text-red-500'
              }`}
            >
              {reviewerLabel}
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              {isApprove ? 'Approve loan' : 'Reject loan'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-lg leading-none text-gray-300 transition-colors hover:text-gray-600"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isGMApproving && isManualLoan && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Requested Amount
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
                  {fmtMoney(loan.amount)}
                </div>
              </div>

              <div>
                <label htmlFor="disbursed-amount" className="mb-1 block text-sm font-medium text-gray-700">
                  Disbursed Amount (RWF) <span className="text-red-500">*</span>
                </label>
                <input
                  id="disbursed-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={loan.amount}
                  value={disbursedAmount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount to disburse"
                  className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#36e07b] ${
                    amountError ? 'border-red-200' : 'border-gray-200'
                  }`}
                />
                {amountError && (
                  <p className="mt-1 text-xs text-red-600">{amountError}</p>
                )}
              </div>

              <div>
                <label htmlFor="disbursed-date" className="mb-1 block text-sm font-medium text-gray-700">
                  Disbursement Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="disbursed-date"
                  type="date"
                  value={disbursedAt}
                  onChange={(e) => setDisbursedAt(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#36e07b]"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Note <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a review comment..."
              className="block w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#36e07b] focus:ring-1 focus:ring-[#36e07b]"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                isApprove
                  ? 'bg-[#36e07b] text-gray-900 hover:bg-[#1bcb68]'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {loading ? 'Processing...' : isApprove ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoanManagement({ role = 'LOAN_OFFICER', initialFilter }: Props) {
  const filters = role === 'GENERAL_MANAGER' ? GENERAL_MANAGER_FILTERS : LOAN_OFFICER_FILTERS
  const resolvedInitialFilter =
    initialFilter && filters.some((filter) => filter.key === initialFilter)
      ? (initialFilter as FilterKey)
      : filters[0].key
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterKey, setFilterKey] = useState<FilterKey>(resolvedInitialFilter)
  const [recordingRepayment, setRecordingRepayment] = useState<Loan | null>(null)
  const [reviewing, setReviewing] = useState<{ loan: Loan; action: 'approve' | 'reject' } | null>(null)

  const basePath =
    role === 'GENERAL_MANAGER' ? '/dashboard/general-manager/loans' : '/dashboard/loan-officer/loans'

  const activeFilter = filters.find((filter) => filter.key === filterKey) ?? filters[0]
  const activeStatus = activeFilter.status
  const activeSource = activeFilter.source

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      })

      if (activeStatus) params.set('status', activeStatus)
      if (activeSource) params.set('source', activeSource)

      const res = await apiFetch<LoansResponse>(`/loans?${params.toString()}`)
      setLoans(res.data)
      setTotalPages(res.meta.totalPages)
    } catch (error) {
      console.error('Failed to fetch loans:', error)
    } finally {
      setLoading(false)
    }
  }, [page, activeStatus, activeSource])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoans()
  }, [fetchLoans])

  const onFilterChange = (key: FilterKey) => {
    setFilterKey(key)
    setPage(1)
    const params = new URLSearchParams(window.location.search)
    params.set('filter', key)
    window.history.replaceState(null, '', `${basePath}?${params.toString()}`)
  }

  const clientName = (loan: Loan) =>
    loan.client.individual?.fullName ??
    loan.client.business?.businessName ??
    loan.client.accountNumber

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-RW', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const fmtMoney = (n: number) =>
    `${n.toLocaleString('en-RW', { maximumFractionDigits: 2 })} Rwf`

  const canReview = (loan: Loan) =>
    role === 'LOAN_OFFICER'
      ? loan.status === 'PENDING_OFFICER_REVIEW'
      : loan.status === 'PENDING_GM_APPROVAL'

  const getSource = (loan: Loan): LoanSource => loan.source ?? 'STAFF_MANUAL'

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
          Loans
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
        <p className="mt-2 text-base text-gray-400">
          {role === 'LOAN_OFFICER'
            ? 'Review online requests separately from manual applications and send eligible loans to GM approval.'
            : 'Review loan-officer approved applications and track the full loan pipeline.'}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
            {filters.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onFilterChange(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterKey === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {role === 'LOAN_OFFICER' && (
            <Link
              href={`${basePath}/new`}
              className="inline-flex w-fit items-center justify-center rounded-lg bg-[#36e07b] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68]"
            >
              + New Application
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          Loading loans...
        </div>
      ) : loans.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8faf0]">
            <svg className="h-6 w-6 text-[#36e07b]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mb-1 text-sm font-semibold text-gray-900">{activeFilter.emptyTitle}</p>
          <p className="text-sm text-gray-400">{activeFilter.emptyHint}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Client
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Source
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Original Amount
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Outstanding Balance
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loans.map((loan) => {
                  const source = getSource(loan)

                  return (
                    <tr key={loan.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        <div>{clientName(loan)}</div>
                        <div className="mt-0.5 font-mono text-xs font-normal text-gray-400">
                          {loan.loanNumber ?? loan.id.slice(0, 13)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${SOURCE_STYLES[source]}`}
                        >
                          {SOURCE_LABELS[source]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-700">
                        {fmtMoney(loan.amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm">
                        <span
                          className={
                            loan.outstandingBalance
                              ? loan.outstandingBalance === 0
                                ? 'font-semibold text-green-600'
                                : 'text-gray-700'
                              : 'text-gray-400'
                          }
                        >
                          {loan.outstandingBalance !== undefined
                            ? fmtMoney(loan.outstandingBalance)
                            : fmtMoney(loan.amount)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {fmt(loan.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                            STATUS_STYLES[loan.status]
                          }`}
                        >
                          {STATUS_LABELS[loan.status]}
                        </span>
                      </td>
                      <td className="flex gap-3 whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          href={`${basePath}/${loan.id}`}
                          className="font-medium text-[#238a4d] transition-colors hover:text-[#1bcb68]"
                        >
                          View
                        </Link>
                        {canReview(loan) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setReviewing({ loan, action: 'approve' })}
                              className="font-medium text-gray-500 transition-colors hover:text-gray-900"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewing({ loan, action: 'reject' })}
                              className="font-medium text-gray-400 transition-colors hover:text-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {loan.status === 'ACTIVE' && role === 'LOAN_OFFICER' && (
                          <button
                            type="button"
                            onClick={() => setRecordingRepayment(loan)}
                            className="font-medium text-gray-500 transition-colors hover:text-gray-900"
                          >
                            + Repayment
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

      {reviewing && (
        <ReviewModal
          loan={reviewing.loan}
          action={reviewing.action}
          role={role}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            fetchLoans()
          }}
        />
      )}

      {recordingRepayment && (
        <RecordRepaymentForm
          loan={recordingRepayment}
          onClose={() => setRecordingRepayment(null)}
          onSuccess={() => {
            setRecordingRepayment(null)
            fetchLoans()
          }}
        />
      )}
    </div>
  )
}
