const API_BASE = '/api'

export async function apiFetch<T>(path: string, options?: RequestInit & { locale?: string }): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // Append locale query param if provided
  let url = `${API_BASE}${path}`
  if (options?.locale) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}locale=${options.locale}`
  }

  const { locale: _, ...fetchOptions } = options ?? {} as any

  const res = await fetch(url, { ...fetchOptions, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
}

function getAuthToken(): string | null {
  try {
    // @oxyhq/auth stores the access token directly under this key
    return localStorage.getItem('oxy_access_token')
  } catch {
    return null
  }
}
