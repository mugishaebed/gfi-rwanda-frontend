'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { Loan } from '@/lib/types'

interface Props {
  loan: Loan
  onClose: () => void
  onSuccess: () => void
}

interface SuggestedSplit {
  loanId: string
  amountPaid: number
  outstandingPrincipal: number
  interestRatePercentPerMonth: number
  principalPaid: number
  interestPaid: number
}

const roundCents = (n: number) => Math.round(n * 100)

export default function RecordRepaymentForm({ loan, onClose, onSuccess }: Props) {
  const [amountPaid, setAmountPaid] = useState('')
  const [principalPaid, setPrincipalPaid] = useState('')
  const [interestPaid, setInterestPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [documents, setDocuments] = useState<File[]>([])
  const [documentLabels, setDocumentLabels] = useState<string[]>([])
  const [fileError, setFileError] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const clientName =
    loan.client.individual?.fullName ?? loan.client.business?.businessName ?? loan.client.accountNumber

  // The split flow is for manual loans; online loans are settled elsewhere.
  const isManual = loan.source !== 'CLIENT_ONLINE'

  // When the officer types an amount, ask the backend for a suggested split and
  // pre-fill the (still editable) principal/interest fields.
  useEffect(() => {
    const amount = Number(amountPaid)
    if (!isManual || !amountPaid || !(amount > 0)) return

    let cancelled = false
    const timer = setTimeout(async () => {
      setSuggesting(true)
      try {
        const split = await apiFetch<SuggestedSplit>(
          `/repayments/loans/${loan.id}/suggested-split?amount=${amount}`
        )
        if (cancelled) return
        setPrincipalPaid(String(split.principalPaid))
        setInterestPaid(String(split.interestPaid))
      } catch {
        // Suggestion is best-effort — the officer can still fill the split in.
      } finally {
        if (!cancelled) setSuggesting(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [amountPaid, isManual, loan.id])

  // Mirror the backend split rules for instant feedback.
  const amountNum = Number(amountPaid)
  const principalNum = principalPaid === '' ? null : Number(principalPaid)
  const interestNum = interestPaid === '' ? null : Number(interestPaid)
  const outstanding = loan.outstandingBalance

  let splitError = ''
  if (principalNum !== null && interestNum !== null && amountPaid !== '') {
    if (principalNum < 0 || interestNum < 0) {
      splitError = 'Principal and interest cannot be negative'
    } else if (roundCents(principalNum + interestNum) !== roundCents(amountNum)) {
      splitError = 'Principal + Interest must equal the total amount paid'
    }
  }

  let principalError = ''
  if (principalNum !== null && principalNum > 0 && outstanding !== undefined && principalNum > outstanding) {
    principalError = 'Principal cannot exceed the outstanding principal balance'
  }

  const canSubmit =
    !loading && !fileError && !splitError && !principalError && !!amountPaid && !!paymentDate

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 10) {
      setFileError('Maximum 10 files allowed')
      return
    }
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > 10 * 1024 * 1024) {
      setFileError('Total file size cannot exceed 10MB')
      return
    }
    setFileError('')
    setDocuments(files)
    setDocumentLabels(new Array(files.length).fill(''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (splitError || principalError) return

    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('loanId', loan.id)
      fd.append('amountPaid', amountPaid)
      if (principalPaid) fd.append('principalPaid', principalPaid)
      if (interestPaid) fd.append('interestPaid', interestPaid)
      fd.append('paymentDate', paymentDate)
      if (notes) fd.append('notes', notes)

      documents.forEach((doc) => fd.append('documents', doc))
      if (documents.length > 0) {
        fd.append('documentLabels', JSON.stringify(documentLabels))
      }

      const res = await fetch('/api/proxy/repayments', { method: 'POST', body: fd })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      onSuccess()
    } catch (err) {
      try {
        const parsed = JSON.parse((err as Error).message)
        const msg = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message
        setSubmitError(msg)
      } catch {
        setSubmitError((err as Error).message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#36e07b] focus:outline-none focus:ring-1 focus:ring-[#36e07b]'

  return (
    <div
      onClick={onClose}
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-end bg-gray-900/20 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
              Record Repayment
            </p>
            <h3 className="text-xl font-bold text-gray-900">{clientName}</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {loan.purpose}
            </p>
            <p className="text-xs text-gray-500 mt-1.5">
              Original: {loan.amount.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}
              {loan.outstandingBalance !== undefined && (
                <>
                  {' '} • Outstanding principal: {loan.outstandingBalance.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none mt-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount Paid (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="e.g. 50000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                Payment Breakdown
              </p>
              <span className="text-xs font-normal text-gray-400">
                {suggesting ? 'Suggesting split…' : 'Auto-filled — editable'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Principal Paid (RWF)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={principalPaid}
                  onChange={(e) => setPrincipalPaid(e.target.value)}
                  placeholder="e.g. 40000"
                  className={inputClass}
                />
                {principalError && <p className="mt-1 text-xs text-red-600">{principalError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Paid (RWF)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={interestPaid}
                  onChange={(e) => setInterestPaid(e.target.value)}
                  placeholder="e.g. 10000"
                  className={inputClass}
                />
              </div>
            </div>
            {splitError && (
              <p className="text-xs text-red-600">{splitError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Documents{' '}
              <span className="text-xs font-normal text-gray-400">(optional, max 10, 10MB total)</span>
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8faf0] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-[#d0f5e0]"
            />
            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
            {documents.map((doc, i) => (
              <div key={i} className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Label (optional)"
                  value={documentLabels[i] || ''}
                  onChange={(e) => {
                    const next = [...documentLabels]
                    next[i] = e.target.value
                    setDocumentLabels(next)
                  }}
                  className="text-sm rounded-lg border border-gray-200 px-2 py-1 w-40 focus:border-[#36e07b] focus:outline-none"
                />
                <span className="text-xs text-gray-500">
                  {doc.name} ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ))}
          </div>

          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#36e07b] px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-[#1bcb68] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Recording…' : 'Record Repayment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
