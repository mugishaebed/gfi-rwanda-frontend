function lastPathSegment(url: string): string | undefined {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    return segments[segments.length - 1]
  } catch {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '')
    const segments = path.split('/').filter(Boolean)
    return segments[segments.length - 1]
  }
}

function normalizeApiPath(baseUrl: string, path: string): string {
  const parsedPath = new URL(path.startsWith('/') ? path : `/${path}`, 'http://api.local')
  const segments = parsedPath.pathname.split('/').filter(Boolean)
  const baseLastSegment = lastPathSegment(baseUrl)
  const apiSegments =
    baseLastSegment && segments[0] === baseLastSegment ? segments.slice(1) : segments

  return `${apiSegments.join('/')}${parsedPath.search}${parsedPath.hash}`
}

export function buildApiUrl(baseUrl: string, path: string): string {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, '')
  const apiPath = normalizeApiPath(trimmedBaseUrl, path)

  if (!trimmedBaseUrl) {
    return apiPath ? `/${apiPath}` : ''
  }

  if (!apiPath) {
    return trimmedBaseUrl
  }

  try {
    return new URL(apiPath, `${trimmedBaseUrl}/`).toString()
  } catch {
    return `${trimmedBaseUrl}/${apiPath}`
  }
}
