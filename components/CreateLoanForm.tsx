'use client'

import { useEffect, useState } from 'react'
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

interface LoanFormData {
  clientId: string
  amount: string
  disbursedAmount: string
  disbursedAt: string
  purpose: string
  interestRatePercentPerMonth: string
  termInMonths: string
  termStartDate: string
  termEndDate: string
  disbursementWithinDays: string
  collateralType: string
  collateralEstimatedValue: string
  collateralLocation: string
  repaymentInstallmentsCount: string
  repaymentAmountPerMonth: string
  repaymentPeriodMonths: string
  paymentDayOfMonth: string
  loanProcessingFeePercent: string
  administrativeFeePercent: string
  loanApplicationFeePercent: string
  earlyRepaymentFeePercent: string
  defaultPenaltyFeePercentPerDay: string
  spouseName: string
  comments: string
}

interface RepaymentScheduleInput {
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

const INITIAL_FORM_DATA: LoanFormData = {
  clientId: '',
  amount: '',
  disbursedAmount: '',
  disbursedAt: '',
  purpose: '',
  interestRatePercentPerMonth: '',
  termInMonths: '',
  termStartDate: '',
  termEndDate: '',
  disbursementWithinDays: '',
  collateralType: '',
  collateralEstimatedValue: '',
  collateralLocation: '',
  repaymentInstallmentsCount: '',
  repaymentAmountPerMonth: '',
  repaymentPeriodMonths: '',
  paymentDayOfMonth: '',
  loanProcessingFeePercent: '',
  administrativeFeePercent: '',
  loanApplicationFeePercent: '',
  earlyRepaymentFeePercent: '',
  defaultPenaltyFeePercentPerDay: '',
  spouseName: '',
  comments: '',
}

const INPUT_CLASS =
  'mt-1 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#36e07b]'

const FILE_INPUT_CLASS =
  'mt-1 block w-full rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500'

const MAX_DOCUMENTS = 10
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
const ACCEPTED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const ACCEPTED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

function isAcceptedDocument(file: File) {
  const lowerName = file.name.toLowerCase()
  return (
    ACCEPTED_DOCUMENT_TYPES.has(file.type) ||
    ACCEPTED_DOCUMENT_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  )
}

export default function CreateLoanForm({ onClose, onSuccess, mode = 'modal' }: Props) {
  const router = useRouter()
  const [clients, setClients] = useState<SimpleClient[]>([])
  const [formData, setFormData] = useState<LoanFormData>(INITIAL_FORM_DATA)
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentScheduleInput[]>([
    { dueDate: '', amount: '' },
  ])
  const [guarantor, setGuarantor] = useState<GuarantorInput>({
    name: '',
    phone: '',
    relationship: '',
  })
  const [disburseDiffers, setDisburseDiffers] = useState(false)
  const [documents, setDocuments] = useState<File[]>([])
  const [documentLabels, setDocumentLabels] = useState<string[]>([])
  const [fileError, setFileError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch<ClientsResponse>('/v1/clients?limit=100')
      .then((res) => setClients(res.data))
      .catch(console.error)
  }, [])

  const clientName = (client: SimpleClient) =>
    client.individual?.fullName ?? client.business?.businessName ?? client.accountNumber

  const handleInputChange = <K extends keyof LoanFormData>(field: K, value: LoanFormData[K]) => {
    setSubmitError('')
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addScheduleItem = () =>
    setRepaymentSchedule((prev) => [...prev, { dueDate: '', amount: '' }])

  const removeScheduleItem = (index: number) =>
    setRepaymentSchedule((prev) => prev.filter((_, itemIndex) => itemIndex !== index))

  const updateScheduleItem = (
    index: number,
    field: keyof RepaymentScheduleInput,
    value: string
  ) =>
    setRepaymentSchedule((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length > MAX_DOCUMENTS) {
      setFileError('Maximum 10 files allowed.')
      setDocuments([])
      setDocumentLabels([])
      event.currentTarget.value = ''
      return
    }

    const unsupportedFile = files.find((file) => !isAcceptedDocument(file))
    if (unsupportedFile) {
      setFileError('Documents must be PDF, JPEG, PNG, or WEBP.')
      setDocuments([])
      setDocumentLabels([])
      event.currentTarget.value = ''
      return
    }

    const oversizedFile = files.find((file) => file.size > MAX_DOCUMENT_SIZE)
    if (oversizedFile) {
      setFileError(`${oversizedFile.name} exceeds the 10MB per-file limit.`)
      setDocuments([])
      setDocumentLabels([])
      event.currentTarget.value = ''
      return
    }

    setFileError('')
    setDocuments(files)
    setDocumentLabels(new Array(files.length).fill(''))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')
    setLoading(true)

    try {
      const schedule = repaymentSchedule
        .filter((item) => item.dueDate && item.amount)
        .map((item, index) => ({
          installmentNo: index + 1,
          dueDate: item.dueDate,
          amount: Number(item.amount),
        }))

      if (schedule.length === 0) {
        throw new Error('Add at least one repayment schedule item.')
      }

      const fd = new FormData()
      fd.append('clientId', formData.clientId)
      fd.append('amount', formData.amount)
      if (disburseDiffers && formData.disbursedAmount) {
        fd.append('disbursedAmount', formData.disbursedAmount)
      }
      if (formData.disbursedAt) {
        fd.append('disbursedAt', formData.disbursedAt)
      }
      fd.append('purpose', formData.purpose.trim())
      fd.append('interestRatePercentPerMonth', formData.interestRatePercentPerMonth)
      fd.append('termInMonths', formData.termInMonths)
      fd.append('termStartDate', formData.termStartDate)
      fd.append('termEndDate', formData.termEndDate)
      fd.append('disbursementWithinDays', formData.disbursementWithinDays)
      fd.append('collateralType', formData.collateralType.trim())
      fd.append('collateralEstimatedValue', formData.collateralEstimatedValue)
      fd.append('collateralLocation', formData.collateralLocation.trim())
      fd.append('repaymentInstallmentsCount', formData.repaymentInstallmentsCount)
      fd.append('repaymentAmountPerMonth', formData.repaymentAmountPerMonth)
      fd.append('repaymentPeriodMonths', formData.repaymentPeriodMonths)
      fd.append('paymentDayOfMonth', formData.paymentDayOfMonth)
      fd.append('loanProcessingFeePercent', formData.loanProcessingFeePercent)
      fd.append('administrativeFeePercent', formData.administrativeFeePercent)
      fd.append('loanApplicationFeePercent', formData.loanApplicationFeePercent)
      fd.append('earlyRepaymentFeePercent', formData.earlyRepaymentFeePercent)
      fd.append('defaultPenaltyFeePercentPerDay', formData.defaultPenaltyFeePercentPerDay)

      if (formData.spouseName.trim()) {
        fd.append('spouseName', formData.spouseName.trim())
      }
      if (formData.comments.trim()) {
        fd.append('comments', formData.comments.trim())
      }

      const guarantorInfo = Object.fromEntries(
        Object.entries(guarantor).filter(([, value]) => value.trim())
      )
      if (Object.keys(guarantorInfo).length > 0) {
        fd.append('guarantorInfo', JSON.stringify(guarantorInfo))
      }

      fd.append(
        'repaymentTerms',
        JSON.stringify({
          currency: 'RWF',
          installmentsCount: Number(formData.repaymentInstallmentsCount),
          amountPerInstallment: Number(formData.repaymentAmountPerMonth),
          periodMonths: Number(formData.repaymentPeriodMonths),
          paymentDayOfMonth: Number(formData.paymentDayOfMonth),
          schedule,
        })
      )

      documents.forEach((document) => fd.append('documents', document))
      if (documents.length > 0) {
        fd.append('documentLabels', JSON.stringify(documentLabels.map((label) => label.trim())))
      }

      const response = await fetch('/api/proxy/loans', { method: 'POST', body: fd })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }

      if (onSuccess) {
        onSuccess()
      } else if (mode === 'page') {
        router.push('/dashboard/loan-officer/loans')
      }
    } catch (error) {
      try {
        const parsed = JSON.parse((error as Error).message)
        const message = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message
        setSubmitError(message)
      } catch {
        setSubmitError((error as Error).message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

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
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section
        number="01"
        title="Client & Request"
        description="Core application details for the requested loan."
      >
        <Field label="Client *">
          <select
            required
            value={formData.clientId}
            onChange={(event) => handleInputChange('clientId', event.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {clientName(client)} - {client.accountNumber}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Amount (RWF) *">
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(event) => handleInputChange('amount', event.target.value)}
              placeholder="500000"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Purpose *">
            <input
              type="text"
              required
              value={formData.purpose}
              onChange={(event) => handleInputChange('purpose', event.target.value)}
              placeholder="Working capital for stock purchase"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={disburseDiffers}
              onChange={(e) => {
                setDisburseDiffers(e.target.checked)
                if (!e.target.checked) handleInputChange('disbursedAmount', '')
              }}
              className="h-4 w-4 rounded border-gray-300 text-[#36e07b] focus:ring-[#36e07b]"
            />
            <span className="text-sm font-medium text-gray-700">
              Amount disbursed differs from approved amount
            </span>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            {disburseDiffers && (
              <Field label="Disbursed Amount (RWF)">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.disbursedAmount}
                  onChange={(event) => handleInputChange('disbursedAmount', event.target.value)}
                  placeholder="e.g. 490000"
                  className={INPUT_CLASS}
                />
              </Field>
            )}
            <Field label="Disbursement Date">
              <input
                type="date"
                value={formData.disbursedAt}
                onChange={(event) => handleInputChange('disbursedAt', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        number="02"
        title="Loan Terms"
        description="Interest, duration, term dates, and disbursement timing."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Interest Rate / Month (%) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.interestRatePercentPerMonth}
              onChange={(event) =>
                handleInputChange('interestRatePercentPerMonth', event.target.value)
              }
              placeholder="2.5"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Term (Months) *">
            <input
              type="number"
              required
              min="1"
              step="1"
              value={formData.termInMonths}
              onChange={(event) => handleInputChange('termInMonths', event.target.value)}
              placeholder="12"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Term Start Date *">
            <input
              type="date"
              required
              value={formData.termStartDate}
              onChange={(event) => handleInputChange('termStartDate', event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Term End Date *">
            <input
              type="date"
              required
              value={formData.termEndDate}
              onChange={(event) => handleInputChange('termEndDate', event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Disbursement Within (Days) *">
            <input
              type="number"
              required
              min="0"
              step="1"
              value={formData.disbursementWithinDays}
              onChange={(event) => handleInputChange('disbursementWithinDays', event.target.value)}
              placeholder="3"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section
        number="03"
        title="Collateral & Relationships"
        description="Security details and optional related-party information."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Collateral Type *">
            <select
              required
              value={formData.collateralType}
              onChange={(event) => handleInputChange('collateralType', event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select collateral type</option>
              <option value="Land">Land</option>
              <option value="Building">Building</option>
              <option value="Movable collaterals">Movable collaterals</option>
              <option value="Cash collateral">Cash collateral</option>
              <option value="Other securities offered by the bank">Other securities offered by the bank</option>
            </select>
          </Field>
          <Field label="Collateral Estimated Value (RWF) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.collateralEstimatedValue}
              onChange={(event) =>
                handleInputChange('collateralEstimatedValue', event.target.value)
              }
              placeholder="4500000"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Collateral Location *">
          <input
            type="text"
            required
            value={formData.collateralLocation}
            onChange={(event) => handleInputChange('collateralLocation', event.target.value)}
            placeholder="Kigali - Gasabo"
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Spouse Name">
            <input
              type="text"
              value={formData.spouseName}
              onChange={(event) => handleInputChange('spouseName', event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-900">Guarantor Info</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Name">
              <input
                type="text"
                value={guarantor.name}
                onChange={(event) =>
                  setGuarantor((prev) => ({ ...prev, name: event.target.value }))
                }
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={guarantor.phone}
                onChange={(event) =>
                  setGuarantor((prev) => ({ ...prev, phone: event.target.value }))
                }
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Relationship">
              <input
                type="text"
                value={guarantor.relationship}
                onChange={(event) =>
                  setGuarantor((prev) => ({ ...prev, relationship: event.target.value }))
                }
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        number="04"
        title="Repayment Plan"
        description="Installment totals and the repayment schedule sent to the loan contract."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Installments Count *">
            <input
              type="number"
              required
              min="1"
              step="1"
              value={formData.repaymentInstallmentsCount}
              onChange={(event) =>
                handleInputChange('repaymentInstallmentsCount', event.target.value)
              }
              placeholder="12"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Amount Per Month (RWF) *">
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.repaymentAmountPerMonth}
              onChange={(event) =>
                handleInputChange('repaymentAmountPerMonth', event.target.value)
              }
              placeholder="100000"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Repayment Period (Months) *">
            <input
              type="number"
              required
              min="1"
              step="1"
              value={formData.repaymentPeriodMonths}
              onChange={(event) => handleInputChange('repaymentPeriodMonths', event.target.value)}
              placeholder="12"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Payment Day of Month *">
            <input
              type="number"
              required
              min="1"
              max="31"
              step="1"
              value={formData.paymentDayOfMonth}
              onChange={(event) => handleInputChange('paymentDayOfMonth', event.target.value)}
              placeholder="5"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">Repayment Schedule</p>
            <button
              type="button"
              onClick={addScheduleItem}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
            >
              + Add Installment
            </button>
          </div>

          <div className="space-y-3">
            {repaymentSchedule.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-gray-200 p-4 md:grid-cols-[80px_1fr_1fr_auto] md:items-end"
              >
                <div>
                  <p className="text-xs text-gray-400">No.</p>
                  <p className="mt-1 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                    {index + 1}
                  </p>
                </div>
                <Field label="Due Date *">
                  <input
                    type="date"
                    required
                    value={item.dueDate}
                    onChange={(event) =>
                      updateScheduleItem(index, 'dueDate', event.target.value)
                    }
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Amount (RWF) *">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={item.amount}
                    onChange={(event) =>
                      updateScheduleItem(index, 'amount', event.target.value)
                    }
                    placeholder="100000"
                    className={INPUT_CLASS}
                  />
                </Field>
                {repaymentSchedule.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScheduleItem(index)}
                    className="rounded-lg border border-red-100 px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:border-red-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        number="05"
        title="Fees & Penalties"
        description="Percentage-based fees applied during processing and repayment."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Loan Processing Fee (%) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.loanProcessingFeePercent}
              onChange={(event) =>
                handleInputChange('loanProcessingFeePercent', event.target.value)
              }
              placeholder="2"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Administrative Fee (%) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.administrativeFeePercent}
              onChange={(event) =>
                handleInputChange('administrativeFeePercent', event.target.value)
              }
              placeholder="1"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Loan Application Fee (%) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.loanApplicationFeePercent}
              onChange={(event) =>
                handleInputChange('loanApplicationFeePercent', event.target.value)
              }
              placeholder="0.5"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Early Repayment Fee (%) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.earlyRepaymentFeePercent}
              onChange={(event) =>
                handleInputChange('earlyRepaymentFeePercent', event.target.value)
              }
              placeholder="1.5"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Default Penalty Fee / Day (%) *">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.defaultPenaltyFeePercentPerDay}
              onChange={(event) =>
                handleInputChange('defaultPenaltyFeePercentPerDay', event.target.value)
              }
              placeholder="0.2"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section
        number="06"
        title="Notes & Documents"
        description="Optional officer notes and supporting loan documents."
      >
        <Field label="Comments">
          <textarea
            rows={3}
            value={formData.comments}
            onChange={(event) => handleInputChange('comments', event.target.value)}
            placeholder="Client has regular inflows."
            className={`${INPUT_CLASS} resize-none`}
          />
        </Field>

        <Field label="Supporting Documents">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className={FILE_INPUT_CLASS}
          />
        </Field>

        {fileError && <p className="text-sm text-red-600">{fileError}</p>}

        {documents.length > 0 && (
          <div className="space-y-3">
            {documents.map((document, index) => (
              <div key={`${document.name}-${index}`} className="rounded-2xl border border-gray-200 p-4">
                <input
                  type="text"
                  placeholder="Document label"
                  value={documentLabels[index] || ''}
                  onChange={(event) => {
                    const nextLabels = [...documentLabels]
                    nextLabels[index] = event.target.value
                    setDocumentLabels(nextLabels)
                  }}
                  className={INPUT_CLASS}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {document.name} ({(document.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={closeForm}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !!fileError}
          className="rounded-lg bg-[#36e07b] px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#1bcb68] disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  )

  return mode === 'page' ? (
    <div className="space-y-6 animate-fade-up bg-white">
      <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-6 lg:px-8">
        <p className="dashboard-kicker mb-2">New Application</p>
        <h1 className="dashboard-title">Apply for a Loan</h1>
        <p className="dashboard-subtitle mt-3 max-w-3xl">
          Capture the client request, loan terms, repayment plan, fees, collateral, and documents
          in one organized workflow.
        </p>
      </div>

      <div className="max-w-5xl rounded-[1.75rem] border border-gray-200 bg-white p-8">
        {content}
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
              New Application
            </p>
            <h3 className="text-xl font-bold text-gray-900">Apply for a Loan</h3>
          </div>
          <button
            type="button"
            onClick={closeForm}
            className="mt-1 text-lg leading-none text-gray-300 transition-colors hover:text-gray-600"
          >
            x
          </button>
        </div>
        {content}
      </div>
    </div>
  )
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[#36e07b] px-2 text-xs font-semibold tracking-[0.2em] text-[#36e07b]">
            {number}
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-900">{title}</p>
        </div>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}
