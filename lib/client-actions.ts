'use server'

import { cookies } from 'next/headers'
import { COOKIE_ACCESS_TOKEN } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export type FileTransfer = {
  buffer: ArrayBuffer
  name: string
  mimeType: string
}

async function getToken(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
  if (!token) throw new Error('Unauthorized')
  return token
}

export async function saveClient(
  type: 'INDIVIDUAL' | 'BUSINESS',
  textFields: Array<[string, string]>,
  fileTransfers: FileTransfer[],
  clientId?: string
): Promise<void> {
  const token = await getToken()

  const isUpdate = !!clientId
  const method = isUpdate ? 'PUT' : 'POST'
  const path = isUpdate
    ? `${type === 'INDIVIDUAL' ? 'individual' : 'business'}/${clientId}`
    : type === 'INDIVIDUAL' ? 'individual' : 'business'

  // Reconstruct FormData server-side from plain-serialisable primitives.
  // File objects cannot cross the server-action boundary, so we receive them
  // as ArrayBuffers and rebuild proper Blobs here before calling the backend.
  const out = new FormData()

  for (const [key, value] of textFields) {
    out.append(key, value)
  }

  for (const file of fileTransfers) {
    const blob = new Blob([file.buffer], { type: file.mimeType })
    out.append('documents', blob, file.name)
  }

  const response = await fetch(`${API_URL}/clients/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: out,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
}

export async function deleteClientAction(
  type: 'INDIVIDUAL' | 'BUSINESS',
  clientId: string
): Promise<void> {
  const token = await getToken()

  const path = type === 'INDIVIDUAL'
    ? `individual/${clientId}`
    : `business/${clientId}`

  const response = await fetch(`${API_URL}/clients/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
}
