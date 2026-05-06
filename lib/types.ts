export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RepaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LoanDocument {
  id: string
  filename: string
  originalFileName?: string
  mimeType?: string
  label?: string
  downloadUrl?: string
}

export interface StatusLog {
  id: string
  status: string
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
  individual?: { fullName: string }
  business?: { businessName: string }
}

export interface Loan {
  id: string
  amount: number
  outstandingBalance?: number
  totalRepaidAmount?: number
  purpose: string
  status: LoanStatus
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
  amountPaid: number
  paymentDate: string
  notes?: string
  status: RepaymentStatus
  approvedAt?: string
  createdAt: string
  updatedAt: string
  loan: {
    id: string
    amount: number
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
