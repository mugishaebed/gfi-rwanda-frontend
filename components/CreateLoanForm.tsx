'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface SimpleClient {
  id: string
  type: 'INDIVIDUAL' | 'BUSINESS'
  individual?: { fullName: string }
  business?: { businessName: string }
  accountNumber: string
}

interface ClientsResponse {
  data: SimpleClient[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

interface RepaymentTermInput {
  dueDate: string
  amount: string
}

interface GuarantorInput {
  name: string
  phone: string
  relationship: string
}

interface Props {
  onClose?: () => void
  onSuccess?: () => void
  mode?: 'modal' | 'page'
}

export default function CreateLoanForm({ onClose, onSuccess, mode = 'modal' }: Props) {
  const router = useRouter()
  const [clients, setClients] = useState<SimpleClient[]>([])
  const [clientId, setClientId] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [comments, setComments] = useState('')
  const [repaymentTerms, setRepaymentTerms] = useState<RepaymentTermInput[]>([
    { dueDate: '', amount: '' },
  ])
  const [guarantor, setGuarantor] = useState<GuarantorInput>({
    name: '',
    phone: '',
    relationship: '',
  })
  const [documents, setDocuments] = useState<File[]>([])
  const [documentLabels, setDocumentLabels] = useState<string[]>([])
  const [fileError, setFileError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch<ClientsResponse>('/clients?limit=100')
      .then((res) => setClients(res.data))
      .catch(console.error)
  }, [])

  const clientName = (c: SimpleClient) =>
    c.individual?.fullName ?? c.business?.businessName ?? c.accountNumber

  const addTerm = () =>
    setRepaymentTerms((prev) => [...prev, { dueDate: '', amount: '' }])

  const removeTerm = (i: number) =>
    setRepaymentTerms((prev) => prev.filter((_, idx) => idx !== i))

  const updateTerm = (i: number, field: keyof RepaymentTermInput, value: string) =>
    setRepaymentTerms((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t))
    )

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
      fd.append('clientId', clientId)
      fd.append('amount', amount)
      fd.append('purpose', purpose)
      if (comments) fd.append('comments', comments)

      const terms = repaymentTerms
        .filter((t) => t.dueDate && t.amount)
        .map((t) => ({ dueDate: new Date(t.dueDate).toISOString(), amount: parseFloat(t.amount) }))
      fd.append('repaymentTerms', JSON.stringify(terms))

      const hasGuarantor = guarantor.name || guarantor.phone || guarantor.relationship
      if (hasGuarantor) {
        fd.append('guarantorInfo', JSON.stringify(guarantor))
      }

      documents.forEach((doc) => fd.append('documents', doc))
      if (documents.length > 0) {
        fd.append('documentLabels', JSON.stringify(documentLabels))
      }

      const res = await fetch('/api/proxy/loans', { method: 'POST', body: fd })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      if (onSuccess) {
        onSuccess()
      } else if (mode === 'page') {
        router.push('/dashboard/loan-officer/loans')
      }
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

  const closeForm = () => {
    if (onClose) {
      onClose()
      return
    }
    if (mode === 'page') {
      router.push('/dashboard/loan-officer/loans')
    }
  }

  const content = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className={inputClass}
        >
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {clientName(c)} — {c.accountNumber}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (RWF) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Business expansion"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Repayment Schedule
          </label>
          <button
            type="button"
            onClick={addTerm}
            className="text-xs font-semibold text-[#36e07b] hover:text-[#1bcb68] transition-colors"
          >
            + Add term
          </button>
        </div>
        <div className="space-y-2">
          {repaymentTerms.map((term, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="date"
                value={term.dueDate}
                onChange={(e) => updateTerm(i, 'dueDate', e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={term.amount}
                onChange={(e) => updateTerm(i, 'amount', e.target.value)}
                placeholder="Amount"
                className={`${inputClass} w-36`}
              />
              {repaymentTerms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTerm(i)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Guarantor Info <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            value={guarantor.name}
            onChange={(e) => setGuarantor((g) => ({ ...g, name: e.target.value }))}
            placeholder="Name"
            className={inputClass}
          />
          <input
            type="tel"
            value={guarantor.phone}
            onChange={(e) => setGuarantor((g) => ({ ...g, phone: e.target.value }))}
            placeholder="Phone"
            className={inputClass}
          />
          <input
            type="text"
            value={guarantor.relationship}
            onChange={(e) => setGuarantor((g) => ({ ...g, relationship: e.target.value }))}
            placeholder="Relationship"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comments <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Any additional notes…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supporting Documents{' '}
          <span className="text-xs font-normal text-gray-400">(max 10, 10MB total)</span>
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="mt-1 block w-full rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500"
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
          onClick={closeForm}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !!fileError}
          className="rounded-lg bg-[#36e07b] px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-[#1bcb68] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </form>
  )

  return (
    mode === 'page' ? (
      <div className="space-y-6 animate-fade-up">
        <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-6 lg:px-8">
          <p className="dashboard-kicker mb-2">New Application</p>
          <h1 className="dashboard-title">Apply for a Loan</h1>
          <p className="dashboard-subtitle mt-3 max-w-3xl">
            Capture the client, loan amount, repayment schedule, guarantor details, and supporting
            documents in one dedicated workflow.
          </p>
        </div>

        <div className="max-w-5xl rounded-[1.75rem] border border-gray-200 bg-white p-8">
          {content}
        </div>
      </div>
    ) : (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
              New Application
            </p>
            <h3 className="text-xl font-bold text-gray-900">Apply for a Loan</h3>
          </div>
          <button
            onClick={closeForm}
            className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none mt-1"
          >
            ✕
          </button>
        </div>
        {content}
      </div>
      </div>
    )
  )
}
