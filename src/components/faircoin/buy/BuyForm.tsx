/**
 * BuyForm — the interactive Buy-FAIR flow for the website.
 *
 * State machine (derived from `quoteId` + `quote` + `statusQuery.data`):
 *   1. ENTRY        — user sets amount, destination, payment method
 *   2. AWAITING     — quote exists, waiting for on-chain payment detection
 *   3. PROCESSING   — payment detected; swap → burn → deliver
 *   4. DELIVERED    — FAIR landed; show tx link + buy-more / done
 *   5. FAILED | EXPIRED — terminal error, offer regenerate
 *
 * The flow intentionally avoids `useEffect`. Render-time derived state picks
 * the current step from the query data, and the countdown is computed on
 * demand from `now` — we use a single small `useSyncExternalStore` tick
 * (see `./useWallClockSecond`) rather than an effect + setInterval.
 */
import { useCallback, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import Button from '../../ui/Button'
import {
  BuyApiError,
  type BuyOrderStatus,
  type BuyQuoteResponse,
  type BuyStatusResponse,
  type PaymentCurrency,
} from '../../../api/faircoin-buy'
import {
  useFaircoinBuyQuote,
  useFaircoinBuyStatus,
} from '../../../hooks/use-faircoin-buy'
import { validateAmount, isValidFairAddress } from './validate'
import { useWallClockSecond } from './useWallClockSecond'

const FAIRWALLET_RELEASES_URL =
  'https://github.com/FairCoinOfficial/FAIRWallet/releases'
const FAIR_EXPLORER_BASE = 'https://explorer.fairco.in'

// Per bridge config (BUY_MIN_FAIR / BUY_MAX_FAIR). Mirrored here for UX —
// the server is still the source of truth and will reject out-of-bounds
// amounts with `code: 'below_minimum' | 'above_maximum'`.
const BUY_BOUNDS = { min: 1, max: 1000 } as const

const COPY_FLASH_MS = 1_500

interface PaymentOptionDef {
  currency: PaymentCurrency
  label: string
  description: string
  recommended?: boolean
  /**
   * When true, the option renders as a greyed-out "coming soon" row. The
   * bridge currently rejects every non-USDC currency with either
   * `currency_unavailable` or `card_not_configured`, so we surface that
   * inline here rather than blocking with a 503 after the user picks it.
   */
  comingSoon?: boolean
}

const PAYMENT_OPTIONS: readonly PaymentOptionDef[] = [
  {
    currency: 'USDC_BASE',
    label: 'USDC on Base',
    description: 'Lowest fees, settles in ~2 minutes',
    recommended: true,
  },
  {
    currency: 'ETH_BASE',
    label: 'ETH on Base',
    description: 'Coming soon — ETH → USDC routing in development',
    comingSoon: true,
  },
  {
    currency: 'BTC',
    label: 'Bitcoin',
    description: 'Coming soon — BTC deposit addresses pending',
    comingSoon: true,
  },
  {
    currency: 'CARD',
    label: 'Card · Apple Pay · Google Pay',
    description: 'Coming soon — business KYC in progress',
    comingSoon: true,
  },
]

type Step =
  | { kind: 'ENTRY' }
  | { kind: 'PAYMENT'; quote: BuyQuoteResponse }

/**
 * Top-level interactive flow. Holds the step state machine; all presentation
 * is delegated to the inline section components below.
 */
export default function BuyForm() {
  const [step, setStep] = useState<Step>({ kind: 'ENTRY' })
  const quoteMutation = useFaircoinBuyQuote()

  const handleQuoteIssued = useCallback((quote: BuyQuoteResponse) => {
    setStep({ kind: 'PAYMENT', quote })
  }, [])

  const handleReset = useCallback(() => {
    quoteMutation.reset()
    setStep({ kind: 'ENTRY' })
  }, [quoteMutation])

  if (step.kind === 'PAYMENT') {
    return (
      <PaymentSection
        quote={step.quote}
        onStartOver={handleReset}
      />
    )
  }

  return (
    <EntrySection
      mutation={quoteMutation}
      onQuoteIssued={handleQuoteIssued}
    />
  )
}

// ── Step 1 — Entry ───────────────────────────────────────────────────────

interface EntrySectionProps {
  mutation: ReturnType<typeof useFaircoinBuyQuote>
  onQuoteIssued: (quote: BuyQuoteResponse) => void
}

function EntrySection({ mutation, onQuoteIssued }: EntrySectionProps) {
  const [amount, setAmount] = useState('10')
  const [address, setAddress] = useState('')
  const [currency, setCurrency] = useState<PaymentCurrency>('USDC_BASE')
  const [touched, setTouched] = useState({ amount: false, address: false })

  const amountCheck = useMemo(
    () => validateAmount(amount, BUY_BOUNDS),
    [amount],
  )
  const addressLooksValid = useMemo(
    () => isValidFairAddress(address.trim()),
    [address],
  )

  const amountError = !amountCheck.ok && touched.amount
    ? describeAmountError(amountCheck.reason)
    : null
  const addressError =
    touched.address && address.trim().length > 0 && !addressLooksValid
      ? 'Enter a valid FairCoin address (starts with F, 26–35 base58 characters).'
      : null

  const canSubmit =
    amountCheck.ok && addressLooksValid && currency === 'USDC_BASE' &&
    !mutation.isPending

  const submissionError = mutation.isError
    ? describeQuoteError(mutation.error, address.trim())
    : null

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setTouched({ amount: true, address: true })
      if (!amountCheck.ok || !addressLooksValid || currency !== 'USDC_BASE') {
        return
      }
      mutation.mutate(
        {
          fairAmount: amount.trim(),
          paymentCurrency: currency,
          fairDestinationAddress: address.trim(),
        },
        { onSuccess: onQuoteIssued },
      )
    },
    [amount, address, currency, amountCheck, addressLooksValid, mutation, onQuoteIssued],
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left column: form fields */}
      <div className="card flex flex-col gap-5 border border-primary/30 bg-surface">
        <div className="flex flex-col gap-1">
          <span className="mono-tag text-xs text-primary">[ Step 1 ]</span>
          <h2 className="type-md text-foreground">Enter amount &amp; address</h2>
        </div>

        {/* Amount field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="buy-amount"
            className="text-sm font-semibold text-foreground"
          >
            How much FAIR do you want?
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-base text-muted-foreground">
              FAIR
            </span>
            <input
              id="buy-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
              className="w-full rounded-xl border border-border bg-background py-3 pl-16 pr-4 text-right text-xl font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Min {BUY_BOUNDS.min} · Max {BUY_BOUNDS.max.toLocaleString()} FAIR
            </span>
            {amountError ? (
              <span className="text-xs text-red-400">{amountError}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {['10', '25', '50', '100'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  amount === preset
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Address field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="buy-address"
            className="text-sm font-semibold text-foreground"
          >
            Your FairCoin address
          </label>
          <div className="relative flex items-center">
            <Wallet
              aria-hidden
              className="absolute left-4 h-4 w-4 text-muted-foreground"
            />
            <input
              id="buy-address"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="FErMgtiwoX4zrmUi5MHY7iZ2qij32ckdDg"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Need a wallet?{' '}
              <a
                href={FAIRWALLET_RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              >
                Download FAIRWallet
              </a>
            </span>
            {addressError ? (
              <span className="text-xs text-red-400">{addressError}</span>
            ) : null}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-2 flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="w-full justify-center"
          >
            {mutation.isPending ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Requesting quote…
              </>
            ) : (
              <>
                Get payment instructions
                <ArrowRight aria-hidden className="h-4 w-4" />
              </>
            )}
          </Button>
          {submissionError ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertTriangle
                aria-hidden
                className="mt-0.5 h-4 w-4 flex-shrink-0"
              />
              <span>{submissionError}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right column: payment method picker */}
      <div className="card flex flex-col gap-4 border border-border bg-surface">
        <div className="flex flex-col gap-1">
          <span className="mono-tag text-xs text-muted-foreground">
            [ Payment method ]
          </span>
          <h2 className="type-md text-foreground">How you&rsquo;ll pay</h2>
        </div>
        <div className="flex flex-col gap-2">
          {PAYMENT_OPTIONS.map((option) => (
            <PaymentOption
              key={option.currency}
              option={option}
              selected={currency === option.currency}
              onSelect={() => {
                if (!option.comingSoon) setCurrency(option.currency)
              }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          USDC payments route through Uniswap v3 on Base to acquire WFAIR, then
          the bridge burns WFAIR and releases native FAIR to your wallet on the
          FairCoin chain. End-to-end in about 2 minutes.
        </p>
      </div>
    </form>
  )
}

interface PaymentOptionProps {
  option: PaymentOptionDef
  selected: boolean
  onSelect: () => void
}

function PaymentOption({ option, selected, onSelect }: PaymentOptionProps) {
  const disabled = option.comingSoon === true
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-background hover:border-primary/40'
      } ${disabled ? 'cursor-not-allowed opacity-60 hover:border-border' : ''}`}
    >
      <span
        aria-hidden
        className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? 'border-primary'
            : disabled
              ? 'border-border'
              : 'border-muted-foreground'
        }`}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {option.label}
          </span>
          {option.recommended ? (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Recommended
            </span>
          ) : null}
          {option.comingSoon ? (
            <span className="rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Coming soon
            </span>
          ) : null}
        </span>
        <span className="text-xs text-muted-foreground">
          {option.description}
        </span>
      </span>
    </button>
  )
}

// ── Step 2 + 3 — Payment + status ────────────────────────────────────────

interface PaymentSectionProps {
  quote: BuyQuoteResponse
  onStartOver: () => void
}

function PaymentSection({ quote, onStartOver }: PaymentSectionProps) {
  // Poll the order status. The hook stops polling automatically on a terminal
  // status; no cleanup logic needed here.
  const statusQuery = useFaircoinBuyStatus(quote.id)
  const status = statusQuery.data ?? null
  const effectiveStatus: BuyOrderStatus = status?.status ?? 'AWAITING_PAYMENT'

  // Wall clock second-tick for the countdown — a single-instance external
  // store; React re-renders whichever components subscribe, no effect churn.
  const nowSeconds = useWallClockSecond()
  const expiresAtSeconds = useMemo(
    () => Math.floor(new Date(quote.paymentExpiresAt).getTime() / 1000),
    [quote.paymentExpiresAt],
  )
  const secondsRemaining = Math.max(0, expiresAtSeconds - nowSeconds)

  // Only suggest "request new quote" if the backend has actually expired OR
  // the countdown ran out AND the payment hasn't been detected yet (users who
  // paid 2 seconds before expiry still need a success path).
  const paymentNotStarted = effectiveStatus === 'AWAITING_PAYMENT'
  const quoteExpired =
    effectiveStatus === 'EXPIRED' ||
    (paymentNotStarted && secondsRemaining <= 0)

  // Delivered — the flow is complete, show the success card.
  if (effectiveStatus === 'DELIVERED' && status) {
    return <SuccessCard status={status} onStartOver={onStartOver} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* QR + address */}
      <div className="card flex flex-col gap-5 border border-primary/30 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="mono-tag text-xs text-primary">[ Step 2 ]</span>
            <h2 className="type-md text-foreground">Send payment</h2>
          </div>
          {paymentNotStarted && !quoteExpired ? (
            <CountdownPill secondsRemaining={secondsRemaining} />
          ) : null}
        </div>

        {quote.paymentAddress ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-4">
              <QRCodeSVG
                value={quote.paymentAddress}
                size={220}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
                marginSize={0}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Scan with any wallet that holds {quote.paymentSymbol} on{' '}
              {quote.paymentNetworkLabel}.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <CopyableRow
            label={`Send exactly (${quote.paymentSymbol})`}
            value={`${quote.paymentAmountFormatted} ${quote.paymentSymbol}`}
            copyValue={quote.paymentAmountFormatted}
            monospace
            emphasise
          />
          {quote.paymentAddress ? (
            <CopyableRow
              label={`Payment address (${quote.paymentNetworkLabel})`}
              value={quote.paymentAddress}
              copyValue={quote.paymentAddress}
              monospace
            />
          ) : null}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{quote.paymentSymbol}</strong> on{' '}
            <strong>{quote.paymentNetworkLabel}</strong> only. Sending from a
            different network (e.g. Ethereum mainnet) will lose your funds —
            the bridge cannot recover cross-network transfers.
          </span>
        </div>
      </div>

      {/* Status + progress */}
      <div className="card flex flex-col gap-4 border border-border bg-surface">
        <div className="flex flex-col gap-1">
          <span className="mono-tag text-xs text-muted-foreground">
            [ Step 3 ]
          </span>
          <h2 className="type-md text-foreground">Bridge status</h2>
        </div>

        <StatusCard
          status={effectiveStatus}
          errorMessage={status?.errorMessage ?? null}
          quoteExpired={quoteExpired}
        />

        <StatusTimeline status={effectiveStatus} />

        {statusQuery.isError && statusQuery.failureCount > 2 ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
            Reconnecting to bridge…
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2">
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            Destination:{' '}
            <span className="font-mono text-foreground">
              {quote.fairDestinationAddress}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={onStartOver}
            className="w-full justify-center"
          >
            <RefreshCw aria-hidden className="h-4 w-4" />
            {quoteExpired || effectiveStatus === 'FAILED'
              ? 'Request a new quote'
              : 'Start over'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface StatusCardProps {
  status: BuyOrderStatus
  errorMessage: string | null
  quoteExpired: boolean
}

function StatusCard({ status, errorMessage, quoteExpired }: StatusCardProps) {
  const effectiveStatus: BuyOrderStatus =
    quoteExpired && status === 'AWAITING_PAYMENT' ? 'EXPIRED' : status
  const visual = describeStatus(effectiveStatus, errorMessage)
  const Icon = visual.icon
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${visual.tone}`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
        {visual.spin ? (
          <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
        ) : (
          <Icon aria-hidden className="h-5 w-5" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground">{visual.title}</p>
        <p className="text-xs text-muted-foreground">{visual.subtitle}</p>
      </div>
    </div>
  )
}

const TIMELINE_STEPS: ReadonlyArray<{
  key: BuyOrderStatus
  label: string
}> = [
  { key: 'AWAITING_PAYMENT', label: 'Awaiting payment' },
  { key: 'PAYMENT_DETECTED', label: 'Payment detected' },
  { key: 'SWAPPING', label: 'Acquiring WFAIR' },
  { key: 'BURNING', label: 'Cross-chain transfer' },
  { key: 'DELIVERING', label: 'Delivering FAIR' },
  { key: 'DELIVERED', label: 'Delivered' },
]

function StatusTimeline({ status }: { status: BuyOrderStatus }) {
  const index = TIMELINE_STEPS.findIndex((s) => s.key === status)
  const currentIndex = index === -1 ? 0 : index
  return (
    <ol className="flex flex-col gap-2">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <li key={step.key} className="flex items-center gap-3 text-xs">
            <span
              aria-hidden
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                done
                  ? 'border-primary bg-primary text-background'
                  : active
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {done ? <CheckCircle2 className="h-3 w-3" /> : null}
            </span>
            <span
              className={
                active
                  ? 'text-foreground'
                  : done
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/60'
              }
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

interface CopyableRowProps {
  label: string
  value: string
  copyValue: string
  monospace?: boolean
  emphasise?: boolean
}

function CopyableRow({
  label,
  value,
  copyValue,
  monospace,
  emphasise,
}: CopyableRowProps) {
  const [flash, setFlash] = useState(false)
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue)
      setFlash(true)
      window.setTimeout(() => setFlash(false), COPY_FLASH_MS)
    } catch {
      // Clipboard denied — fall back to select-all is handled by user.
    }
  }, [copyValue])
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 break-all text-foreground ${
            monospace ? 'font-mono text-xs' : ''
          } ${emphasise ? 'text-lg font-semibold' : 'text-sm'}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
        >
          {flash ? (
            <CheckCircle2 aria-hidden className="h-4 w-4" />
          ) : (
            <Copy aria-hidden className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

interface CountdownPillProps {
  secondsRemaining: number
}

function CountdownPill({ secondsRemaining }: CountdownPillProps) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const warn = secondsRemaining < 60
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        warn
          ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
          : 'border-border bg-background text-muted-foreground'
      }`}
    >
      <Clock aria-hidden className="h-3 w-3" />
      {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  )
}

// ── Step 4 — Success ─────────────────────────────────────────────────────

function SuccessCard({
  status,
  onStartOver,
}: {
  status: BuyStatusResponse
  onStartOver: () => void
}) {
  const fairAmount = useMemo(
    () => satsToFair(status.fairAmountSats),
    [status.fairAmountSats],
  )
  const txUrl = status.fairDeliveryTxId
    ? `${FAIR_EXPLORER_BASE}/tx/${encodeURIComponent(status.fairDeliveryTxId)}`
    : null
  return (
    <div className="card flex flex-col items-center gap-5 border border-primary/40 bg-surface text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
        <CheckCircle2 aria-hidden className="h-9 w-9 text-primary" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="type-md text-foreground">FAIR delivered!</h2>
        <p className="text-sm text-muted-foreground">
          {fairAmount} FAIR sent to{' '}
          <span className="font-mono text-foreground">
            {status.fairDestinationAddress}
          </span>
        </p>
      </div>
      {status.fairDeliveryTxId ? (
        <div className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            FairCoin transaction
          </span>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
            {status.fairDeliveryTxId}
          </p>
        </div>
      ) : null}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        {txUrl ? (
          <Button href={txUrl} target="_blank" rel="noopener noreferrer">
            View on explorer
            <ExternalLink aria-hidden className="h-4 w-4" />
          </Button>
        ) : null}
        <Button variant="outline" onClick={onStartOver}>
          Buy more FAIR
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

interface StatusVisual {
  title: string
  subtitle: string
  icon: typeof CheckCircle2
  spin: boolean
  tone: string
}

function describeStatus(
  status: BuyOrderStatus,
  errorMessage: string | null,
): StatusVisual {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return {
        title: 'Waiting for payment',
        subtitle:
          'Send the exact amount above. Most payments confirm in about 30 seconds.',
        icon: Clock,
        spin: false,
        tone: 'border-border bg-background',
      }
    case 'PAYMENT_DETECTED':
      return {
        title: 'Payment received',
        subtitle: 'Starting the cross-chain transfer…',
        icon: Loader2,
        spin: true,
        tone: 'border-primary/40 bg-primary/10',
      }
    case 'SWAPPING':
      return {
        title: 'Acquiring WFAIR',
        subtitle: 'Routing USDC through Uniswap v3 on Base.',
        icon: Loader2,
        spin: true,
        tone: 'border-primary/40 bg-primary/10',
      }
    case 'BURNING':
      return {
        title: 'Initiating cross-chain transfer',
        subtitle: 'Burning WFAIR on Base so native FAIR can be released.',
        icon: Loader2,
        spin: true,
        tone: 'border-primary/40 bg-primary/10',
      }
    case 'DELIVERING':
      return {
        title: 'Sending FAIR to your wallet',
        subtitle: 'Broadcasting the FairCoin payout transaction.',
        icon: Loader2,
        spin: true,
        tone: 'border-primary/40 bg-primary/10',
      }
    case 'DELIVERED':
      return {
        title: 'Delivered',
        subtitle: 'FAIR has landed in your wallet.',
        icon: CheckCircle2,
        spin: false,
        tone: 'border-primary/40 bg-primary/10',
      }
    case 'EXPIRED':
      return {
        title: 'Quote expired',
        subtitle:
          'No payment was detected in the TTL window. Request a fresh quote to continue.',
        icon: Clock,
        spin: false,
        tone: 'border-yellow-500/30 bg-yellow-500/10',
      }
    case 'FAILED':
      return {
        title: 'Order failed',
        subtitle:
          errorMessage ??
          'The bridge could not complete the transfer. Please start a new order.',
        icon: AlertTriangle,
        spin: false,
        tone: 'border-red-500/30 bg-red-500/10',
      }
  }
}

function describeAmountError(
  reason: 'empty' | 'malformed' | 'below_min' | 'above_max',
): string {
  switch (reason) {
    case 'empty':
      return 'Enter an amount'
    case 'malformed':
      return 'Use up to 8 decimal places'
    case 'below_min':
      return `Minimum ${BUY_BOUNDS.min} FAIR`
    case 'above_max':
      return `Maximum ${BUY_BOUNDS.max.toLocaleString()} FAIR`
  }
}

function describeQuoteError(err: unknown, _address: string): string {
  if (err instanceof BuyApiError) {
    // Zod field-level rejection (the bridge couldn't even parse the request)
    // — show the first issue inline so the user knows which field is wrong.
    if (err.code === 'invalid_request') {
      const field = err.extras.field
      if (field === 'fairDestinationAddress') {
        return 'That FairCoin address looks malformed. Check for typos and try again.'
      }
      if (field === 'fairAmount') {
        return 'That amount is not a valid number. Use up to 8 decimal places.'
      }
      if (field === 'paymentCurrency') {
        return 'That payment method is not supported yet.'
      }
      return err.message
    }
    switch (err.code) {
      case 'rate_limited':
        return 'Too many requests. Please try again in a minute.'
      case 'invalid_fair_destination':
        return 'That FairCoin address was rejected by the bridge. Double-check it and try again.'
      case 'below_minimum': {
        const min = err.extras.minimumFair
        return typeof min === 'string'
          ? `Amount is below the minimum of ${min} FAIR.`
          : 'Amount is below the minimum.'
      }
      case 'above_maximum': {
        const max = err.extras.maximumFair
        return typeof max === 'string'
          ? `Amount is above the maximum of ${max} FAIR.`
          : 'Amount is above the maximum.'
      }
      case 'currency_unavailable':
        return 'That payment method is not available yet. Please use USDC on Base.'
      case 'card_not_configured':
        return 'Card payments are coming soon. Please use USDC on Base for now.'
      case 'pool_quote_failed':
        return 'The WFAIR pool quote is temporarily unavailable. Try again in a few seconds.'
      case 'address_allocation_failed':
        return 'The bridge could not allocate a payment address. Please try again shortly.'
      case 'network_error':
        return 'Could not reach the bridge. Check your connection and try again.'
      default:
        return err.message.length > 0
          ? err.message
          : 'The bridge returned an error. Please try again.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Unexpected error. Please try again.'
}

function satsToFair(satsStr: string): string {
  try {
    const sats = BigInt(satsStr)
    const whole = sats / 100_000_000n
    const frac = sats % 100_000_000n
    if (frac === 0n) return whole.toString()
    const fracStr = frac
      .toString()
      .padStart(8, '0')
      .replace(/0+$/, '')
    return `${whole.toString()}.${fracStr}`
  } catch {
    return satsStr
  }
}
