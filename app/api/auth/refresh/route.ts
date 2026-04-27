import type { NextRequest } from 'next/server'
import { refreshAccessToken } from '@/lib/api'

export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json()

  if (!refreshToken) {
    return Response.json({ error: 'Missing refresh token' }, { status: 400 })
  }

  const tokens = await refreshAccessToken(refreshToken).catch(() => null)
  if (!tokens) {
    return Response.json({ error: 'Token refresh failed' }, { status: 401 })
  }

  return Response.json(tokens)
}
