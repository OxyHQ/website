import type { OxyServices } from '@oxyhq/core'

export const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

let oxyServices: OxyServices | null = null

export function setOxyServices(oxy: OxyServices) {
  oxyServices = oxy
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = oxyServices ? oxyServices.getAccessToken() : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T>(path: string, options?: RequestInit & { locale?: string }): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  }

  let url = `${API_BASE}${path}`
  if (options?.locale) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}locale=${options.locale}`
  }

  const { locale: _locale, ...fetchOptions } = options ?? ({} as RequestInit & { locale?: string })
  void _locale

  const res = await fetch(url, { ...fetchOptions, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
}
