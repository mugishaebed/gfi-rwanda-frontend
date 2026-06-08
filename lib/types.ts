export type LoanStatus =
  | 'PENDING'
  | 'LOAN_OFFICER_APPROVED'
  | 'LOAN_OFFICER_REJECTED'
  | 'APPROVED'
  | 'REJECTED'
export type LoanSource = 'CLIENT_ONLINE' | 'STAFF_MANUAL'
export type RepaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RepaymentSource = 'STAFF_MANUAL' | 'CLIENT_ONLINE'
export type PaymentProvider = 'MOBILE_MONEY'

export interface LoanDocument {
  id: string
  filename?: string
  originalFileName?: string
  mimeType?: string
  label?: string
  downloadUrl?: string
}

export interface StatusLog {
  id: string
  status?: string
  fromStatus?: LoanStatus
  toStatus?: LoanStatus
  note?: string
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}

export interface RepaymentTerm {
  dueDate: string
  amount: number
}

export interface RepaymentScheduleItem {
  installmentNo?: number
  dueDate: string
  amount: number
}

export interface RepaymentTermsDetail {
  currency?: string
  installmentsCount?: number
  amountPerInstallment?: number
  periodMonths?: number
  paymentDayOfMonth?: number
  schedule?: RepaymentScheduleItem[]
}

export interface LoanClient {
  id: string
  type: 'INDIVIDUAL' | 'BUSINESS'
  email: string
  accountNumber: string
  individual?: { fullName?: string } | null
  business?: { businessName?: string } | null
}

export interface Loan {
  id: string
  loanNumber?: string
  amount: number
  currency?: string
  outstandingBalance?: number
  totalRepaidAmount?: number
  purpose: string
  source?: LoanSource
  status: LoanStatus
  termsAccepted?: boolean
  termsVersion?: string
  disbursementMethod?: string
  interestRatePercentPerMonth?: number
  termInMonths?: number
  termStartDate?: string
  termEndDate?: string
  disbursementWithinDays?: number
  collateralType?: string
  collateralEstimatedValue?: number
  collateralLocation?: string
  repaymentInstallmentsCount?: number
  repaymentAmountPerMonth?: number
  repaymentPeriodMonths?: number
  paymentDayOfMonth?: number
  loanProcessingFeePercent?: number
  administrativeFeePercent?: number
  loanApplicationFeePercent?: number
  earlyRepaymentFeePercent?: number
  defaultPenaltyFeePercentPerDay?: number
  spouseName?: string
  comments?: string
  guarantorInfo?: Record<string, string | number>
  repaymentTerms?: RepaymentTerm[] | RepaymentTermsDetail
  activatedAt?: string
  createdAt: string
  updatedAt: string
  client: LoanClient
  user?: { id: string; name: string; email: string } | null
  statusLogs: StatusLog[]
  documents: LoanDocument[]
}

export interface LoansResponse {
  data: Loan[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface Repayment {
  id: string
  loanId?: string
  amountPaid: number
  paymentDate: string
  notes?: string | null
  source?: RepaymentSource
  paymentProvider?: PaymentProvider | null
  paymentReference?: string | null
  paymentPhoneNumber?: string | null
  status: RepaymentStatus
  approvedAt?: string | null
  createdAt: string
  updatedAt?: string
  loan: {
    id: string
    loanNumber?: string
    amount: number
    outstandingBalance?: number
    totalRepaidAmount?: number
    purpose: string
    client: LoanClient
  }
  user?: { id: string; name: string; email: string } | null
  statusLogs?: StatusLog[]
  documents?: LoanDocument[]
}

export interface RepaymentsResponse {
  data: Repayment[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}
