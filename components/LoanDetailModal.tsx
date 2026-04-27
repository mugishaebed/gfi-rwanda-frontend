'use client'

import type { Loan } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#36e07b]',
  REJECTED: 'bg-red-50 text-red-600',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-RW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })
}

interface Props {
  loan: Loan
  onClose: () => void
}

export default function LoanDetailModal({ loan, onClose }: Props) {
  const clientName =
    loan.client.individual?.fullName ??
    loan.client.business?.businessName ??
    loan.client.accountNumber

  const guarantorEntries = loan.guarantorInfo
    ? Object.entries(loan.guarantorInfo).filter(([, v]) => v)
    : []

  const submittedByName = loan.user?.name || 'Unknown user'
  const submittedByEmail = loan.user?.email || 'No email available'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
              Loan Details
            </p>
            <h3 className="text-xl font-bold text-gray-900">{clientName}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{loan.client.accountNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                STATUS_STYLES[loan.status] ?? 'bg-gray-100 text-gray-500'
              }`}
            >
              {loan.status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Core fields */}
          <Section title="Loan Information">
            <Field label="Amount" value={fmtMoney(loan.amount)} />
            <Field label="Purpose" value={loan.purpose} />
            <Field label="Applied" value={fmt(loan.createdAt)} />
            {loan.activatedAt && <Field label="Activated" value={fmt(loan.activatedAt)} />}
            {loan.comments && <Field label="Comments" value={loan.comments} full />}
          </Section>

          {/* Repayment schedule */}
          {loan.repaymentTerms.length > 0 && (
            <Section title="Repayment Schedule">
              <div className="col-span-2 divide-y divide-gray-50 -mt-1">
                {loan.repaymentTerms.map((term, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-500">{fmt(term.dueDate)}</span>
                    <span className="font-medium text-gray-900">{fmtMoney(term.amount)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Guarantor */}
          {guarantorEntries.length > 0 && (
            <Section title="Guarantor">
              {guarantorEntries.map(([k, v]) => (
                <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
              ))}
            </Section>
          )}

          {/* Loan officer */}
          <Section title="Submitted by">
            <Field label="Name" value={submittedByName} />
            <Field label="Email" value={submittedByEmail} />
          </Section>

          {/* Status history */}
          {loan.statusLogs.length > 0 && (
            <Section title="Status History">
              <div className="col-span-2 space-y-2 -mt-1">
                {loan.statusLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                          STATUS_STYLES[log.status] ?? 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.note && (
                        <p className="mt-1 text-xs text-gray-500 italic">{log.note}</p>
                      )}
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
            </Section>
          )}

          {/* Documents */}
          {loan.documents.length > 0 && (
            <Section title="Documents">
              <div className="col-span-2 flex flex-wrap gap-2 -mt-1">
                {loan.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`${API_URL}/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#36e07b] hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
                    </svg>
                    {doc.label || doc.filename}
                  </a>
                ))}
              </div>
            </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
