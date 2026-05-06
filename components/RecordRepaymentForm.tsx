'use client'

import { useState } from 'react'
import type { Loan } from '@/lib/types'

interface Props {
  loan: Loan
  onClose: () => void
  onSuccess: () => void
}

export default function RecordRepaymentForm({ loan, onClose, onSuccess }: Props) {
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [documents, setDocuments] = useState<File[]>([])
  const [documentLabels, setDocumentLabels] = useState<string[]>([])
  const [fileError, setFileError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const clientName =
    loan.client.individual?.fullName ?? loan.client.business?.businessName ?? loan.client.accountNumber

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
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('loanId', loan.id)
      fd.append('amountPaid', amountPaid)
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
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
                  {' '} • Outstanding: {loan.outstandingBalance.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}
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
              disabled={loading || !!fileError}
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
