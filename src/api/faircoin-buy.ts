/**
 * Bridge service client for the web Buy-FAIR flow.
 *
 * Talks to the bridge orchestrator at https://bridge.fairco.in. The shape
 * mirrors FAIRWallet's native client (src/api/buy.ts) so any change to the
 * backend contract lands in both surfaces in a single pass.
 *
 * The base URL is overridable via a Vite env (`VITE_FAIRCOIN_BRIDGE_URL`) so
 * preview builds can point at staging without a recompile.
 */
const DEFAULT_BRIDGE_BASE_URL = 'https://bridge.fairco.in'

function getBridgeBaseUrl(): string {
  const override = (import.meta.env.VITE_FAIRCOIN_BRIDGE_URL as string | undefined) ?? ''
  return override.length > 0 ? override : DEFAULT_BRIDGE_BASE_URL
}

export type PaymentCurrency =
  | 'USDC_BASE'
  | 'ETH_BASE'
  | 'ETH_MAINNET'
  | 'BTC'
  | 'CARD'

export type BuyOrderStatus =
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_DETECTED'
  | 'SWAPPING'
  | 'BURNING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'FAILED'
  | 'EXPIRED'

export interface BuyQuoteRequest {
  /** FAIR amount as a decimal string (e.g. "100" or "12.5"). */
  fairAmount: string
  paymentCurrency: PaymentCurrency
  fairDestinationAddress: string
  /** Optional opaque per-install id; never PII. */
  userIdentifier?: string
}

export interface BuyQuoteResponse {
  id: string
  fairAmountSats: string
  fairDestinationAddress: string
  paymentCurrency: PaymentCurrency
  /** Crypto path: send funds here. Null for CARD. */
  paymentAddress: string | null
  /** Smallest-unit amount (microUSDC, wei, satoshi…). */
  paymentAmount: string
  /** Decimal-formatted user-facing amount, no trailing zeros. */
  paymentAmountFormatted: string
  paymentDecimals: number
  paymentSymbol: string
  paymentNetworkLabel: string
  /** CARD path: hosted Moonpay/Transak URL. Null for crypto. */
  cardPaymentUrl: string | null
  paymentExpiresAt: string
  estimatedDeliveryTime: string
  feeBreakdown: {
    uniswapBps: number
    bridgeBps: number
    slippageBufferBps: number
  }
}

export interface BuyStatusResponse {
  id: string
  status: BuyOrderStatus
  fairAmountSats: string
  fairDestinationAddress: string
  paymentCurrency: PaymentCurrency
  paymentAddress: string | null
  paymentAmount: string
  paymentExpiresAt: string
  paymentDetectedTxHash: string | null
  swapTxHash: string | null
  burnTxHash: string | null
  fairDeliveryTxId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

/**
 * A structured error from the bridge — carries the HTTP status and the
 * machine-readable `code` so UI can render inline hints (e.g. "coming soon"
 * for `currency_unavailable`, "too many requests" for `rate_limited`).
 */
export class BuyApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly extras: Readonly<Record<string, unknown>>
  constructor(
    message: string,
    status: number,
    code: string | null,
    extras: Readonly<Record<string, unknown>> = {},
  ) {
    super(message)
    this.name = 'BuyApiError'
    this.status = status
    this.code = code
    this.extras = extras
  }
}

interface BridgeZodIssue {
  path?: ReadonlyArray<string | number>
  message?: string
}

interface BridgeErrorBody {
  error?: string
  code?: string
  message?: string
  reason?: string
  minimumFair?: string
  maximumFair?: string
  /** Present on `error: 'invalid_request'` responses from the zod validator. */
  issues?: ReadonlyArray<BridgeZodIssue>
}

async function parseErrorBody(response: Response): Promise<BridgeErrorBody> {
  try {
    return (await response.json()) as BridgeErrorBody
  } catch {
    return {}
  }
}

function summariseZodIssues(issues: ReadonlyArray<BridgeZodIssue>): string {
  const parts = issues
    .map((issue) => {
      const field = issue.path?.[issue.path.length - 1]
      const fieldStr = typeof field === 'string' ? field : ''
      return fieldStr.length > 0 && issue.message
        ? `${fieldStr}: ${issue.message}`
        : (issue.message ?? '')
    })
    .filter((part) => part.length > 0)
  return parts.join('; ')
}

function toApiError(status: number, body: BridgeErrorBody): BuyApiError {
  // Bridge error envelope puts the machine-readable slug in either `code`
  // (newer endpoints) or `error` (older endpoints). Unify for callers.
  // Special-case zod field-validation responses so callers can show inline
  // hints — the bridge wraps these as `error: 'invalid_request'` plus an
  // `issues[]` array, which is otherwise indistinguishable from other 400s.
  const code = body.code ?? body.error ?? null
  let message =
    body.message ?? body.reason ?? body.error ?? `Bridge API error: ${status}`
  const extras: Record<string, unknown> = {}
  if (body.minimumFair) extras.minimumFair = body.minimumFair
  if (body.maximumFair) extras.maximumFair = body.maximumFair
  if (body.reason) extras.reason = body.reason
  if (body.issues && body.issues.length > 0) {
    const summary = summariseZodIssues(body.issues)
    if (summary.length > 0) message = summary
    extras.issues = body.issues
    // First-issue field path drives `field` so the form can highlight the
    // offending input (e.g. `fairDestinationAddress`).
    const firstField = body.issues[0]?.path?.[body.issues[0].path.length - 1]
    if (typeof firstField === 'string') extras.field = firstField
  }
  return new BuyApiError(message, status, code, extras)
}

async function bridgePost<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBridgeBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'network_error'
    throw new BuyApiError(message, 0, 'network_error')
  }
  if (!response.ok) {
    throw toApiError(response.status, await parseErrorBody(response))
  }
  return (await response.json()) as T
}

async function bridgeGet<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBridgeBaseUrl()}${path}`)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'network_error'
    throw new BuyApiError(message, 0, 'network_error')
  }
  if (!response.ok) {
    throw toApiError(response.status, await parseErrorBody(response))
  }
  return (await response.json()) as T
}

/**
 * Request a fresh buy quote. The bridge allocates a per-order payment
 * address (or a card-payment URL) and locks the price for the TTL window.
 */
export function requestBuyQuote(
  body: BuyQuoteRequest,
): Promise<BuyQuoteResponse> {
  return bridgePost<BuyQuoteResponse>('/api/buy/quote', body)
}

/**
 * Poll the lifecycle status of a buy order. Safe to call repeatedly.
 */
export function getBuyStatus(id: string): Promise<BuyStatusResponse> {
  return bridgeGet<BuyStatusResponse>(
    `/api/buy/status/${encodeURIComponent(id)}`,
  )
}

/**
 * Terminal statuses — the bridge will not emit further updates once the
 * order reaches one of these, so callers can stop polling.
 */
export const TERMINAL_BUY_STATUSES: ReadonlySet<BuyOrderStatus> = new Set<
  BuyOrderStatus
>(['DELIVERED', 'FAILED', 'EXPIRED'])
