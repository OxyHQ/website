const API_BASE = '/api'

let getAccessToken: (() => Promise<string | null>) | null = null

export function setTokenGetter(getter: () => Promise<string | null>) {
  getAccessToken = getter
}

export async function apiFetch<T>(path: string, options?: RequestInit & { locale?: string }): Promise<T> {
  const token = getAccessToken ? await getAccessToken() : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

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
