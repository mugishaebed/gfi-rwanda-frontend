export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RepaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LoanDocument {
  id: string
  filename: string
  label?: string
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
  purpose: string
  status: LoanStatus
  comments?: string
  guarantorInfo?: Record<string, string>
  repaymentTerms: RepaymentTerm[]
  activatedAt?: string
  createdAt: string
  updatedAt: string
  client: LoanClient
  user: { id: string; name: string; email: string }
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
