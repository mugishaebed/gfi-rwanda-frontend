'use client'

import { useState } from 'react'

interface Client {
  id: string
  type: 'INDIVIDUAL' | 'BUSINESS'
  email: string
  phoneNumber: string
  address: string
  accountNumber: string
  createdAt: string
  individual?: {
    fullName: string
    nationalId: string
    gender: string
    dateOfBirth: string
    nationality?: string
    maritalStatus?: string
    occupation?: string
    employerName?: string
    monthlyIncome?: string
    bankName?: string
    bankAccountNumber?: string
    pep: boolean
    referenceName?: string
  }
  business?: {
    businessName: string
    registrationNumber: string
    businessType: 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'
    incorporationDate: string
    pep: boolean
    businessShareholders: Array<{ name: string; ownershipPercentage: number }>
    businessWebsite?: string
    bankName?: string
    bankAccountNumber?: string
    authorizedSignatory?: string
    annualRevenue?: string
  }
  documents: Array<{ id: string; filename?: string; originalFileName?: string; label?: string }>
}

interface Props {
  client: Client
  onClose: () => void
  canApprove?: boolean
  onApprove?: (clientId: string) => void
  approving?: boolean
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
    </div>
  )
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership',
  LLC: 'LLC',
}

function DocumentRow({ doc }: { doc: { id: string; filename?: string; originalFileName?: string; label?: string } }) {
  const [loading, setLoading] = useState(false)
  const filename = doc.originalFileName ?? doc.filename ?? doc.label ?? 'Document'

  const handleView = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proxy/documents/${doc.id}/download`)
      if (!res.ok) throw new Error('Failed to fetch document')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // revoke after a short delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      alert('Could not open document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-gray-400 text-sm shrink-0">📄</span>
        <div className="min-w-0">
          <p className="text-sm text-gray-900 truncate">{filename}</p>
          {doc.label && <p className="text-xs text-gray-400">{doc.label}</p>}
        </div>
      </div>
      <button
        onClick={handleView}
        disabled={loading}
        className="ml-4 shrink-0 text-xs font-medium text-[#36e07b] hover:text-[#1bcb68] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Opening…' : 'View'}
      </button>
    </div>
  )
}

export default function ClientDetailModal({ client, onClose, canApprove = false, onApprove, approving = false }: Props) {
  const name = client.individual?.fullName ?? client.business?.businessName ?? '—'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
              {client.type === 'INDIVIDUAL' ? 'Individual' : 'Business'} Client
            </p>
            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Created {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none mt-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Common fields */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3 border-b border-gray-100 pb-1">
              Contact & Account
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={client.email} />
              <Field label="Phone" value={client.phoneNumber} />
              <Field label="Address" value={client.address} />
              <Field label="Account Number" value={client.accountNumber} />
            </div>
          </section>

          {/* Individual fields */}
          {client.type === 'INDIVIDUAL' && client.individual && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3 border-b border-gray-100 pb-1">
                Personal Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" value={client.individual.fullName} />
                <Field label="National ID" value={client.individual.nationalId} />
                <Field label="Gender" value={client.individual.gender} />
                <Field
                  label="Date of Birth"
                  value={client.individual.dateOfBirth
                    ? new Date(client.individual.dateOfBirth).toLocaleDateString()
                    : undefined}
                />
                <Field label="Nationality" value={client.individual.nationality} />
                <Field label="Marital Status" value={client.individual.maritalStatus} />
                <Field label="Occupation" value={client.individual.occupation} />
                <Field label="Employer" value={client.individual.employerName} />
                <Field label="Monthly Income" value={client.individual.monthlyIncome} />
                <Field label="Bank Name" value={client.individual.bankName} />
                <Field label="Bank Account" value={client.individual.bankAccountNumber} />
                <Field label="PEP" value={client.individual.pep} />
                <Field label="Reference Name" value={client.individual.referenceName} />
              </div>
            </section>
          )}

          {/* Business fields */}
          {client.type === 'BUSINESS' && client.business && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3 border-b border-gray-100 pb-1">
                Business Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Business Name" value={client.business.businessName} />
                <Field label="Registration Number" value={client.business.registrationNumber} />
                <Field label="Business Type" value={BUSINESS_TYPE_LABELS[client.business.businessType]} />
                <Field
                  label="Incorporation Date"
                  value={client.business.incorporationDate
                    ? new Date(client.business.incorporationDate).toLocaleDateString()
                    : undefined}
                />
                <Field label="Website" value={client.business.businessWebsite} />
                <Field label="Authorized Signatory" value={client.business.authorizedSignatory} />
                <Field label="Bank Name" value={client.business.bankName} />
                <Field label="Bank Account" value={client.business.bankAccountNumber} />
                <Field label="Annual Revenue" value={client.business.annualRevenue} />
                <Field label="PEP" value={client.business.pep} />
              </div>

              {client.business.businessShareholders?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">Shareholders</p>
                  <div className="space-y-1">
                    {client.business.businessShareholders.map((s, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                        <span>{s.name}</span>
                        <span className="text-gray-500">{s.ownershipPercentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Documents */}
          {client.documents?.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3 border-b border-gray-100 pb-1">
                Documents
              </p>
              <div className="space-y-2">
                {client.documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {canApprove && onApprove && (
            <button
              onClick={() => onApprove(client.id)}
              disabled={approving}
              className="rounded-lg bg-[#36e07b] px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68] disabled:opacity-50"
            >
              {approving ? 'Approving…' : 'Approve Profile'}
            </button>
          )}
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
