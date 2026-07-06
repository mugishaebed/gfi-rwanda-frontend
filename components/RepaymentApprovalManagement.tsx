'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import {
  approveRepayment,
  rejectRepayment,
  editRepayment,
  voidRepayment,
} from '@/lib/loan-actions'
import type { Repayment, RepaymentsResponse, RepaymentStatus } from '@/lib/types'

const STATUS_STYLES: Record<RepaymentStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#36e07b]',
  REJECTED: 'bg-red-50 text-red-600',
  VOIDED: 'bg-gray-100 text-gray-500',
}

type Filter = 'ALL' | RepaymentStatus

// outstandingBalance is principal-only, so only the principal portion of a
// repayment reduces it (interest does not). Falls back to amountPaid for
// legacy repayments without a recorded split.
function principalApplied(repayment: Repayment) {
  return repayment.principalPaid ?? repayment.amountPaid
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-50 px-4 py-3 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

interface ReviewModalProps {
  repayment: Repayment
  action: 'approve' | 'reject'
  onClose: () => void
  onDone: () => void
}

function ReviewModal({ repayment, action, onClose, onDone }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmtMoney = (n: number) =>
    n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (action === 'approve') {
        await approveRepayment(repayment.id, note || undefined)
      } else {
        await rejectRepayment(repayment.id, note || undefined)
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
    <div
      onClick={onClose}
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-end bg-gray-900/20 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5"
      >
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
          {action === 'approve' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
                Amount Being Approved
              </p>
              <p className="text-2xl font-bold text-gray-900">{fmtMoney(repayment.amountPaid)}</p>
              {(repayment.principalPaid != null || repayment.interestPaid != null) && (
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <p className="text-gray-500">Principal</p>
                    <p className="font-semibold text-gray-900">
                      {repayment.principalPaid != null ? fmtMoney(repayment.principalPaid) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Interest</p>
                    <p className="font-semibold text-gray-900">
                      {repayment.interestPaid != null ? fmtMoney(repayment.interestPaid) : '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {action === 'approve' && repayment.loan.outstandingBalance !== undefined && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-green-700">Balance Impact</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-600">Current Outstanding</p>
                  <p className="font-semibold text-gray-900">{fmtMoney(repayment.loan.outstandingBalance)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Principal Applied</p>
                  <p className="font-semibold text-gray-900">- {fmtMoney(principalApplied(repayment))}</p>
                </div>
              </div>
              <div className="border-t border-green-200 pt-2">
                <p className="text-gray-600">New Balance After Approval</p>
                <p className="text-lg font-bold text-green-700">
                  {fmtMoney(Math.max(0, repayment.loan.outstandingBalance - principalApplied(repayment)))}
                </p>
              </div>
            </div>
          )}
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

function parseError(err: unknown): string {
  try {
    const parsed = JSON.parse((err as Error).message)
    return Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message
  } catch {
    return (err as Error).message || 'An error occurred.'
  }
}

// ISO timestamp -> yyyy-mm-dd for <input type="date">
function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

interface EditModalProps {
  repayment: Repayment
  onClose: () => void
  onDone: () => void
}

function EditRepaymentModal({ repayment, onClose, onDone }: EditModalProps) {
  const [amountPaid, setAmountPaid] = useState(String(repayment.amountPaid))
  const [principalPaid, setPrincipalPaid] = useState(
    repayment.principalPaid != null ? String(repayment.principalPaid) : ''
  )
  const [interestPaid, setInterestPaid] = useState(
    repayment.interestPaid != null ? String(repayment.interestPaid) : ''
  )
  const [paymentDate, setPaymentDate] = useState(toDateInput(repayment.paymentDate))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = Number(amountPaid)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount paid must be a number greater than 0.')
      return
    }

    const hasPrincipal = principalPaid.trim() !== ''
    const hasInterest = interestPaid.trim() !== ''
    if (hasPrincipal || hasInterest) {
      const p = Number(principalPaid || 0)
      const i = Number(interestPaid || 0)
      if (Math.round((p + i) * 100) !== Math.round(amount * 100)) {
        setError('Principal + interest must equal the amount paid.')
        return
      }
    }

    setLoading(true)
    try {
      await editRepayment(repayment.id, {
        amountPaid: amount,
        ...(hasPrincipal ? { principalPaid: Number(principalPaid) } : {}),
        ...(hasInterest ? { interestPaid: Number(interestPaid) } : {}),
        paymentDate: new Date(`${paymentDate}T00:00:00.000Z`).toISOString(),
        ...(note ? { note } : {}),
      })
      onDone()
    } catch (err) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-end bg-gray-900/20 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1 text-[#36e07b]">
              Edit Repayment
            </p>
            <h3 className="text-xl font-bold text-gray-900">Correct repayment details</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none mt-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (RWF)</label>
            <input
              type="number"
              min={1}
              step="any"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={principalPaid}
                onChange={(e) => setPrincipalPaid(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={interestPaid}
                onChange={(e) => setInterestPaid(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for the correction…"
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b] resize-none"
            />
          </div>

          {repayment.status === 'APPROVED' && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              This repayment is approved — saving will reverse and reapply the loan balances.
            </p>
          )}

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
              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 bg-[#36e07b] text-gray-900 hover:bg-[#1bcb68]"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VoidRepaymentModal({ repayment, onClose, onDone }: EditModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await voidRepayment(repayment.id, note || undefined)
      onDone()
    } catch (err) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-end bg-gray-900/20 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1 text-red-500">
              Void Repayment
            </p>
            <h3 className="text-xl font-bold text-gray-900">Confirm void</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none mt-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Voiding soft-deletes this repayment.
            {repayment.status === 'APPROVED' && ' Because it is approved, the loan balances will be reversed.'}
            {' '}This cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for voiding…"
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
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
              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 bg-red-500 text-white hover:bg-red-600"
            >
              {loading ? 'Voiding…' : 'Void repayment'}
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

  const splitKnown = repayment.principalPaid != null || repayment.interestPaid != null

  return (
    <div
      onClick={onClose}
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-end bg-gray-900/20 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-7 pb-5 pt-7">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
              Repayment Details
            </p>
            <h3 className="truncate text-xl font-bold text-gray-900">{clientName}</h3>
            {repayment.loan.loanNumber && (
              <p className="mt-0.5 font-mono text-xs text-gray-400">{repayment.loan.loanNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[repayment.status]}`}>
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

        {/* Body */}
        <div className="space-y-6 overflow-y-auto px-7 py-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column: amount + split + projected impact */}
            <div className="space-y-6">
              {/* Amount hero + split */}
              <div className="rounded-2xl border border-[#cdeedd] bg-gradient-to-br from-[#e8faf0] to-white p-5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#7ca089]">Amount Paid</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-[#1f1724]">
                  {fmtMoney(repayment.amountPaid)}
                </p>
                <p className="mt-1 text-xs text-gray-500">Paid on {fmt(repayment.paymentDate)}</p>

                {splitKnown && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-white/70 px-4 py-3">
                      <p className="text-xs text-gray-400">Principal</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {repayment.principalPaid != null ? fmtMoney(repayment.principalPaid) : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white/70 px-4 py-3">
                      <p className="text-xs text-gray-400">Interest</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {repayment.interestPaid != null ? fmtMoney(repayment.interestPaid) : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Projected impact (pending only) */}
              {repayment.loan.outstandingBalance !== undefined && repayment.status === 'PENDING' && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-blue-700">
                    Projected Principal After Approval
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    {fmtMoney(Math.max(0, repayment.loan.outstandingBalance - principalApplied(repayment)))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {fmtMoney(repayment.loan.outstandingBalance)} − {fmtMoney(principalApplied(repayment))}
                  </p>
                </div>
              )}
            </div>

            {/* Right column: loan info + notes */}
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <DetailRow label="Loan purpose" value={repayment.loan.purpose} />
                <DetailRow label="Original amount" value={fmtMoney(repayment.loan.amount)} />
                {repayment.loan.outstandingBalance !== undefined && (
                  <DetailRow label="Outstanding principal" value={fmtMoney(repayment.loan.outstandingBalance)} />
                )}
                {repayment.loan.totalRepaidAmount !== undefined && (
                  <DetailRow label="Total repaid" value={fmtMoney(repayment.loan.totalRepaidAmount)} />
                )}
                <DetailRow label="Submitted on" value={fmt(repayment.createdAt)} />
              </div>

              {repayment.notes && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Notes</p>
                  <p className="text-sm text-gray-700">{repayment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {statusLogs.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Status History</p>
              <div className="space-y-2">
                {statusLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[log.status as RepaymentStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                        {log.status}
                      </span>
                      {log.note && <p className="mt-1 text-xs italic text-gray-500">{log.note}</p>}
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Documents</p>
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

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-7 py-4">
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

export default function RepaymentApprovalManagement() {
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [viewingRepayment, setViewingRepayment] = useState<Repayment | null>(null)
  const [reviewing, setReviewing] = useState<{ repayment: Repayment; action: 'approve' | 'reject' } | null>(null)
  const [editing, setEditing] = useState<Repayment | null>(null)
  const [voiding, setVoiding] = useState<Repayment | null>(null)

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
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Voided', value: 'VOIDED' },
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
                    {r.status !== 'VOIDED' && r.status !== 'REJECTED' && (
                      <>
                        <button
                          onClick={() => setEditing(r)}
                          className="font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setVoiding(r)}
                          className="font-medium text-gray-400 hover:text-red-600 transition-colors"
                        >
                          Void
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
          repayment={reviewing.repayment}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            fetchRepayments()
          }}
        />
      )}

      {editing && (
        <EditRepaymentModal
          repayment={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            fetchRepayments()
          }}
        />
      )}

      {voiding && (
        <VoidRepaymentModal
          repayment={voiding}
          onClose={() => setVoiding(null)}
          onDone={() => {
            setVoiding(null)
            fetchRepayments()
          }}
        />
      )}
    </div>
  )
}
