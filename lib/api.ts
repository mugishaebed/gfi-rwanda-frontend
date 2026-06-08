import { buildApiUrl } from './api-url'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? API_URL

type Role = 'LOAN_OFFICER' | 'GENERAL_MANAGER'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...fetchOptions } = options

  const isClient = typeof window !== 'undefined'

  // Client-side calls route through the Next.js proxy so the server can
  // attach the httpOnly access-token cookie — never readable by browser JS.
  const url = isClient && !accessToken
    ? `/api/proxy${path}`
    : buildApiUrl(API_URL, path)

  const headers = new Headers(fetchOptions.headers)

  if (!isClient && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (!headers.has('Content-Type') && fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...fetchOptions, headers })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }
  return res.text() as unknown as Promise<T>
}

export async function refreshAccessToken(refreshToken: string) {
  return apiFetch<{ appAccessToken: string; refreshToken: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }
  )
}

export function getMicrosoftLoginUrl(role?: Role): string {
  if (!role) return '/auth/microsoft/login'
  return `/auth/microsoft/login?role=${role}`
}

export function getMicrosoftSignupUrl(role: Role): string {
  return `${AUTH_URL}/auth/microsoft/signup?role=${role}`
}
