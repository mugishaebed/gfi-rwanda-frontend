'use client'

import { useState } from 'react'
import { editLoan } from '@/lib/loan-actions'
import type { Loan } from '@/lib/types'

const INPUT_CLASS =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#36e07b] focus:ring-1 focus:ring-[#36e07b]'

// yyyy-mm-dd for <input type="date">, or '' when absent.
function toDateInput(iso?: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : ''
}

function parseError(err: unknown): string {
  try {
    const parsed = JSON.parse((err as Error).message)
    return Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message
  } catch {
    return (err as Error).message || 'An error occurred.'
  }
}

interface Props {
  loan: Loan
  onClose: () => void
  onDone: () => void
}

// The GM only authors the disbursement details during approval, so those are the
// only fields editable here — the rest of the loan belongs to the officer/client.
export default function LoanEditModal({ loan, onClose, onDone }: Props) {
  const initialAmount = loan.disbursedAmount != null ? String(loan.disbursedAmount) : ''
  const initialDate = toDateInput(loan.disbursedAt)

  const [disbursedAmount, setDisbursedAmount] = useState(initialAmount)
  const [disbursedAt, setDisbursedAt] = useState(initialDate)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmtMoney = (n: number) =>
    n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload: Record<string, unknown> = {}

    if (disbursedAmount.trim() !== '' && disbursedAmount !== initialAmount) {
      const amount = Number(disbursedAmount)
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Disbursed amount must be a number greater than 0.')
        return
      }
      if (amount > loan.amount) {
        setError(`Disbursed amount cannot exceed the approved amount (${fmtMoney(loan.amount)}).`)
        return
      }
      payload.disbursedAmount = amount
    }

    if (disbursedAt !== initialDate && disbursedAt !== '') {
      payload.disbursedAt = disbursedAt
    }

    if (Object.keys(payload).length === 0 && !note) {
      setError('No changes to save.')
      return
    }
    if (note) payload.note = note

    setLoading(true)
    try {
      await editLoan(loan.id, payload)
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
        role="dialog"
        aria-modal="true"
        aria-label="Edit disbursement"
        className="animate-slide-in-right flex max-h-[calc(100vh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
              Edit Disbursement
            </p>
            <h3 className="truncate text-lg font-bold text-gray-900">
              {loan.loanNumber ?? 'Loan details'}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Only the disbursement details set at approval can be changed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="edit-disbursement-form" onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {/* Context: approved amount */}
            <div className="flex items-baseline justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
                Approved Amount
              </span>
              <span className="text-sm font-semibold text-gray-900">{fmtMoney(loan.amount)}</span>
            </div>

            <div>
              <label htmlFor="edit-disbursed-amount" className="block text-sm font-medium text-gray-700">
                Disbursed Amount
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-gray-400">
                  RWF
                </span>
                <input
                  id="edit-disbursed-amount"
                  type="number"
                  step="0.01"
                  min={0}
                  max={loan.amount}
                  value={disbursedAmount}
                  onChange={(e) => setDisbursedAmount(e.target.value)}
                  placeholder="0"
                  className={`${INPUT_CLASS} mt-0 pl-12 text-right font-medium tabular-nums`}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Cannot exceed the approved amount.</p>
            </div>

            <div>
              <label htmlFor="edit-disbursed-date" className="block text-sm font-medium text-gray-700">
                Disbursement Date
              </label>
              <input
                id="edit-disbursed-date"
                type="date"
                value={disbursedAt}
                onChange={(e) => setDisbursedAt(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="edit-note" className="block text-sm font-medium text-gray-700">
                Note <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="edit-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for the correction — added to the audit log…"
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-disbursement-form"
            disabled={loading}
            className="rounded-lg bg-[#36e07b] px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68] disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
