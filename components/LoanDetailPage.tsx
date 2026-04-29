'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { approveLoan, rejectLoan } from '@/lib/loan-actions'
import type { Loan, LoanDocument, RepaymentScheduleItem, RepaymentTermsDetail } from '@/lib/types'
import RecordRepaymentForm from './RecordRepaymentForm'

// ─── constants ────────────────────────────────────────────────────────────────

const CONTRACT_LABELS = new Set([
  'Loan Contract (English PDF)',
  "Amasezerano y'Inguzanyo (Kinyarwanda PDF)",
])

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-[#e8faf0] text-[#36e07b]',
  REJECTED: 'bg-red-50 text-red-600',
}

// ─── pure helpers ─────────────────────────────────────────────────────────────

function isContract(doc: LoanDocument) {
  return !!doc.label && CONTRACT_LABELS.has(doc.label)
}

function openDoc(id: string) {
  window.open(`/api/proxy/documents/${id}/download`, '_blank')
}

function hasVal(v: unknown): boolean {
  return v !== undefined && v !== null && v !== ''
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(v: number | string) {
  const n = Number(v)
  return isFinite(n)
    ? n.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })
    : String(v)
}

function fmtPct(v: number | string) {
  const n = Number(v)
  return isFinite(n)
    ? `${n.toLocaleString('en-RW', { maximumFractionDigits: 2 })}%`
    : `${v}%`
}

function getTerms(loan: Loan): RepaymentTermsDetail | undefined {
  if (!loan.repaymentTerms || Array.isArray(loan.repaymentTerms)) return undefined
  return loan.repaymentTerms
}

function getSchedule(loan: Loan): RepaymentScheduleItem[] {
  if (!loan.repaymentTerms) return []
  if (Array.isArray(loan.repaymentTerms)) {
    return loan.repaymentTerms.map((t, i) => ({
      installmentNo: i + 1,
      dueDate: t.dueDate,
      amount: t.amount,
    }))
  }
  return loan.repaymentTerms.schedule ?? []
}

function labelize(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

// ─── ReviewModal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
  loanId: string
  action: 'approve' | 'reject'
  onClose: () => void
  onDone: () => void
}

function ReviewModal({ loanId, action, onClose, onDone }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (action === 'approve') {
        await approveLoan(loanId, note || undefined)
      } else {
        await rejectLoan(loanId, note || undefined)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p
              className={`mb-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                action === 'approve' ? 'text-[#36e07b]' : 'text-red-500'
              }`}
            >
              {action === 'approve' ? 'Approve' : 'Reject'} Loan
            </p>
            <h3 className="text-xl font-bold text-gray-900">Confirm decision</h3>
          </div>
          <button
            onClick={onClose}
            className="mt-1 text-lg leading-none text-gray-300 transition-colors hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Note{' '}
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a review comment…"
              className="block w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#36e07b]"
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

// ─── layout sub-components ────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold leading-tight text-gray-900">{value}</p>
    </div>
  )
}

function DetailSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[#36e07b] px-2 text-xs font-semibold tracking-[0.15em] text-[#36e07b]">
          {number}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">{title}</p>
      </div>
      {children}
    </section>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-5">{children}</div>
}

function DetailField({
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
      <p className="mb-0.5 text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-6 lg:px-8">
        <div className="mb-5 h-4 w-24 rounded-lg bg-gray-100" />
        <div className="mb-2 h-8 w-56 rounded-lg bg-gray-100" />
        <div className="h-4 w-40 rounded-lg bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 h-3 w-20 rounded bg-gray-100" />
            <div className="h-5 w-28 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="rounded-[1.75rem] border border-gray-200 bg-white p-8">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${60 + (i % 3) * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

interface Props {
  loanId: string
  role: 'LOAN_OFFICER' | 'GENERAL_MANAGER'
}

export default function LoanDetailPage({ loanId, role }: Props) {
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [reviewing, setReviewing] = useState<'approve' | 'reject' | null>(null)
  const [recordingRepayment, setRecordingRepayment] = useState(false)

  const backHref =
    role === 'LOAN_OFFICER'
      ? '/dashboard/loan-officer/loans'
      : '/dashboard/general-manager/loans'

  const loadLoan = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const data = await apiFetch<Loan>(`/loans/${loanId}`)
      setLoan(data)
    } catch (err) {
      setFetchError((err as Error).message || 'Failed to load loan.')
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    loadLoan()
  }, [loadLoan])

  if (loading) return <Skeleton />

  if (fetchError || !loan) {
    return (
      <div className="animate-fade-up space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Loans
        </Link>
        <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-10 text-center">
          <p className="mb-1 text-sm font-semibold text-red-700">Failed to load loan</p>
          <p className="text-sm text-red-500">{fetchError || 'Loan not found.'}</p>
        </div>
      </div>
    )
  }

  // ── derived data ──
  const clientName =
    loan.client.individual?.fullName ??
    loan.client.business?.businessName ??
    loan.client.accountNumber

  const terms = getTerms(loan)
  const schedule = getSchedule(loan)
  const contractDocs = loan.documents.filter(isContract)
  const supportingDocs = loan.documents.filter((d) => !isContract(d))
  const guarantorEntries = loan.guarantorInfo
    ? Object.entries(loan.guarantorInfo).filter(([, v]) => hasVal(v))
    : []

  const hasCollateral =
    hasVal(loan.collateralType) ||
    hasVal(loan.collateralEstimatedValue) ||
    hasVal(loan.collateralLocation)
  const hasRepayment = !!(terms || schedule.length > 0)
  const hasFees =
    hasVal(loan.loanProcessingFeePercent) ||
    hasVal(loan.administrativeFeePercent) ||
    hasVal(loan.loanApplicationFeePercent) ||
    hasVal(loan.earlyRepaymentFeePercent) ||
    hasVal(loan.defaultPenaltyFeePercentPerDay)
  const hasRelationships = hasVal(loan.spouseName) || guarantorEntries.length > 0

  // ── numbered section labels (computed once, skipping absent sections) ──
  let n = 0
  const num = (condition?: boolean) =>
    condition === false ? '' : String(++n).padStart(2, '0')
  const nums = {
    loanDetails: num(),
    collateral: num(hasCollateral),
    repayment: num(hasRepayment),
    fees: num(hasFees),
    relationships: num(hasRelationships),
    submittedBy: num(),
    statusHistory: num(loan.statusLogs.length > 0),
    contracts: num(contractDocs.length > 0),
    documents: num(supportingDocs.length > 0),
  }

  const stats = [
    { label: 'Loan Amount', value: fmtMoney(loan.amount) },
    hasVal(loan.termInMonths) ? { label: 'Term', value: `${loan.termInMonths} months` } : null,
    hasVal(loan.interestRatePercentPerMonth)
      ? { label: 'Interest / Month', value: fmtPct(loan.interestRatePercentPerMonth!) }
      : null,
    { label: 'Applied', value: fmtDate(loan.createdAt) },
  ].filter(Boolean) as { label: string; value: string }[]

  const statusBadge = STATUS_BADGE[loan.status] ?? 'bg-gray-100 text-gray-500'

  return (
    <div className="animate-fade-up space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Loans
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dashboard-kicker mb-1">Loan Application</p>
            <h1 className="dashboard-title">{clientName}</h1>
            <p className="mt-1.5 text-sm text-gray-400">
              {loan.client.accountNumber}
              <span className="mx-2 text-gray-200">·</span>
              <span className="font-mono text-xs">{loan.id.slice(0, 13)}…</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadge}`}
            >
              {loan.status}
            </span>

            {role === 'GENERAL_MANAGER' && loan.status === 'PENDING' && (
              <>
                <button
                  onClick={() => setReviewing('reject')}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:text-red-600"
                >
                  Reject
                </button>
                <button
                  onClick={() => setReviewing('approve')}
                  className="rounded-xl bg-[#36e07b] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68]"
                >
                  Approve
                </button>
              </>
            )}

            {role === 'LOAN_OFFICER' && loan.status === 'APPROVED' && (
              <button
                onClick={() => setRecordingRepayment(true)}
                className="rounded-xl bg-[#36e07b] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68]"
              >
                + Record Repayment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div
        className={`grid grid-cols-2 gap-4 ${
          stats.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
        }`}
      >
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {/* ── Detail sections ─────────────────────────────────────────────────── */}
      <div className="rounded-[1.75rem] border border-gray-200 bg-white p-6 lg:p-8">
        <div className="space-y-8">

          {/* 01 — Loan Details */}
          <DetailSection number={nums.loanDetails} title="Loan Details">
            <FieldGrid>
              <DetailField label="Amount" value={fmtMoney(loan.amount)} />
              <DetailField label="Purpose" value={loan.purpose} />
              {hasVal(loan.interestRatePercentPerMonth) && (
                <DetailField
                  label="Interest Rate / Month"
                  value={fmtPct(loan.interestRatePercentPerMonth!)}
                />
              )}
              {hasVal(loan.termInMonths) && (
                <DetailField label="Term" value={`${loan.termInMonths} months`} />
              )}
              {loan.termStartDate && (
                <DetailField label="Term Start" value={fmtDate(loan.termStartDate)} />
              )}
              {loan.termEndDate && (
                <DetailField label="Term End" value={fmtDate(loan.termEndDate)} />
              )}
              {hasVal(loan.disbursementWithinDays) && (
                <DetailField
                  label="Disbursement Within"
                  value={`${loan.disbursementWithinDays} days`}
                />
              )}
              {loan.activatedAt && (
                <DetailField label="Activated" value={fmtDate(loan.activatedAt)} />
              )}
              {loan.comments && (
                <DetailField label="Comments" value={loan.comments} full />
              )}
            </FieldGrid>
          </DetailSection>

          {/* 02 — Collateral */}
          {hasCollateral && (
            <DetailSection number={nums.collateral} title="Collateral">
              <FieldGrid>
                {loan.collateralType && (
                  <DetailField label="Type" value={loan.collateralType} />
                )}
                {hasVal(loan.collateralEstimatedValue) && (
                  <DetailField
                    label="Estimated Value"
                    value={fmtMoney(loan.collateralEstimatedValue!)}
                  />
                )}
                {loan.collateralLocation && (
                  <DetailField label="Location" value={loan.collateralLocation} full />
                )}
              </FieldGrid>
            </DetailSection>
          )}

          {/* 03 — Repayment Plan */}
          {hasRepayment && (
            <DetailSection number={nums.repayment} title="Repayment Plan">
              <FieldGrid>
                {terms?.currency && (
                  <DetailField label="Currency" value={terms.currency} />
                )}
                {hasVal(terms?.installmentsCount ?? loan.repaymentInstallmentsCount) && (
                  <DetailField
                    label="Installments"
                    value={String(terms?.installmentsCount ?? loan.repaymentInstallmentsCount)}
                  />
                )}
                {hasVal(terms?.amountPerInstallment ?? loan.repaymentAmountPerMonth) && (
                  <DetailField
                    label="Amount / Installment"
                    value={fmtMoney(
                      terms?.amountPerInstallment ?? loan.repaymentAmountPerMonth!
                    )}
                  />
                )}
                {hasVal(terms?.periodMonths ?? loan.repaymentPeriodMonths) && (
                  <DetailField
                    label="Period"
                    value={`${terms?.periodMonths ?? loan.repaymentPeriodMonths} months`}
                  />
                )}
                {hasVal(terms?.paymentDayOfMonth ?? loan.paymentDayOfMonth) && (
                  <DetailField
                    label="Payment Day"
                    value={`Day ${terms?.paymentDayOfMonth ?? loan.paymentDayOfMonth}`}
                  />
                )}
              </FieldGrid>

              {schedule.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Schedule
                  </p>
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                            #
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                            Due Date
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {schedule.map((item, i) => (
                          <tr
                            key={i}
                            className="transition-colors hover:bg-gray-50/60"
                          >
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {item.installmentNo ?? i + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {fmtDate(item.dueDate)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                              {fmtMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </DetailSection>
          )}

          {/* 04 — Fees & Penalties */}
          {hasFees && (
            <DetailSection number={nums.fees} title="Fees & Penalties">
              <FieldGrid>
                {hasVal(loan.loanProcessingFeePercent) && (
                  <DetailField
                    label="Processing Fee"
                    value={fmtPct(loan.loanProcessingFeePercent!)}
                  />
                )}
                {hasVal(loan.administrativeFeePercent) && (
                  <DetailField
                    label="Administrative Fee"
                    value={fmtPct(loan.administrativeFeePercent!)}
                  />
                )}
                {hasVal(loan.loanApplicationFeePercent) && (
                  <DetailField
                    label="Application Fee"
                    value={fmtPct(loan.loanApplicationFeePercent!)}
                  />
                )}
                {hasVal(loan.earlyRepaymentFeePercent) && (
                  <DetailField
                    label="Early Repayment Fee"
                    value={fmtPct(loan.earlyRepaymentFeePercent!)}
                  />
                )}
                {hasVal(loan.defaultPenaltyFeePercentPerDay) && (
                  <DetailField
                    label="Default Penalty / Day"
                    value={fmtPct(loan.defaultPenaltyFeePercentPerDay!)}
                  />
                )}
              </FieldGrid>
            </DetailSection>
          )}

          {/* 05 — Relationships */}
          {hasRelationships && (
            <DetailSection number={nums.relationships} title="Relationships">
              <FieldGrid>
                {loan.spouseName && (
                  <DetailField label="Spouse" value={loan.spouseName} />
                )}
                {guarantorEntries.map(([key, val]) => (
                  <DetailField key={key} label={labelize(key)} value={String(val)} />
                ))}
              </FieldGrid>
            </DetailSection>
          )}

          {/* 06 — Submitted By */}
          <DetailSection number={nums.submittedBy} title="Submitted By">
            <FieldGrid>
              <DetailField label="Name" value={loan.user?.name || 'Unknown'} />
              <DetailField label="Email" value={loan.user?.email || '—'} />
            </FieldGrid>
          </DetailSection>

          {/* 07 — Status History */}
          {loan.statusLogs.length > 0 && (
            <DetailSection number={nums.statusHistory} title="Status History">
              <div className="space-y-2.5">
                {loan.statusLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 rounded-xl bg-gray-50 px-4 py-3.5"
                  >
                    <span
                      className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        STATUS_BADGE[log.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {log.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      {log.note && (
                        <p className="mb-0.5 text-sm text-gray-700">{log.note}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        by {log.user?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                      {fmtDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* 08 — Loan Contracts */}
          {contractDocs.length > 0 && (
            <DetailSection number={nums.contracts} title="Loan Contracts">
              <div className="space-y-2">
                {contractDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8faf0]">
                        <svg
                          className="h-4 w-4 text-[#36e07b]"
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
                      </div>
                      <span className="truncate text-sm font-medium text-gray-900">
                        {doc.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDoc(doc.id)}
                      className="ml-4 shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
                    >
                      Open PDF
                    </button>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* 09 — Supporting Documents */}
          {supportingDocs.length > 0 && (
            <DetailSection number={nums.documents} title="Supporting Documents">
              <div className="flex flex-wrap gap-2">
                {supportingDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => openDoc(doc.id)}
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
            </DetailSection>
          )}

        </div>
      </div>

      {/* ── Overlays ────────────────────────────────────────────────────────── */}
      {reviewing && (
        <ReviewModal
          loanId={loan.id}
          action={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            loadLoan()
          }}
        />
      )}

      {recordingRepayment && (
        <RecordRepaymentForm
          loan={loan}
          onClose={() => setRecordingRepayment(false)}
          onSuccess={() => {
            setRecordingRepayment(false)
            loadLoan()
          }}
        />
      )}
    </div>
  )
}
