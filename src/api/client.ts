import type { OxyServices, LinkedHttpClient } from '@oxy.so/core';

export const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api`;
let oxyServices: OxyServices | null = null;
let linked: LinkedHttpClient | null = null;

/** Bind the shared session; the linked transport is acquired only when a request needs it. */
export function setOxyServices(oxy: OxyServices) {
  if (oxyServices === oxy) return;
  linked?.dispose();
  linked = null;
  oxyServices = oxy;
}

export function releaseOxyServices(oxy: OxyServices) {
  if (oxyServices !== oxy) return;
  linked?.dispose();
  linked = null;
  oxyServices = null;
}

function backendClient(): LinkedHttpClient {
  if (!oxyServices)
    throw new Error('API client not initialized: setOxyServices() must run before apiFetch()');
  linked ??= oxyServices.createLinkedClient({ baseURL: API_BASE });
  return linked;
}

/** Private uploads/downloads use the same origin, session and refresh boundary as JSON calls. */
export function apiResponse(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return backendClient().fetch(input, init);
}

export function errorStatus(error: unknown): number | undefined {
  const cause = (error as { cause?: unknown } | null)?.cause;
  const status = (cause as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Public website reads remain anonymous when signed out; the server enforces private writes. */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { locale?: string },
): Promise<T> {
  const { locale, ...init } = options ?? {};
  let url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  if (locale) url += `${url.includes('?') ? '&' : '?'}locale=${encodeURIComponent(locale)}`;
  try {
    const response = await backendClient().fetchOptional(url, init);
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      if (response.ok) throw new Error(`API error: ${url} answered with a non-JSON body`);
    }
    if (!response.ok) {
      const message =
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
          ? body.error
          : `API error ${response.status}`;
      throw new Error(message, { cause: { status: response.status } });
    }
    return body as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    const message = (error as { message?: string } | null)?.message ?? String(error);
    throw new Error(message, { cause: error });
  }
}
