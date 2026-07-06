'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Shareholder {
  name: string
  ownershipPercentage: number
}

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

interface FormData {
  type: 'INDIVIDUAL' | 'BUSINESS'
  email: string
  phoneNumber: string
  address: string
  fullName: string
  nationalId: string
  gender: string
  dateOfBirth: string
  nationality: string
  maritalStatus: string
  occupation: string
  employerName: string
  monthlyIncome: string
  bankName: string
  bankAccountNumber: string
  pep: boolean
  referenceName: string
  businessName: string
  registrationNumber: string
  businessType: 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'
  incorporationDate: string
  businessWebsite: string
  authorizedSignatory: string
  authorizedSignatoryDesignation: string
  annualRevenue: string
  businessShareholders: Shareholder[]
}

interface CreateClientFormProps {
  type: 'INDIVIDUAL' | 'BUSINESS'
  onClose?: () => void
  onSuccess?: () => void
  client?: Client | null
  mode?: 'modal' | 'page'
}

const INPUT_CLASS =
  'mt-1 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#36e07b]'

const CHECKBOX_CLASS =
  'h-4 w-4 rounded border border-gray-300 text-[#36e07b] focus:ring-[#36e07b]'

const RWANDA_PREFIX = '+250'

export default function CreateClientForm({
  type,
  onClose,
  onSuccess,
  client,
  mode = 'modal',
}: CreateClientFormProps) {
  const router = useRouter()
  const getInitialFormData = (client?: Client | null): FormData => {
    if (client) {
      return {
        type: client.type,
        email: client.email,
        phoneNumber: client.phoneNumber.startsWith(RWANDA_PREFIX)
          ? client.phoneNumber.slice(RWANDA_PREFIX.length)
          : client.phoneNumber,
        address: client.address,
        // Individual fields
        fullName: client.individual?.fullName || '',
        nationalId: client.individual?.nationalId || '',
        gender: client.individual?.gender || '',
        dateOfBirth: client.individual?.dateOfBirth
          ? client.individual.dateOfBirth.slice(0, 10)
          : '',
        nationality: client.individual?.nationality || '',
        maritalStatus: client.individual?.maritalStatus || '',
        occupation: client.individual?.occupation || '',
        employerName: client.individual?.employerName || '',
        monthlyIncome: String(client.individual?.monthlyIncome ?? ''),
        bankName: client.individual?.bankName || client.business?.bankName || '',
        bankAccountNumber: client.individual?.bankAccountNumber || client.business?.bankAccountNumber || '',
        pep: client.individual?.pep || client.business?.pep || false,
        referenceName: client.individual?.referenceName || '',
        // Business fields
        businessName: client.business?.businessName || '',
        registrationNumber: client.business?.registrationNumber || '',
        businessType: client.business?.businessType || 'SOLE_PROPRIETORSHIP',
        incorporationDate: client.business?.incorporationDate
          ? client.business.incorporationDate.slice(0, 10)
          : '',
        businessWebsite: client.business?.businessWebsite || '',
        authorizedSignatory: client.business?.authorizedSignatory || '',
        authorizedSignatoryDesignation: '',
        annualRevenue: String(client.business?.annualRevenue ?? ''),
        businessShareholders: client.business?.businessShareholders || [],
      }
    }
    return {
      type,
      email: '',
      phoneNumber: '',
      address: '',
      // Individual fields
      fullName: '',
      nationalId: '',
      gender: '',
      dateOfBirth: '',
      nationality: '',
      maritalStatus: '',
      occupation: '',
      employerName: '',
      monthlyIncome: '',
      bankName: '',
      bankAccountNumber: '',
      pep: false,
      referenceName: '',
      // Business fields
      businessName: '',
      registrationNumber: '',
      businessType: 'SOLE_PROPRIETORSHIP',
      incorporationDate: '',
      businessWebsite: '',
      authorizedSignatory: '',
      authorizedSignatoryDesignation: '',
      annualRevenue: '',
      businessShareholders: [] as Shareholder[],
    }
  }

  const [formData, setFormData] = useState<FormData>(getInitialFormData(client))
  const [documents, setDocuments] = useState<File[]>([])
  const [documentLabels, setDocumentLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fileError, setFileError] = useState<string>('')
  const [submitError, setSubmitError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError('')

    try {
      const isUpdate = !!client
      const path = isUpdate
        ? `${type === 'INDIVIDUAL' ? 'individual' : 'business'}/${client!.id}`
        : type === 'INDIVIDUAL' ? 'individual' : 'business'

      let response: Response

      if (isUpdate) {
        // PUT — JSON body, no file upload
        const body: Record<string, unknown> = {
          type,
          email: formData.email,
          phone: `${RWANDA_PREFIX}${formData.phoneNumber}`,
          address: formData.address,
          pep: formData.pep,
        }
        if (type === 'INDIVIDUAL') {
          if (formData.fullName) body.fullName = formData.fullName
          if (formData.nationalId) body.nationalId = formData.nationalId
          if (formData.gender) body.gender = formData.gender
          if (formData.dateOfBirth) body.dateOfBirth = new Date(formData.dateOfBirth).toISOString()
          if (formData.nationality) body.nationality = formData.nationality
          if (formData.maritalStatus) body.maritalStatus = formData.maritalStatus
          if (formData.occupation) body.occupation = formData.occupation
          if (formData.employerName) body.employerName = formData.employerName
          if (formData.monthlyIncome) body.monthlyIncome = formData.monthlyIncome
          if (formData.bankName) body.bankName = formData.bankName
          if (formData.bankAccountNumber) body.bankAccountNumber = formData.bankAccountNumber
          if (formData.referenceName) body.referenceName = formData.referenceName
        } else {
          if (formData.businessName) body.businessName = formData.businessName
          if (formData.registrationNumber) body.registrationNumber = formData.registrationNumber
          if (formData.businessType) body.businessType = formData.businessType
          if (formData.incorporationDate) body.incorporationDate = new Date(formData.incorporationDate).toISOString()
          if (formData.businessShareholders.length > 0) body.businessShareholders = formData.businessShareholders
          if (formData.businessWebsite) body.businessWebsite = formData.businessWebsite
          if (formData.bankName) body.bankName = formData.bankName
          if (formData.bankAccountNumber) body.bankAccountNumber = formData.bankAccountNumber
          if (formData.authorizedSignatory) body.authorizedSignatory = formData.authorizedSignatory
          if (formData.authorizedSignatoryDesignation) body.authorizedSignatoryDesignation = formData.authorizedSignatoryDesignation
          if (formData.annualRevenue) body.annualRevenue = formData.annualRevenue
        }
        response = await fetch(`/api/proxy/v1/clients/${path}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        // POST — multipart/form-data
        const fd = new FormData()
        fd.append('type', type)
        fd.append('email', formData.email)
        fd.append('phone', `${RWANDA_PREFIX}${formData.phoneNumber}`)
        fd.append('address', formData.address)
        fd.append('pep', formData.pep.toString())

        if (type === 'INDIVIDUAL') {
          if (formData.fullName) fd.append('fullName', formData.fullName)
          if (formData.nationalId) fd.append('nationalId', formData.nationalId)
          if (formData.gender) fd.append('gender', formData.gender)
          if (formData.dateOfBirth) fd.append('dateOfBirth', new Date(formData.dateOfBirth).toISOString())
          if (formData.nationality) fd.append('nationality', formData.nationality)
          if (formData.maritalStatus) fd.append('maritalStatus', formData.maritalStatus)
          if (formData.occupation) fd.append('occupation', formData.occupation)
          if (formData.employerName) fd.append('employerName', formData.employerName)
          if (formData.monthlyIncome) fd.append('monthlyIncome', formData.monthlyIncome)
          if (formData.bankName) fd.append('bankName', formData.bankName)
          if (formData.bankAccountNumber) fd.append('bankAccountNumber', formData.bankAccountNumber)
          if (formData.referenceName) fd.append('referenceName', formData.referenceName)
        } else {
          if (formData.businessName) fd.append('businessName', formData.businessName)
          if (formData.registrationNumber) fd.append('registrationNumber', formData.registrationNumber)
          if (formData.businessType) fd.append('businessType', formData.businessType)
          if (formData.incorporationDate) fd.append('incorporationDate', new Date(formData.incorporationDate).toISOString())
          if (formData.businessShareholders.length > 0) {
            fd.append('businessShareholders', JSON.stringify(formData.businessShareholders))
          }
          if (formData.businessWebsite) fd.append('businessWebsite', formData.businessWebsite)
          if (formData.bankName) fd.append('bankName', formData.bankName)
          if (formData.bankAccountNumber) fd.append('bankAccountNumber', formData.bankAccountNumber)
          if (formData.authorizedSignatory) fd.append('authorizedSignatory', formData.authorizedSignatory)
          if (formData.authorizedSignatoryDesignation) fd.append('authorizedSignatoryDesignation', formData.authorizedSignatoryDesignation)
          if (formData.annualRevenue) fd.append('annualRevenue', formData.annualRevenue)
        }

        documents.forEach((doc) => fd.append('documents', doc))
        if (documents.length > 0) {
          fd.append('documentLabels', JSON.stringify(documentLabels.map((label) => label || '')))
        }

        response = await fetch(`/api/proxy/v1/clients/${path}`, {
          method: 'POST',
          body: fd,
        })
      }

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }

      if (onSuccess) {
        onSuccess()
      } else if (mode === 'page') {
        router.push('/dashboard/loan-officer/clients')
      }
    } catch (error) {
      console.error('Failed to save client:', error)
      try {
        const parsed = JSON.parse((error as Error).message)
        const msg = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message
        setSubmitError(msg)
      } catch {
        setSubmitError((error as Error).message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setSubmitError('')
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addShareholder = () => {
    setFormData(prev => ({
      ...prev,
      businessShareholders: [...prev.businessShareholders, { name: '', ownershipPercentage: 0 }]
    }))
  }

  const updateShareholder = (index: number, field: keyof Shareholder, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      businessShareholders: prev.businessShareholders.map((sh, i) =>
        i === index ? { ...sh, [field]: value } : sh
      )
    }))
  }

  const removeShareholder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      businessShareholders: prev.businessShareholders.filter((_, i) => i !== index)
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate number of files
    if (files.length > 10) {
      setFileError('Maximum 10 files allowed')
      return
    }
    
    // Validate total size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > maxSize) {
      setFileError('Total file size cannot exceed 10MB')
      return
    }
    
    // Clear any previous error
    setFileError('')
    setDocuments(files)
    setDocumentLabels(new Array(files.length).fill(''))
  }

  const closeForm = () => {
    if (onClose) {
      onClose()
      return
    }
    if (mode === 'page') {
      router.push('/dashboard/loan-officer/clients')
    }
  }

  const headingKicker = client ? 'Edit Client' : 'New Client'
  const headingTitle = type === 'INDIVIDUAL' ? 'Individual Client' : 'Business Client'
  const headingDescription = client
    ? 'Update the client profile using organized sections to keep information clear and easy to review.'
    : 'Complete the client profile in grouped sections so personal, contact, business, and compliance details stay easy to manage.'

  const content = (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section
        number="01"
        title="Contact Details"
        description="Core communication details used across the client profile."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Email *">
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Phone Number *">
            <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors focus-within:border-[#36e07b]">
              <span className="inline-flex items-center border-r border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-500">
                {RWANDA_PREFIX}
              </span>
              <input
                type="tel"
                required
                inputMode="numeric"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="7XXXXXXXX"
                className="block w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
          </Field>
        </div>

        <Field label="Address *">
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
      </Section>

      {type === 'INDIVIDUAL' ? (
        <>
          <Section
            number="02"
            title="Personal Details"
            description="Identity and background information for the individual client."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full Name *">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="National ID *">
                <input
                  type="text"
                  required
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Gender *">
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Date of Birth *">
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Nationality">
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Marital Status">
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section
            number="03"
            title="Employment & Income"
            description="Financial profile details that support lending decisions."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Occupation">
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Employer Name">
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => handleInputChange('employerName', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Monthly Income">
                <input
                  type="text"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                  placeholder="e.g. 1500000 RWF"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Reference Name">
                <input
                  type="text"
                  value={formData.referenceName}
                  onChange={(e) => handleInputChange('referenceName', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </Section>
        </>
      ) : (
        <>
          <Section
            number="02"
            title="Business Details"
            description="Company identity and registration information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Business Name *">
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Registration Number *">
                <input
                  type="text"
                  required
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Business Type *">
                <select
                  required
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value as 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC')}
                  className={INPUT_CLASS}
                >
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="LLC">LLC</option>
                </select>
              </Field>
              <Field label="Incorporation Date *">
                <input
                  type="date"
                  required
                  value={formData.incorporationDate}
                  onChange={(e) => handleInputChange('incorporationDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Business Website">
                <input
                  type="url"
                  value={formData.businessWebsite}
                  onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Annual Revenue">
                <input
                  type="text"
                  value={formData.annualRevenue}
                  onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                  placeholder="e.g. 200000000 RWF"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </Section>

          <Section
            number="03"
            title="Business Signatory & Ownership"
            description="Authorized representation and shareholder details."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Authorized Signatory">
                <input
                  type="text"
                  value={formData.authorizedSignatory}
                  onChange={(e) => handleInputChange('authorizedSignatory', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Signatory Designation">
                <input
                  type="text"
                  value={formData.authorizedSignatoryDesignation}
                  onChange={(e) => handleInputChange('authorizedSignatoryDesignation', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Business Shareholders</p>
                  <p className="text-sm text-gray-500">List ownership distribution when applicable.</p>
                </div>
                <button
                  type="button"
                  onClick={addShareholder}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#36e07b] hover:text-gray-900"
                >
                  + Add Shareholder
                </button>
              </div>

              <div className="space-y-3">
                {formData.businessShareholders.map((shareholder: Shareholder, index: number) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-gray-200 p-4 md:grid-cols-[1fr_140px_auto] md:items-end">
                    <Field label="Name">
                      <input
                        type="text"
                        placeholder="Shareholder name"
                        value={shareholder.name}
                        onChange={(e) => updateShareholder(index, 'name', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Ownership %">
                      <input
                        type="number"
                        placeholder="0"
                        value={shareholder.ownershipPercentage}
                        onChange={(e) => updateShareholder(index, 'ownershipPercentage', parseFloat(e.target.value) || 0)}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => removeShareholder(index)}
                      className="rounded-lg border border-red-100 px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:border-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {formData.businessShareholders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
                    No shareholders added yet.
                  </div>
                )}
              </div>
            </div>
          </Section>
        </>
      )}

      <Section
        number="04"
        title="Banking & Compliance"
        description="Banking identifiers and compliance-related information."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Bank Name">
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Bank Account Number">
            <input
              type="text"
              value={formData.bankAccountNumber}
              onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={formData.pep}
            onChange={(e) => handleInputChange('pep', e.target.checked)}
            className={CHECKBOX_CLASS}
          />
          Politically Exposed Person (PEP)
        </label>
      </Section>

      <Section
        number="05"
        title="Supporting Documents"
        description="Attach client documents and optionally label each file."
      >
        <Field label="Documents (max 10 files, 10MB total)">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="mt-1 block w-full rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500"
          />
        </Field>

        {fileError && (
          <p className="mt-3 text-sm text-red-600">{fileError}</p>
        )}

        {documents.length > 0 && (
          <div className="mt-4 space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="rounded-2xl border border-gray-200 p-4">
                <input
                  type="text"
                  placeholder="Document label (optional)"
                  value={documentLabels[index] || ''}
                  onChange={(e) => {
                    const newLabels = [...documentLabels]
                    newLabels[index] = e.target.value
                    setDocumentLabels(newLabels)
                  }}
                  className={INPUT_CLASS}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {doc.name} ({(doc.size / 1024 / 1024).toFixed(2)} MB)
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
          {loading ? (client ? 'Updating…' : 'Creating…') : (client ? 'Update Client' : 'Create Client')}
        </button>
      </div>
    </form>
  )

  return (
    mode === 'page' ? (
      <div className="space-y-6 animate-fade-up bg-white">
        <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-6 lg:px-8">
          <p className="dashboard-kicker mb-2">{headingKicker}</p>
          <h1 className="dashboard-title">{headingTitle}</h1>
          <p className="dashboard-subtitle mt-3 max-w-3xl">{headingDescription}</p>
        </div>

        <div className="max-w-5xl rounded-[1.75rem] border border-gray-200 bg-white p-8">
          {content}
        </div>
      </div>
    ) : (
      <div
        onClick={() => onClose?.()}
        className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-end bg-gray-900/20 p-4 backdrop-blur-[2px] sm:p-6"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-slide-in-right max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5"
        >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b] mb-1">
              {headingKicker}
            </p>
            <h3 className="text-xl font-bold text-gray-900">{headingTitle}</h3>
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

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}
