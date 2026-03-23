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
  // @oxyhq/auth stores the token — we read it from the auth store
  try {
    const raw = localStorage.getItem('oxy-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.token ?? parsed?.token ?? null
  } catch {
    return null
  }
}
