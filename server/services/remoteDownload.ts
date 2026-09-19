import { safeFetch, UpstreamError } from '@oxy.so/core/server'
import { DomainError } from '../utils/domainError.js'

/* ──────────────────────────────────────────────
 * Downloading a caller-supplied URL.
 *
 * `safeFetch` owns the SSRF defence — every redirect hop re-validated, the
 * connection pinned to the checked address, a deadline on the response
 * headers. This adds what it leaves to the caller: a byte ceiling on the body
 * and a deadline on the WHOLE download, so a source that trickles bytes
 * forever cannot hold a request open.
 * ──────────────────────────────────────────── */

export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024 // 25 MiB
export const DOWNLOAD_TIMEOUT_MS = 30_000

export interface DownloadedFile {
  buffer: Buffer
  /** As the source declared it — informational only, never trusted for validation. */
  declaredContentType: string
  finalUrl: string
}

export async function downloadRemote(
  url: string,
  options: { maxBytes?: number; timeoutMs?: number; signal?: AbortSignal; fetcher?: typeof safeFetch } = {},
): Promise<DownloadedFile> {
  const maxBytes = options.maxBytes ?? MAX_DOWNLOAD_BYTES
  const deadline = AbortSignal.timeout(options.timeoutMs ?? DOWNLOAD_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline

  const result = await (options.fetcher ?? safeFetch)(url, { signal })
  if (result.status < 200 || result.status >= 300) {
    result.response.destroy()
    throw new UpstreamError(`Upstream returned ${result.status}`)
  }
  const declaredLength = Number(result.headers['content-length'])
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    result.response.destroy()
    throw new DownloadTooLarge(maxBytes)
  }
  const rawContentType = result.headers['content-type']
  const declaredContentType = (Array.isArray(rawContentType) ? rawContentType[0] : rawContentType) ?? 'application/octet-stream'

  return new Promise<DownloadedFile>((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0
    const abort = () => {
      result.response.destroy()
      reject(new UpstreamError('Download timed out or was cancelled'))
    }
    if (signal.aborted) return abort()
    signal.addEventListener('abort', abort, { once: true })

    result.response.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > maxBytes) {
        signal.removeEventListener('abort', abort)
        result.response.destroy()
        reject(new DownloadTooLarge(maxBytes))
        return
      }
      chunks.push(chunk)
    })
    result.response.on('end', () => {
      signal.removeEventListener('abort', abort)
      resolve({ buffer: Buffer.concat(chunks), declaredContentType, finalUrl: result.finalUrl })
    })
    result.response.on('error', (err: Error) => {
      signal.removeEventListener('abort', abort)
      reject(new UpstreamError(`Stream error: ${err.message}`))
    })
  })
}

export class DownloadTooLarge extends DomainError {
  override name = 'DownloadTooLarge'
  constructor(readonly maxBytes: number) {
    super('too_large', `The file exceeds the ${Math.round(maxBytes / (1024 * 1024))} MiB limit`)
  }
}
