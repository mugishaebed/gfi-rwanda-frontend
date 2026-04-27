'use server'

import { cookies } from 'next/headers'
import { COOKIE_ACCESS_TOKEN } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getToken(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  if (!token) throw new Error('Unauthorized')
  return token
}

async function reviewAction(path: string, note?: string): Promise<void> {
  const token = await getToken()

  const response = await fetch(`${API_URL}${path}`, {
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

export async function approveLoan(id: string, note?: string) {
  return reviewAction(`/loans/${id}/approve`, note)
}

export async function rejectLoan(id: string, note?: string) {
  return reviewAction(`/loans/${id}/reject`, note)
}

export async function approveRepayment(id: string, note?: string) {
  return reviewAction(`/repayments/${id}/approve`, note)
}

export async function rejectRepayment(id: string, note?: string) {
  return reviewAction(`/repayments/${id}/reject`, note)
}
