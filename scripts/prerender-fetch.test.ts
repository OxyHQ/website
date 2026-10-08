import { expect, test } from 'bun:test'
import { fetchPrerender } from './prerender-fetch'

test('prerender fetch times out waiting for headers', async () => {
  const server = Bun.serve({ port: 0, fetch: () => new Promise<Response>(() => {}) })
  try {
    await expect(fetchPrerender(`http://127.0.0.1:${server.port}`, 50)).rejects.toThrow()
  } finally {
    server.stop(true)
  }
})

test('prerender fetch also times out on an unfinished JSON body', async () => {
  const server = Bun.serve({ port: 0, fetch: () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('{"items":[')) },
  }), { headers: { 'Content-Type': 'application/json' } }) })
  try {
    const read = async () => (await fetchPrerender(`http://127.0.0.1:${server.port}`, 100)).json()
    await expect(read()).rejects.toThrow()
  } finally {
    server.stop(true)
  }
})

test('prerender fetch preserves HTTP errors for the caller’s fallback', async () => {
  const server = Bun.serve({ port: 0, fetch: () => Response.json({ unavailable: true }, { status: 503 }) })
  try {
    const response = await fetchPrerender(`http://127.0.0.1:${server.port}`)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ unavailable: true })
  } finally {
    server.stop(true)
  }
})
