import type { OxyServices } from '@oxyhq/core'

const API_BASE = '/api'

let _oxyServices: OxyServices | null = null

export function initApiClient(oxyServices: OxyServices) {
  _oxyServices = oxyServices
}

export async function apiFetch<T>(path: string, options?: RequestInit & { locale?: string }): Promise<T> {
  const token = _oxyServices?.getAccessToken() ?? null
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
