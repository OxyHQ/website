import { expect, test } from 'bun:test'
import { onRequest } from '../functions/_middleware'

test('static assets retain their response while real edge activity publishes without a dashboard', async () => {
  const originalFetch = globalThis.fetch
  const reports: unknown[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith('/auth/service-token')) return Response.json({ token: 'fixture-token', expiresIn: 300 })
    reports.push(JSON.parse(String(init?.body)))
    return new Response(null, { status: 204 })
  }) as typeof fetch
  const pending: Promise<unknown>[] = []
  const response = new Response('original asset', { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' } })
  const request = new Request('https://oxy.so/assets/private-test-name.png')
  Object.defineProperty(request, 'cf', { value: { colo: 'MAD' } })
  try {
    const result = await onRequest({
      request,
      env: { OXY_EDGE_ACTIVITY_ENABLED: 'true', OXY_EDGE_ACTIVITY_API_KEY: 'fixture-key', OXY_EDGE_ACTIVITY_API_SECRET: 'fixture-secret' },
      next: async () => response,
      waitUntil: (promise: Promise<unknown>) => { pending.push(promise) },
    } as unknown as Parameters<typeof onRequest>[0])
    expect(result).toBe(response)
    expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000')
    expect(await result.text()).toBe('original asset')
    await Promise.all(pending)
    expect(reports).toEqual([[expect.objectContaining({ service: 'website', region: 'edge-mad', activityType: 'media', direction: 'inbound' }), expect.objectContaining({ direction: 'outbound' })]])
    expect(JSON.stringify(reports)).not.toContain('private-test-name')
    expect(JSON.stringify(reports)).not.toContain('fixture-secret')
  } finally { globalThis.fetch = originalFetch }
})
