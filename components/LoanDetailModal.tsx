'use client'

import type { Loan, LoanDocument, RepaymentScheduleItem, RepaymentTermsDetail } from '@/lib/types'

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

const CONTRACT_LABELS = new Set([
  'Loan Contract (English PDF)',
  "Amasezerano y'Inguzanyo (Kinyarwanda PDF)",
])

function isContract(doc: LoanDocument) {
  return !!doc.label && CONTRACT_LABELS.has(doc.label)
}

function openDocument(docId: string) {
  window.open(`/api/proxy/documents/${docId}/download`, '_blank')
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

function fmtDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-RW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtMoney(value: number | string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return numeric.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })
}

function fmtPercent(value: number | string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${value}%`
  return `${numeric.toLocaleString('en-RW', { maximumFractionDigits: 2 })}%`
}

function labelize(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function repaymentDetail(loan: Loan): RepaymentTermsDetail | undefined {
  if (!loan.repaymentTerms || Array.isArray(loan.repaymentTerms)) return undefined
  return loan.repaymentTerms
}

function repaymentSchedule(loan: Loan): RepaymentScheduleItem[] {
  if (!loan.repaymentTerms) return []
  if (Array.isArray(loan.repaymentTerms)) {
    return loan.repaymentTerms.map((term, index) => ({
      installmentNo: index + 1,
      dueDate: term.dueDate,
      amount: term.amount,
    }))
  }
  return loan.repaymentTerms.schedule ?? []
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
    ? Object.entries(loan.guarantorInfo).filter(([, value]) => hasValue(value))
    : []

  const terms = repaymentDetail(loan)
  const schedule = repaymentSchedule(loan)
  const submittedByName = loan.user?.name || 'Unknown user'
  const submittedByEmail = loan.user?.email || 'No email available'

  const hasCollateral =
    hasValue(loan.collateralType) ||
    hasValue(loan.collateralEstimatedValue) ||
    hasValue(loan.collateralLocation)

  const hasFees =
    hasValue(loan.loanProcessingFeePercent) ||
    hasValue(loan.administrativeFeePercent) ||
    hasValue(loan.loanApplicationFeePercent) ||
    hasValue(loan.earlyRepaymentFeePercent) ||
    hasValue(loan.defaultPenaltyFeePercentPerDay)

  const hasRelationships = hasValue(loan.spouseName) || guarantorEntries.length > 0

  const contractDocs = loan.documents.filter(isContract)
  const supportingDocs = loan.documents.filter((doc) => !isContract(doc))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
              Loan Details
            </p>
            <h3 className="text-xl font-bold text-gray-900">{clientName}</h3>
            <p className="mt-0.5 text-sm text-gray-400">{loan.client.accountNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                STATUS_STYLES[loan.status] ?? 'bg-gray-100 text-gray-500'
              }`}
            >
              {STATUS_LABELS[loan.status] ?? loan.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-lg leading-none text-gray-300 transition-colors hover:text-gray-600"
            >
              x
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Section title="Loan Information">
            <Field label="Original Amount" value={fmtMoney(loan.amount)} />
            {loan.outstandingBalance !== undefined && (
              <Field label="Outstanding Principal" value={fmtMoney(loan.outstandingBalance)} />
            )}
            {loan.totalRepaidAmount !== undefined && (
              <Field label="Total Repaid" value={fmtMoney(loan.totalRepaidAmount)} />
            )}
            <Field label="Purpose" value={loan.purpose} />
            {hasValue(loan.interestRatePercentPerMonth) && (
              <Field
                label="Interest Rate / Month"
                value={fmtPercent(loan.interestRatePercentPerMonth!)}
              />
            )}
            {hasValue(loan.termInMonths) && (
              <Field label="Term" value={`${loan.termInMonths} months`} />
            )}
            {loan.termStartDate && <Field label="Term Start" value={fmtDate(loan.termStartDate)} />}
            {loan.termEndDate && <Field label="Term End" value={fmtDate(loan.termEndDate)} />}
            {hasValue(loan.disbursementWithinDays) && (
              <Field
                label="Disbursement"
                value={`Within ${loan.disbursementWithinDays} days`}
              />
            )}
            <Field label="Applied" value={fmtDate(loan.createdAt)} />
            {loan.activatedAt && <Field label="Activated" value={fmtDate(loan.activatedAt)} />}
            {loan.comments && <Field label="Comments" value={loan.comments} full />}
          </Section>

          {hasCollateral && (
            <Section title="Collateral">
              {loan.collateralType && <Field label="Type" value={loan.collateralType} />}
              {hasValue(loan.collateralEstimatedValue) && (
                <Field
                  label="Estimated Value"
                  value={fmtMoney(loan.collateralEstimatedValue!)}
                />
              )}
              {loan.collateralLocation && (
                <Field label="Location" value={loan.collateralLocation} full />
              )}
            </Section>
          )}

          {(terms || schedule.length > 0) && (
            <Section title="Repayment">
              {terms?.currency && <Field label="Currency" value={terms.currency} />}
              {hasValue(terms?.installmentsCount ?? loan.repaymentInstallmentsCount) && (
                <Field
                  label="Installments"
                  value={String(terms?.installmentsCount ?? loan.repaymentInstallmentsCount)}
                />
              )}
              {hasValue(terms?.amountPerInstallment ?? loan.repaymentAmountPerMonth) && (
                <Field
                  label="Amount / Installment"
                  value={fmtMoney(terms?.amountPerInstallment ?? loan.repaymentAmountPerMonth!)}
                />
              )}
              {hasValue(terms?.periodMonths ?? loan.repaymentPeriodMonths) && (
                <Field
                  label="Period"
                  value={`${terms?.periodMonths ?? loan.repaymentPeriodMonths} months`}
                />
              )}
              {hasValue(terms?.paymentDayOfMonth ?? loan.paymentDayOfMonth) && (
                <Field
                  label="Payment Day"
                  value={`Day ${terms?.paymentDayOfMonth ?? loan.paymentDayOfMonth}`}
                />
              )}
              {schedule.length > 0 && (
                <div className="col-span-2 divide-y divide-gray-50 -mt-1">
                  {schedule.map((term, index) => (
                    <div key={index} className="flex justify-between gap-4 py-2 text-sm">
                      <span className="text-gray-500">
                        #{term.installmentNo ?? index + 1} - {fmtDate(term.dueDate)}
                      </span>
                      <span className="font-medium text-gray-900">{fmtMoney(term.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {hasFees && (
            <Section title="Fees & Penalties">
              {hasValue(loan.loanProcessingFeePercent) && (
                <Field
                  label="Processing Fee"
                  value={fmtPercent(loan.loanProcessingFeePercent!)}
                />
              )}
              {hasValue(loan.administrativeFeePercent) && (
                <Field
                  label="Administrative Fee"
                  value={fmtPercent(loan.administrativeFeePercent!)}
                />
              )}
              {hasValue(loan.loanApplicationFeePercent) && (
                <Field
                  label="Application Fee"
                  value={fmtPercent(loan.loanApplicationFeePercent!)}
                />
              )}
              {hasValue(loan.earlyRepaymentFeePercent) && (
                <Field
                  label="Early Repayment Fee"
                  value={fmtPercent(loan.earlyRepaymentFeePercent!)}
                />
              )}
              {hasValue(loan.defaultPenaltyFeePercentPerDay) && (
                <Field
                  label="Default Penalty / Day"
                  value={fmtPercent(loan.defaultPenaltyFeePercentPerDay!)}
                />
              )}
            </Section>
          )}

          {hasRelationships && (
            <Section title="Relationships">
              {loan.spouseName && <Field label="Spouse" value={loan.spouseName} />}
              {guarantorEntries.map(([key, value]) => (
                <Field key={key} label={labelize(key)} value={String(value)} />
              ))}
            </Section>
          )}

          <Section title="Submitted by">
            <Field label="Name" value={submittedByName} />
            <Field label="Email" value={submittedByEmail} />
          </Section>

          {loan.statusLogs.length > 0 && (
            <Section title="Status History">
              <div className="col-span-2 space-y-2 -mt-1">
                {loan.statusLogs.map((log) => {
                  const status = log.status ?? log.toStatus ?? log.fromStatus ?? 'PENDING'

                  return (
                    <div
                      key={log.id}
                      className="flex items-start justify-between rounded-xl bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                            STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {STATUS_LABELS[status] ?? status}
                        </span>
                        {log.note && (
                          <p className="mt-1 text-xs italic text-gray-500">{log.note}</p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-400">
                          by {log.user?.name || 'Unknown user'}
                        </p>
                      </div>
                      <span className="ml-4 whitespace-nowrap text-xs text-gray-400">
                        {fmtDate(log.createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {contractDocs.length > 0 && (
            <Section title="Loan Contracts">
              <div className="col-span-2 -mt-1 space-y-2">
                {contractDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <svg
                        className="h-4 w-4 shrink-0 text-[#36e07b]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="truncate text-sm font-medium text-gray-900">
                        {doc.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDocument(doc.id)}
                      className="ml-4 shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
                    >
                      Open PDF
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {supportingDocs.length > 0 && (
            <Section title="Documents">
              <div className="col-span-2 flex flex-wrap gap-2 -mt-1">
                {supportingDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
                  >
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {doc.label || doc.filename}
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  value,
  full,
}: {
  label: string
  value: string
  full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
