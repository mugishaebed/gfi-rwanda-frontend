import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_ACCESS_TOKEN } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value

  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await params
  const search = request.nextUrl.search
  const backendUrl = `${API_URL}/${path.join('/')}${search}`

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${accessToken}`)

  const contentType = request.headers.get('content-type') ?? ''
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  let body: BodyInit | undefined
  if (hasBody) {
    // Always forward the original Content-Type (preserves multipart boundary)
    if (contentType) headers.set('content-type', contentType)
    // Read as raw bytes — avoids re-serialisation issues with FormData/files
    body = await request.arrayBuffer()
  }

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body,
    signal: request.signal,
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
}
