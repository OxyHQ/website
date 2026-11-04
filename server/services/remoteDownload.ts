import { readResponseBody, safeFetch, UpstreamError } from '@oxy.so/core/server';
import { DomainError } from '../utils/domainError.js';

/* ──────────────────────────────────────────────
 * Downloading a caller-supplied URL.
 *
 * `safeFetch` owns the SSRF defence — every redirect hop re-validated, the
 * connection pinned to the checked address, a deadline on the response
 * headers — and `readResponseBody` reads the body under a byte ceiling. This
 * adds one deadline over the WHOLE download, so a source that trickles bytes
 * forever cannot hold a request open.
 * ──────────────────────────────────────────── */

export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024; // 25 MiB
export const DOWNLOAD_TIMEOUT_MS = 30_000;

export interface DownloadedFile {
  buffer: Buffer;
  /** As the source declared it — informational only, never trusted for validation. */
  declaredContentType: string;
  finalUrl: string;
}

export async function downloadRemote(
  url: string,
  options: {
    maxBytes?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
    fetcher?: typeof safeFetch;
  } = {},
): Promise<DownloadedFile> {
  const maxBytes = options.maxBytes ?? MAX_DOWNLOAD_BYTES;
  const timeoutMs = options.timeoutMs ?? DOWNLOAD_TIMEOUT_MS;
  const startedAt = Date.now();
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;

  const result = await (options.fetcher ?? safeFetch)(url, { signal });
  if (result.status < 200 || result.status >= 300) {
    result.response.destroy();
    throw new UpstreamError(`Upstream returned ${result.status}`);
  }
  const declaredLength = Number(result.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    result.response.destroy();
    throw new DownloadTooLarge(maxBytes);
  }
  const rawContentType = result.headers['content-type'];
  const declaredContentType =
    (Array.isArray(rawContentType) ? rawContentType[0] : rawContentType) ??
    'application/octet-stream';

  // The caller cancelling, or the whole-download deadline passing, ends the
  // read: destroying the stream settles `readResponseBody` at once.
  const cancel = () => result.response.destroy();
  if (signal.aborted) {
    cancel();
    throw new UpstreamError('Download timed out or was cancelled');
  }
  signal.addEventListener('abort', cancel, { once: true });
  const body = await readResponseBody(result.response, {
    maxBytes,
    timeoutMs: Math.max(1, timeoutMs - (Date.now() - startedAt)),
  }).finally(() => signal.removeEventListener('abort', cancel));

  switch (body.kind) {
    case 'ok':
      return { buffer: body.body, declaredContentType, finalUrl: result.finalUrl };
    case 'too_large':
      throw new DownloadTooLarge(maxBytes);
    case 'timeout':
      throw new UpstreamError('Download timed out or was cancelled');
    case 'error':
      throw new UpstreamError(
        signal.aborted
          ? 'Download timed out or was cancelled'
          : `Stream error: ${body.error.message}`,
      );
  }
}

export class DownloadTooLarge extends DomainError {
  override name = 'DownloadTooLarge';
  constructor(readonly maxBytes: number) {
    super('too_large', `The file exceeds the ${Math.round(maxBytes / (1024 * 1024))} MiB limit`);
  }
}
