'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { Loan, LoansResponse, LoanStatus } from '@/lib/types'
import RecordRepaymentForm from './RecordRepaymentForm'

const STATUS_STYLES: Record<LoanStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#36e07b]',
  REJECTED: 'bg-red-50 text-red-600',
}

type Filter = 'ALL' | LoanStatus

interface Props {
  role?: 'LOAN_OFFICER' | 'GENERAL_MANAGER'
}

export default function LoanManagement({ role = 'LOAN_OFFICER' }: Props) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [recordingRepayment, setRecordingRepayment] = useState<Loan | null>(null)

  const basePath = role === 'GENERAL_MANAGER' ? '/dashboard/general-manager/loans' : '/dashboard/loan-officer/loans'

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
    new Date(iso).toLocaleDateString('en-RW', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const fmtMoney = (n: number) =>
    `${n.toLocaleString('en-RW', { maximumFractionDigits: 2 })} Rwf`

  const FILTER_TABS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
          Loans
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
        <p className="mt-2 text-base text-gray-400">
          Review, process, and track your loan applications.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
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

          {role === 'LOAN_OFFICER' && (
            <Link
              href={`${basePath}/new`}
              className="rounded-lg bg-[#36e07b] px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-[#1bcb68] transition-colors"
            >
              + New Application
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Loading loans…
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#e8faf0] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#36e07b]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {filter === 'ALL' ? 'No loans yet' : `No ${filter.toLowerCase()} loans`}
          </p>
          <p className="text-sm text-gray-400">
            {filter === 'ALL'
              ? 'Submit a new application to get started.'
              : 'Try a different filter above.'}
          </p>
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
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {clientName(loan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {fmtMoney(loan.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    <span className={loan.outstandingBalance ? (loan.outstandingBalance === 0 ? 'text-green-600 font-semibold' : 'text-gray-700') : 'text-gray-400'}>
                      {loan.outstandingBalance !== undefined ? fmtMoney(loan.outstandingBalance) : fmtMoney(loan.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fmt(loan.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        STATUS_STYLES[loan.status]
                      }`}
                    >
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                    <Link
                      href={`${basePath}/${loan.id}`}
                      className="font-medium text-[#36e07b] hover:text-[#1bcb68] transition-colors"
                    >
                      View
                    </Link>
                    {loan.status === 'APPROVED' && role === 'LOAN_OFFICER' && (
                      <button
                        onClick={() => setRecordingRepayment(loan)}
                        className="font-medium text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        + Repayment
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
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
