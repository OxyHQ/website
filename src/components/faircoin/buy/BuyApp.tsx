/**
 * BuyApp — app-style FAIR purchase flow.
 *
 * Renders an `AppShell`-wrapped wizard with three logical steps:
 *   1. AMOUNT  — large amount input + payment method + destination address
 *   2. PAY     — QR + address + countdown + live status timeline
 *   3. DONE    — success screen with tx link + buy-more action
 *
 * The state machine is derived from `quoteId + status query.data` (no
 * `useEffect`), and the polling hook (`useFaircoinBuyStatus`) auto-stops at
 * terminal states. Step transitions slide horizontally via `StepTransition`
 * so moving amount → pay feels continuous (incoming slides in from the
 * right; back navigation reverses the direction).
 */
import { useCallback, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import AppShell from '../app/AppShell'
import StepTransition from '../app/StepTransition'
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
const BASESCAN_BASE = 'https://basescan.org'

// Mirrors bridge `BUY_MIN_FAIR / BUY_MAX_FAIR` for client-side hints. The
// server still rejects out-of-bounds amounts as the source of truth.
const BUY_BOUNDS = { min: 1, max: 1000 } as const

const PRESET_AMOUNTS = ['10', '25', '50', '100'] as const
// Coarse USD/FAIR estimate just for the inline conversion display below the
// amount input. Live pricing is server-side; this is purely cosmetic.
const COARSE_USD_PER_FAIR = 1.0

const COPY_FLASH_MS = 1_500

const STEPS = [
  { id: 'amount', label: 'Amount' },
  { id: 'pay', label: 'Pay' },
  { id: 'done', label: 'Done' },
] as const

interface PaymentOptionDef {
  currency: PaymentCurrency
  label: string
  hint: string
  comingSoon?: boolean
}

const PAYMENT_OPTIONS: readonly PaymentOptionDef[] = [
  { currency: 'USDC_BASE', label: 'USDC', hint: 'on Base' },
  { currency: 'ETH_BASE', label: 'ETH', hint: 'on Base · soon', comingSoon: true },
  { currency: 'BTC', label: 'BTC', hint: 'native · soon', comingSoon: true },
  { currency: 'CARD', label: 'Card', hint: 'Apple/Google Pay · soon', comingSoon: true },
]

type StageKind = 'amount' | 'pay' | 'done' | 'failed'

type Stage =
  | { kind: 'amount' }
  | { kind: 'pay'; quote: BuyQuoteResponse }
  | { kind: 'done'; status: BuyStatusResponse }
  | { kind: 'failed'; message: string | null }

interface ShellCopy {
  eyebrow: string
  title: string
  subtitle?: string
  currentStep: number
  footnote?: React.ReactNode
}

const SHELL_COPY: Record<StageKind, ShellCopy> = {
  amount: {
    eyebrow: 'Buy FAIR',
    title: 'Buy native FairCoin',
    subtitle: 'Pay in USDC on Base. Get FAIR delivered straight to your wallet.',
    currentStep: 0,
    footnote: (
      <>
        USDC on Base only. Sending from another network will lose your funds.{' '}
        <a
          href="https://github.com/FairCoinOfficial/faircoin-bridge"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          How the bridge works
        </a>
        .
      </>
    ),
  },
  pay: {
    eyebrow: 'Send payment',
    title: 'Send USDC to receive FAIR',
    subtitle: 'Your FAIR will arrive automatically once payment is detected.',
    currentStep: 1,
  },
  done: {
    eyebrow: 'Done',
    title: 'FAIR delivered',
    subtitle: 'Your wallet should reflect the new balance shortly.',
    currentStep: 2,
  },
  failed: {
    eyebrow: 'Order failed',
    title: 'Something went wrong',
    subtitle: 'The bridge could not complete the transfer.',
    currentStep: 1,
  },
}

export default function BuyApp() {
  const [stage, setStage] = useState<Stage>({ kind: 'amount' })
  const [direction, setDirection] = useState<1 | -1>(1)
  const quoteMutation = useFaircoinBuyQuote()

  const handleQuoteIssued = useCallback((quote: BuyQuoteResponse) => {
    setDirection(1)
    setStage({ kind: 'pay', quote })
  }, [])

  const handleReset = useCallback(() => {
    quoteMutation.reset()
    setDirection(-1)
    setStage({ kind: 'amount' })
  }, [quoteMutation])

  const copy = SHELL_COPY[stage.kind]

  return (
    <AppShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      steps={STEPS}
      currentStep={copy.currentStep}
      footnote={copy.footnote}
    >
      <StepTransition stepKey={stage.kind} direction={direction}>
        <BuyStage
          stage={stage}
          setStage={setStage}
          setDirection={setDirection}
          quoteMutation={quoteMutation}
          onQuoteIssued={handleQuoteIssued}
          onReset={handleReset}
        />
      </StepTransition>
    </AppShell>
  )
}

interface BuyStageProps {
  stage: Stage
  setStage: (s: Stage) => void
  setDirection: (d: 1 | -1) => void
  quoteMutation: ReturnType<typeof useFaircoinBuyQuote>
  onQuoteIssued: (quote: BuyQuoteResponse) => void
  onReset: () => void
}

function BuyStage({
  stage,
  setStage,
  setDirection,
  quoteMutation,
  onQuoteIssued,
  onReset,
}: BuyStageProps) {
  if (stage.kind === 'amount') {
    return <AmountStep mutation={quoteMutation} onQuoteIssued={onQuoteIssued} />
  }
  if (stage.kind === 'pay') {
    return (
      <PaymentStep
        quote={stage.quote}
        onAdvance={(status) => {
          setDirection(1)
          setStage({ kind: 'done', status })
        }}
        onFail={(message) => {
          setDirection(1)
          setStage({ kind: 'failed', message })
        }}
        onStartOver={onReset}
      />
    )
  }
  if (stage.kind === 'done') {
    return <SuccessStep status={stage.status} onStartOver={onReset} />
  }
  return <FailedStep message={stage.message} onStartOver={onReset} />
}

// ── Step 1 — amount, address, payment method ─────────────────────────────

interface AmountStepProps {
  mutation: ReturnType<typeof useFaircoinBuyQuote>
  onQuoteIssued: (quote: BuyQuoteResponse) => void
}

function AmountStep({ mutation, onQuoteIssued }: AmountStepProps) {
  const [amount, setAmount] = useState('10')
  const [address, setAddress] = useState('')
  const [currency, setCurrency] = useState<PaymentCurrency>('USDC_BASE')
  const [touched, setTouched] = useState({ amount: false, address: false })

  const amountCheck = useMemo(() => validateAmount(amount, BUY_BOUNDS), [amount])
  const addressLooksValid = useMemo(
    () => isValidFairAddress(address.trim()),
    [address],
  )

  const amountError =
    !amountCheck.ok && touched.amount ? describeAmountError(amountCheck.reason) : null
  const addressError =
    touched.address && address.trim().length > 0 && !addressLooksValid
      ? 'FairCoin addresses start with F and have 26–35 base58 characters.'
      : null

  const usdEstimate = useMemo(() => {
    if (!amountCheck.ok) return null
    const usd = amountCheck.value * COARSE_USD_PER_FAIR
    return usd.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    })
  }, [amountCheck])

  const canSubmit =
    amountCheck.ok &&
    addressLooksValid &&
    currency === 'USDC_BASE' &&
    !mutation.isPending

  const submissionError = mutation.isError ? describeQuoteError(mutation.error) : null

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setTouched({ amount: true, address: true })
      if (!amountCheck.ok || !addressLooksValid || currency !== 'USDC_BASE') return
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* You pay (FAIR) — hero amount input */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>You buy</span>
          {usdEstimate ? (
            <span className="text-muted-foreground/80">≈ {usdEstimate}</span>
          ) : null}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <input
            id="buy-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            aria-label="Amount of FAIR to buy"
            className="w-full bg-transparent text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none sm:text-[52px]"
          />
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-popover/80 py-1.5 pl-1.5 pr-3">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              F
            </span>
            <span className="text-sm font-semibold text-foreground">FAIR</span>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_AMOUNTS.map((preset) => {
              const active = amount === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={[
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  ].join(' ')}
                >
                  {preset}
                </button>
              )
            })}
          </div>
          <span className="text-muted-foreground/80">
            Min {BUY_BOUNDS.min} · Max {BUY_BOUNDS.max.toLocaleString()}
          </span>
        </div>
        {amountError ? (
          <p className="mt-2 text-xs font-medium text-destructive">{amountError}</p>
        ) : null}
      </div>

      {/* Direction indicator */}
      <div className="relative -my-2.5 flex justify-center" aria-hidden>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-sm">
          <ArrowDown className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* You pay with — payment method picker */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          You pay with
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((option) => {
            const active = option.currency === currency
            const disabled = option.comingSoon === true
            return (
              <button
                key={option.currency}
                type="button"
                disabled={disabled}
                onClick={() => setCurrency(option.currency)}
                className={[
                  'flex flex-1 min-w-[110px] flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-all duration-150',
                  active
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : disabled
                      ? 'cursor-not-allowed border-border bg-background/40 opacity-50'
                      : 'border-border bg-background/40 hover:border-primary/40 hover:bg-background/80',
                ].join(' ')}
              >
                <span className="text-sm font-semibold text-foreground">{option.label}</span>
                <span className="text-[11px] text-muted-foreground">{option.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Destination */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <label
          htmlFor="buy-address"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Send FAIR to
        </label>
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-popover/60 px-3 py-2.5 transition-colors focus-within:border-primary">
          <Wallet aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id="buy-address"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="FErMgtiwoX4zrmUi5MHY7iZ2qij32ckdDg"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            className="w-full bg-transparent font-mono text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            No wallet?{' '}
            <a
              href={FAIRWALLET_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Get FAIRWallet
            </a>
          </span>
          {addressError ? (
            <span className="text-right font-medium text-destructive">{addressError}</span>
          ) : null}
        </div>
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:h-14"
      >
        {mutation.isPending ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Generating quote…
          </>
        ) : (
          <>
            Continue
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      {submissionError ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <ShieldAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{submissionError}</span>
        </div>
      ) : null}
    </form>
  )
}

// ── Step 2 — payment + status ────────────────────────────────────────────

interface PaymentStepProps {
  quote: BuyQuoteResponse
  onAdvance: (status: BuyStatusResponse) => void
  onFail: (message: string | null) => void
  onStartOver: () => void
}

function PaymentStep({ quote, onAdvance, onFail, onStartOver }: PaymentStepProps) {
  const statusQuery = useFaircoinBuyStatus(quote.id)
  const status = statusQuery.data ?? null
  const effectiveStatus: BuyOrderStatus = status?.status ?? 'AWAITING_PAYMENT'

  const nowSeconds = useWallClockSecond()
  const expiresAtSeconds = useMemo(
    () => Math.floor(new Date(quote.paymentExpiresAt).getTime() / 1000),
    [quote.paymentExpiresAt],
  )
  const secondsRemaining = Math.max(0, expiresAtSeconds - nowSeconds)

  const paymentNotStarted = effectiveStatus === 'AWAITING_PAYMENT'
  const quoteExpired =
    effectiveStatus === 'EXPIRED' || (paymentNotStarted && secondsRemaining <= 0)

  // Step transition: derive advance/fail from query state during render
  // (no `useEffect`). `StepTransition` handles the animation; this screen
  // just notifies the parent to swap stages.
  useDerivedStageTransition(effectiveStatus, status, onAdvance, onFail)

  return (
    <div className="flex flex-col gap-4">
      {/* Amount + countdown header */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>Send exactly</span>
          {paymentNotStarted && !quoteExpired ? (
            <Countdown secondsRemaining={secondsRemaining} />
          ) : null}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <span className="text-[36px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[44px]">
            {quote.paymentAmountFormatted}
          </span>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-popover/80 py-1.5 pl-1.5 pr-3">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              $
            </span>
            <span className="text-sm font-semibold text-foreground">{quote.paymentSymbol}</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          On {quote.paymentNetworkLabel}. Other networks will be lost.
        </p>
      </div>

      {/* QR + address */}
      {quote.paymentAddress ? (
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Or scan the QR
          </div>
          <div className="mt-3 flex flex-col items-center gap-3">
            <div className="rounded-2xl bg-white p-2.5 shadow-sm">
              <QRCodeSVG
                value={quote.paymentAddress}
                size={180}
                bgColor="#ffffff"
                fgColor="#0a0a0a"
                level="M"
                marginSize={0}
                className="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px]"
              />
            </div>
            <CopyableValue
              label="Payment address"
              value={quote.paymentAddress}
              monospace
            />
          </div>
        </div>
      ) : null}

      {/* Network warning */}
      <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
        <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Send <strong>{quote.paymentSymbol}</strong> on{' '}
          <strong>{quote.paymentNetworkLabel}</strong> only. The bridge cannot recover
          cross-network transfers.
        </span>
      </div>

      {/* Status timeline */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>Bridge status</span>
          <LiveDot active={!quoteExpired} />
        </div>
        <div className="mt-3.5">
          <StatusTimeline status={effectiveStatus} status_data={status} />
        </div>
        {quoteExpired ? (
          <p className="mt-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Quote expired before payment was detected. Generate a new quote to continue.
          </p>
        ) : null}
      </div>

      {/* Footer destination + reset */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-background/40 p-3.5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Destination</span>
          <span className="font-mono text-[11px] text-foreground/80">
            {shortAddress(quote.fairDestinationAddress)}
          </span>
        </div>
        <button
          type="button"
          onClick={onStartOver}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-popover/40 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {quoteExpired ? 'Generate new quote' : 'Start over'}
        </button>
      </div>

      {statusQuery.isError && statusQuery.failureCount > 2 ? (
        <p className="text-center text-xs text-muted-foreground">
          <Loader2 aria-hidden className="mr-1 inline h-3 w-3 animate-spin" />
          Reconnecting to bridge…
        </p>
      ) : null}
    </div>
  )
}

// ── Step 3 — success ─────────────────────────────────────────────────────

function SuccessStep({
  status,
  onStartOver,
}: {
  status: BuyStatusResponse
  onStartOver: () => void
}) {
  const fairAmount = useMemo(() => satsToFair(status.fairAmountSats), [status.fairAmountSats])
  const explorerTxUrl = status.fairDeliveryTxId
    ? `${FAIR_EXPLORER_BASE}/tx/${encodeURIComponent(status.fairDeliveryTxId)}`
    : null
  const baseTxUrl = status.swapTxHash
    ? `${BASESCAN_BASE}/tx/${encodeURIComponent(status.swapTxHash)}`
    : null

  return (
    <div className="flex flex-col items-center gap-5 py-1 text-center">
      <SuccessCheckmark />

      <div className="flex flex-col items-center gap-1">
        <p className="text-[40px] font-semibold leading-[1.05] text-foreground sm:text-[48px]">
          {fairAmount}
        </p>
        <p className="text-sm font-medium uppercase tracking-wider text-primary">FAIR delivered</p>
      </div>

      <div className="w-full rounded-2xl border border-border bg-background/60 p-3.5 text-left">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Sent to
        </div>
        <p className="mt-1 break-all font-mono text-xs text-foreground">
          {status.fairDestinationAddress}
        </p>
      </div>

      {/* Tx links */}
      {(explorerTxUrl || baseTxUrl) && (
        <div className="flex w-full flex-col gap-2">
          {explorerTxUrl ? (
            <a
              href={explorerTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-background"
            >
              <span className="text-foreground">FairCoin transaction</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Explorer
                <ExternalLink aria-hidden className="h-3 w-3" />
              </span>
            </a>
          ) : null}
          {baseTxUrl ? (
            <a
              href={baseTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-background"
            >
              <span className="text-foreground">Base swap</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Basescan
                <ExternalLink aria-hidden className="h-3 w-3" />
              </span>
            </a>
          ) : null}
        </div>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
      >
        Buy more FAIR
      </button>
    </div>
  )
}

// ── Failed ───────────────────────────────────────────────────────────────

function FailedStep({
  message,
  onStartOver,
}: {
  message: string | null
  onStartOver: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
        <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
        <span>{message ?? 'No further detail was provided. Try a fresh quote.'}</span>
      </div>
      <button
        type="button"
        onClick={onStartOver}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
      >
        <RotateCcw aria-hidden className="h-4 w-4" />
        Start a new order
      </button>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────

function Countdown({ secondsRemaining }: { secondsRemaining: number }) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const warn = secondsRemaining < 60
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums',
        warn
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          : 'bg-muted text-muted-foreground',
      ].join(' ')}
    >
      <Clock aria-hidden className="h-3 w-3" />
      {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  )
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
      <span className="relative flex h-2 w-2">
        {active ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        ) : null}
        <span
          className={[
            'relative inline-flex h-2 w-2 rounded-full',
            active ? 'bg-primary' : 'bg-muted-foreground/40',
          ].join(' ')}
        />
      </span>
      {active ? 'Live' : 'Paused'}
    </span>
  )
}

interface CopyableValueProps {
  label: string
  value: string
  monospace?: boolean
}

function CopyableValue({ label, value, monospace }: CopyableValueProps) {
  const [flash, setFlash] = useState(false)
  const handleCopy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      setFlash(true)
      window.setTimeout(() => setFlash(false), COPY_FLASH_MS)
    } catch {
      setFlash(false)
    }
  }, [value])
  return (
    <div className="w-full rounded-xl border border-border bg-popover/60 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={[
            'flex-1 break-all text-foreground',
            monospace ? 'font-mono text-xs' : 'text-sm',
          ].join(' ')}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
        >
          {flash ? (
            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

interface TimelineStep {
  key: BuyOrderStatus
  label: string
  hint: string
}

const TIMELINE: readonly TimelineStep[] = [
  {
    key: 'AWAITING_PAYMENT',
    label: 'Awaiting payment',
    hint: 'Send the exact amount above.',
  },
  {
    key: 'PAYMENT_DETECTED',
    label: 'Payment received',
    hint: 'Starting the cross-chain transfer.',
  },
  { key: 'SWAPPING', label: 'Swapping to WFAIR', hint: 'USDC → WFAIR via Uniswap.' },
  { key: 'BURNING', label: 'Cross-chain transfer', hint: 'Burning WFAIR on Base.' },
  { key: 'DELIVERING', label: 'Delivering FAIR', hint: 'Broadcasting to FairCoin.' },
  { key: 'DELIVERED', label: 'Delivered', hint: 'FAIR is in your wallet.' },
]

function StatusTimeline({
  status,
  status_data,
}: {
  status: BuyOrderStatus
  status_data: BuyStatusResponse | null
}) {
  const currentIdx = Math.max(
    0,
    TIMELINE.findIndex((s) => s.key === status),
  )

  return (
    <ol className="relative ml-2 flex flex-col gap-3 border-l border-border pl-5">
      {TIMELINE.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const future = i > currentIdx
        const txHash = txForStep(step.key, status_data)
        return (
          <li key={step.key} className="relative">
            <span
              aria-hidden
              className={[
                'absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                done
                  ? 'border-primary bg-primary'
                  : active
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-popover',
              ].join(' ')}
            >
              {done ? (
                <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
              ) : active ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              ) : null}
            </span>
            <div className={future ? 'opacity-50' : 'opacity-100'}>
              <p
                className={[
                  'text-sm font-medium',
                  active || done ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
              {txHash ? <TxHashLink hash={txHash} chain={txChainForStep(step.key)} /> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TxHashLink({ hash, chain }: { hash: string; chain: 'base' | 'fair' }) {
  const url =
    chain === 'fair'
      ? `${FAIR_EXPLORER_BASE}/tx/${encodeURIComponent(hash)}`
      : `${BASESCAN_BASE}/tx/${encodeURIComponent(hash)}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {shortHash(hash)}
      <ExternalLink aria-hidden className="h-2.5 w-2.5" />
    </a>
  )
}

function SuccessCheckmark() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
      <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 sm:h-20 sm:w-20">
        <CheckCircle2 className="h-8 w-8 text-primary sm:h-10 sm:w-10" strokeWidth={2.5} />
      </span>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Advances the parent stage to `done`/`failed` exactly once when the bridge
 * reports a terminal status. Implemented as render-time derived state via a
 * `useState` + inline compare — no `useEffect`.
 */
function useDerivedStageTransition(
  effectiveStatus: BuyOrderStatus,
  status: BuyStatusResponse | null,
  onAdvance: (status: BuyStatusResponse) => void,
  onFail: (message: string | null) => void,
) {
  const [handled, setHandled] = useState<BuyOrderStatus | null>(null)
  if (handled !== 'DELIVERED' && effectiveStatus === 'DELIVERED' && status) {
    setHandled('DELIVERED')
    onAdvance(status)
  } else if (handled !== 'FAILED' && effectiveStatus === 'FAILED') {
    setHandled('FAILED')
    onFail(status?.errorMessage ?? null)
  }
}

function txForStep(key: BuyOrderStatus, data: BuyStatusResponse | null): string | null {
  if (!data) return null
  switch (key) {
    case 'PAYMENT_DETECTED':
      return data.paymentDetectedTxHash
    case 'SWAPPING':
      return data.swapTxHash
    case 'BURNING':
      return data.burnTxHash
    case 'DELIVERED':
      return data.fairDeliveryTxId
    default:
      return null
  }
}

function txChainForStep(key: BuyOrderStatus): 'base' | 'fair' {
  return key === 'DELIVERED' ? 'fair' : 'base'
}

function shortAddress(a: string): string {
  if (a.length <= 14) return a
  return `${a.slice(0, 8)}…${a.slice(-6)}`
}

function shortHash(h: string): string {
  if (h.length <= 14) return h
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

function describeAmountError(reason: 'empty' | 'malformed' | 'below_min' | 'above_max'): string {
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

function describeQuoteError(err: unknown): string {
  if (err instanceof BuyApiError) {
    if (err.code === 'invalid_request') {
      const field = err.extras.field
      if (field === 'fairDestinationAddress') {
        return 'That FairCoin address looks invalid. Double-check for typos.'
      }
      if (field === 'fairAmount') {
        return 'That amount is not a valid number. Use up to 8 decimals.'
      }
      if (field === 'paymentCurrency') {
        return 'That payment method is not supported yet.'
      }
      return err.message
    }
    switch (err.code) {
      case 'rate_limited':
        return 'Too many requests. Try again in a minute.'
      case 'invalid_fair_destination':
        return 'The bridge rejected that FairCoin address.'
      case 'below_minimum': {
        const min = err.extras.minimumFair
        return typeof min === 'string'
          ? `Below the minimum of ${min} FAIR.`
          : 'Below the minimum.'
      }
      case 'above_maximum': {
        const max = err.extras.maximumFair
        return typeof max === 'string'
          ? `Above the maximum of ${max} FAIR.`
          : 'Above the maximum.'
      }
      case 'currency_unavailable':
        return 'That payment method is not yet available. Use USDC on Base.'
      case 'card_not_configured':
        return 'Card payments are coming soon. Use USDC on Base for now.'
      case 'pool_quote_failed':
        return 'WFAIR pool quote temporarily unavailable. Try again.'
      case 'address_allocation_failed':
        return 'The bridge could not allocate a payment address. Retry shortly.'
      case 'network_error':
        return 'Could not reach the bridge. Check your connection.'
      default:
        return err.message.length > 0 ? err.message : 'Bridge returned an error.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Unexpected error. Try again.'
}

function satsToFair(satsStr: string): string {
  try {
    const sats = BigInt(satsStr)
    const whole = sats / 100_000_000n
    const frac = sats % 100_000_000n
    if (frac === 0n) return whole.toString()
    const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '')
    return `${whole.toString()}.${fracStr}`
  } catch {
    return satsStr
  }
}
