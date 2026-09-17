import { describe, expect, mock, test } from 'bun:test'
import { PassThrough } from 'node:stream'
import type { IncomingMessage } from 'node:http'
import { SsrfRejection, UpstreamError, type safeFetch } from '@oxy.so/core/server'
import { classifyError } from '../mcp/results.js'

/* The real module, not the double the server suite installs for tools. */
const { downloadRemote, DownloadTooLarge } = await import(`./remoteDownload.ts?real=${Date.now()}`) as typeof import('./remoteDownload.js')

function fakeFetch(options: { status?: number; headers?: Record<string, string>; chunks?: Buffer[]; stallMs?: number }): typeof safeFetch {
  return mock(async () => {
    const stream = new PassThrough()
    const response = stream as unknown as IncomingMessage
    setTimeout(async () => {
      for (const chunk of options.chunks ?? []) {
        if (stream.destroyed) return
        stream.write(chunk)
        if (options.stallMs) await new Promise((resolve) => setTimeout(resolve, options.stallMs))
      }
      if (!stream.destroyed) stream.end()
    }, 0)
    return { response, status: options.status ?? 200, headers: options.headers ?? {}, finalUrl: 'https://img.test/x' }
  }) as unknown as typeof safeFetch
}

describe('downloadRemote', () => {
  test('returns the body of a successful response', async () => {
    const file = await downloadRemote('https://img.test/x', { fetcher: fakeFetch({ chunks: [Buffer.from('abc'), Buffer.from('def')] }) })
    expect(file.buffer.toString()).toBe('abcdef')
  })

  test('a declared length over the limit is refused before reading the body', async () => {
    const failure = downloadRemote('https://img.test/x', { maxBytes: 10, fetcher: fakeFetch({ headers: { 'content-length': '11' } }) })
    await expect(failure).rejects.toBeInstanceOf(DownloadTooLarge)
  })

  test('a body that grows past the limit is cut off', async () => {
    const failure = downloadRemote('https://img.test/x', { maxBytes: 5, fetcher: fakeFetch({ chunks: [Buffer.from('abcd'), Buffer.from('efgh')] }) })
    await expect(failure).rejects.toBeInstanceOf(DownloadTooLarge)
    expect(classifyError(await failure.catch((error) => error)).error.code).toBe('request_too_large')
  })

  test('a source that trickles past the whole-download deadline is abandoned', async () => {
    const failure = downloadRemote('https://img.test/x', { timeoutMs: 50, fetcher: fakeFetch({ chunks: Array.from({ length: 50 }, () => Buffer.from('a')), stallMs: 20 }) })
    await expect(failure).rejects.toBeInstanceOf(UpstreamError)
  })

  test('a non-2xx answer is an upstream error', async () => {
    await expect(downloadRemote('https://img.test/x', { fetcher: fakeFetch({ status: 404 }) })).rejects.toBeInstanceOf(UpstreamError)
  })

  test('the caller cancelling aborts the download', async () => {
    const controller = new AbortController()
    const failure = downloadRemote('https://img.test/x', { signal: controller.signal, fetcher: fakeFetch({ chunks: Array.from({ length: 50 }, () => Buffer.from('a')), stallMs: 20 }) })
    setTimeout(() => controller.abort(), 30)
    await expect(failure).rejects.toBeInstanceOf(UpstreamError)
  })

  test('the real safeFetch refuses private and metadata addresses', async () => {
    const failure = downloadRemote('http://127.0.0.1:9/secret')
    await expect(failure).rejects.toBeInstanceOf(SsrfRejection)
    expect(classifyError(await failure.catch((error) => error)).error.code).toBe('invalid_request')
    await expect(downloadRemote('http://169.254.169.254/latest/meta-data/')).rejects.toBeInstanceOf(SsrfRejection)
  })
})
