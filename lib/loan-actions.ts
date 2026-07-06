'use server'

import { cookies } from 'next/headers'
import { COOKIE_ACCESS_TOKEN } from './auth'
import { buildApiUrl } from './api-url'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getToken(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  if (!token) throw new Error('Unauthorized')
  return token
}

async function reviewAction(path: string, note?: string): Promise<void> {
  const token = await getToken()

  const response = await fetch(buildApiUrl(API_URL, path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note ? { note } : {}),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
}

interface ApprovalData {
  note?: string
  disbursedAmount?: number
  disbursedAt?: string
}

async function approvalAction(path: string, data: ApprovalData): Promise<void> {
  const token = await getToken()

  const response = await fetch(buildApiUrl(API_URL, path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
}

async function patchAction(path: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()

  const response = await fetch(buildApiUrl(API_URL, path), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
}

export async function approveLoan(id: string, note?: string, disbursedAmount?: number, disbursedAt?: string) {
  return approvalAction(`/loans/${id}/approve`, {
    note,
    disbursedAmount,
    disbursedAt,
  })
}

export async function rejectLoan(id: string, note?: string) {
  return reviewAction(`/loans/${id}/reject`, note)
}

export async function approveLoanByOfficer(id: string, note?: string) {
  return reviewAction(`/loans/${id}/officer-approve`, note)
}

export async function rejectLoanByOfficer(id: string, note?: string) {
  return reviewAction(`/loans/${id}/officer-reject`, note)
}

export async function approveRepayment(id: string, note?: string) {
  return reviewAction(`/repayments/${id}/approve`, note)
}

export async function rejectRepayment(id: string, note?: string) {
  return reviewAction(`/repayments/${id}/reject`, note)
}

// ── GM-only edit / soft-delete actions ──

export interface EditRepaymentData {
  amountPaid?: number
  principalPaid?: number
  interestPaid?: number
  paymentDate?: string
  note?: string
}

export async function editRepayment(id: string, data: EditRepaymentData) {
  return patchAction(`/repayments/${id}`, data as Record<string, unknown>)
}

export async function voidRepayment(id: string, note?: string) {
  return reviewAction(`/repayments/${id}/void`, note)
}

export async function editLoan(id: string, data: Record<string, unknown>) {
  return patchAction(`/loans/${id}`, data)
}

export async function cancelLoan(id: string, note?: string) {
  return reviewAction(`/loans/${id}/cancel`, note)
}
