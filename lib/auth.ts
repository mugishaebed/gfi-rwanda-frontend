export type Role = 'LOAN_OFFICER' | 'GENERAL_MANAGER'

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: Role[]
}

export interface AuthResponse {
  appAccessToken: string
  refreshToken: string
  user: AuthUser
  action: 'login' | 'signup'
}

export interface JWTPayload {
  sub?: string
  email?: string
  name?: string
  roles?: Role[]
  exp?: number
  iat?: number
}

export function isRole(value: string | null | undefined): value is Role {
  return value === 'LOAN_OFFICER' || value === 'GENERAL_MANAGER'
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const [, payload] = token.split('.')
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JWTPayload
  } catch {
    return null
  }
}

export function getRoleFromToken(token: string): Role | null {
  return decodeJWT(token)?.roles?.find(isRole) ?? null
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload?.exp) return true
  return Date.now() >= payload.exp * 1000
}

export const COOKIE_ACCESS_TOKEN = 'appAccessToken'
export const COOKIE_REFRESH_TOKEN = 'refreshToken'
export const COOKIE_SELECTED_ROLE = 'selectedRole'

export const ROLE_HOME: Record<Role, string> = {
  LOAN_OFFICER: '/dashboard/loan-officer',
  GENERAL_MANAGER: '/dashboard/general-manager',
}
