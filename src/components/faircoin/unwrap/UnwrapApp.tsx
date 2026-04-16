/**
 * UnwrapApp — app-style WFAIR → native FAIR redemption flow.
 *
 * Wizard:
 *   1. CONNECT  — connect a wallet (MetaMask/injected, WalletConnect, Coinbase)
 *   2. AMOUNT   — show WFAIR balance + amount + destination FairCoin address
 *   3. CONFIRM  — call WFAIR.bridgeBurn via wagmi; surface signature/tx prompts
 *   4. STATUS   — poll bridge withdrawal endpoint for FAIR delivery
 *   5. DONE     — success
 *
 * Step transitions slide horizontally via `StepTransition`. `useEffect` is
 * avoided — transitions derive from wagmi/react-query state shape.
 */
import { useCallback, useMemo, useState } from 'react'
import { stringToBytes, formatUnits, parseUnits, toHex } from 'viem'
import { base } from 'wagmi/chains'
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  LogOut,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import AppShell from '../app/AppShell'
import StepTransition from '../app/StepTransition'
import { isValidFairAddress } from '../buy/validate'
import { useFaircoinWithdrawalStatus } from '../../../hooks/use-faircoin-withdrawal'
import {
  type WithdrawalStatus,
  type WithdrawalStatusResponse,
} from '../../../api/faircoin-withdrawal'
import {
  FAIRCOIN_ADDRESS_BYTES,
  WFAIR_ABI,
  WFAIR_ADDRESS,
  WFAIR_DECIMALS,
} from '../../../lib/wfair-contract'

const FAIR_EXPLORER_BASE = 'https://explorer.fairco.in'
const BASESCAN_BASE = 'https://basescan.org'
const FAIRWALLET_RELEASES_URL =
  'https://github.com/FairCoinOfficial/FAIRWallet/releases'

const COPY_FLASH_MS = 1_500

const STEPS = [
  { id: 'amount', label: 'Amount' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'done', label: 'Done' },
] as const

interface ActiveBurn {
  txHash: `0x${string}`
  amountWei: bigint
  destinationAddress: string
}

type StageKind = 'connect' | 'redeem' | 'status'

interface ShellCopy {
  eyebrow: string
  title: string
  subtitle?: string
  currentStep: number
  footnote?: React.ReactNode
}

const SHELL_COPY_CONNECT: ShellCopy = {
  eyebrow: 'Redeem WFAIR',
  title: 'Unwrap WFAIR back to native FAIR',
  subtitle:
    'Connect a wallet on Base to burn WFAIR. The bridge releases native FAIR on the FairCoin chain.',
  currentStep: 0,
  footnote: (
    <>
      Need WFAIR?{' '}
      <a
        href="https://app.uniswap.org/swap?outputCurrency=0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3&chain=base"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 hover:text-foreground hover:underline"
      >
        Trade for it on Uniswap
      </a>
      .
    </>
  ),
}

const SHELL_COPY_REDEEM: ShellCopy = {
  eyebrow: 'Redeem WFAIR',
  title: 'Unwrap WFAIR to native FAIR',
  subtitle: 'Burn WFAIR on Base. The bridge releases the equivalent FAIR to your address.',
  currentStep: 0,
}

const SHELL_COPY_TRACKING: ShellCopy = {
  eyebrow: 'Tracking redemption',
  title: 'Releasing native FAIR',
  subtitle:
    'Your burn is being indexed by the bridge. Native FAIR will arrive shortly.',
  currentStep: 1,
}

export default function UnwrapApp() {
  const account = useAccount()
  const { disconnect } = useDisconnect()
  const [activeBurn, setActiveBurn] = useState<ActiveBurn | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)

  // Derive the active stage from wagmi + local state. No useEffect.
  const stageKind: StageKind = !account.isConnected || !account.address
    ? 'connect'
    : activeBurn
      ? 'status'
      : 'redeem'

  const handleBurnConfirmed = useCallback(
    (txHash: `0x${string}`, amountWei: bigint, destinationAddress: string) => {
      setDirection(1)
      setActiveBurn({ txHash, amountWei, destinationAddress })
    },
    [],
  )

  const handleReset = useCallback(() => {
    setDirection(-1)
    setActiveBurn(null)
  }, [])

  const copy = useMemo<ShellCopy>(() => {
    if (stageKind === 'connect') return SHELL_COPY_CONNECT
    if (stageKind === 'redeem') return SHELL_COPY_REDEEM
    return SHELL_COPY_TRACKING
  }, [stageKind])

  const toolbar = stageKind !== 'connect' && account.address ? (
    <ConnectedPill address={account.address} onDisconnect={() => disconnect()} />
  ) : null

  return (
    <AppShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      steps={STEPS}
      currentStep={copy.currentStep}
      toolbar={toolbar}
      footnote={copy.footnote}
    >
      <StepTransition stepKey={stageKind} direction={direction}>
        {stageKind === 'connect' ? (
          <ConnectStep />
        ) : stageKind === 'status' && activeBurn ? (
          <StatusStep burn={activeBurn} onReset={handleReset} />
        ) : account.address ? (
          <RedeemStep address={account.address} onBurnConfirmed={handleBurnConfirmed} />
        ) : null}
      </StepTransition>
    </AppShell>
  )
}

// ── Step 1 — connect ─────────────────────────────────────────────────────

function ConnectStep() {
  const { connectors, connect, isPending: isConnecting, error: connectError } = useConnect()
  const [chosen, setChosen] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">
        Choose a wallet to continue
      </p>
      {connectors.map((connector) => {
        const isThisPending = isConnecting && chosen === connector.uid
        return (
          <button
            key={connector.uid}
            type="button"
            disabled={isConnecting}
            onClick={() => {
              setChosen(connector.uid)
              connect({ connector, chainId: base.id })
            }}
            className="flex h-14 items-center justify-between rounded-2xl border border-border bg-background/60 px-4 text-left transition-all duration-150 hover:border-primary/50 hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {connectorLabel(connector.name, connector.id)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {connectorHint(connector.id)}
                </span>
              </span>
            </span>
            {isThisPending ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )
      })}

      {connectError ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {connectError.message.length > 0
              ? connectError.message
              : 'Could not connect to wallet.'}
          </span>
        </div>
      ) : null}

      <p className="mt-1 text-center text-xs text-muted-foreground">
        We never see your keys. The redemption is signed in your wallet on Base mainnet.
      </p>
    </div>
  )
}

// ── Step 2 — amount + destination + burn ─────────────────────────────────

interface RedeemStepProps {
  address: `0x${string}`
  onBurnConfirmed: (
    txHash: `0x${string}`,
    amountWei: bigint,
    destinationAddress: string,
  ) => void
}

function RedeemStep({ address, onBurnConfirmed }: RedeemStepProps) {
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const onWrongChain = chainId !== base.id

  const balanceQuery = useReadContract({
    address: WFAIR_ADDRESS,
    abi: WFAIR_ABI,
    functionName: 'balanceOf',
    args: [address],
    chainId: base.id,
    query: {
      // Refresh after we burn so the balance updates without a manual refresh.
      refetchInterval: 15_000,
    },
  })

  const pausedQuery = useReadContract({
    address: WFAIR_ADDRESS,
    abi: WFAIR_ABI,
    functionName: 'paused',
    chainId: base.id,
  })

  const balanceWei = balanceQuery.data ?? 0n
  const balanceFormatted = useMemo(
    () => formatUnits(balanceWei, WFAIR_DECIMALS),
    [balanceWei],
  )

  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [touched, setTouched] = useState({ amount: false, destination: false })

  const writeContract = useWriteContract()
  const burnHash = writeContract.data
  const burnReceipt = useWaitForTransactionReceipt({
    hash: burnHash,
    chainId: base.id,
    query: { enabled: Boolean(burnHash) },
  })

  // Step transition: once the burn is mined, hand off to the status step.
  // Derived during render rather than via useEffect.
  const lastBurn = useDerivedConfirmedBurn(
    burnHash,
    burnReceipt.data?.status,
    amount,
    destination,
  )
  if (lastBurn) {
    onBurnConfirmed(lastBurn.txHash, lastBurn.amountWei, lastBurn.destination)
  }

  const amountValid = useMemo(() => {
    const trimmed = amount.trim()
    if (trimmed.length === 0) return false
    if (!/^\d+(\.\d{1,18})?$/.test(trimmed)) return false
    try {
      const wei = parseUnits(trimmed, WFAIR_DECIMALS)
      return wei > 0n && wei <= balanceWei
    } catch {
      return false
    }
  }, [amount, balanceWei])

  const destinationValid = useMemo(
    () => isValidFairAddress(destination.trim()),
    [destination],
  )

  // Bridge contract enforces 26-35 byte FairCoin address payload — also
  // surface this client-side so the user can see the issue before signing.
  const destinationBytesValid = useMemo(() => {
    if (!destinationValid) return false
    const bytes = stringToBytes(destination.trim())
    return (
      bytes.length >= FAIRCOIN_ADDRESS_BYTES.min &&
      bytes.length <= FAIRCOIN_ADDRESS_BYTES.max
    )
  }, [destination, destinationValid])

  const amountErrorMsg =
    touched.amount && amount.trim().length > 0 && !amountValid
      ? balanceWei === 0n
        ? 'No WFAIR to redeem'
        : Number(amount) > Number(balanceFormatted)
          ? 'Exceeds your balance'
          : 'Enter a valid amount'
      : null
  const destinationErrorMsg =
    touched.destination && destination.trim().length > 0 && !destinationBytesValid
      ? 'Enter a valid FairCoin address (starts with F, 26–35 base58 characters)'
      : null

  const isPaused = pausedQuery.data === true
  const canSubmit =
    amountValid &&
    destinationBytesValid &&
    !onWrongChain &&
    !isPaused &&
    !writeContract.isPending &&
    !burnReceipt.isLoading

  const handleMax = useCallback(() => {
    setAmount(balanceFormatted)
    setTouched((t) => ({ ...t, amount: true }))
  }, [balanceFormatted])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setTouched({ amount: true, destination: true })
      if (!canSubmit) return

      const amountWei = parseUnits(amount.trim(), WFAIR_DECIMALS)
      const destinationBytesHex = toHex(stringToBytes(destination.trim()))

      writeContract.writeContract({
        address: WFAIR_ADDRESS,
        abi: WFAIR_ABI,
        functionName: 'bridgeBurn',
        args: [amountWei, destinationBytesHex],
        chainId: base.id,
      })
    },
    [amount, destination, canSubmit, writeContract],
  )

  const writeError = writeContract.error
  const receiptError = burnReceipt.error
  const failureMessage =
    burnReceipt.data?.status === 'reverted'
      ? 'The burn transaction reverted on-chain.'
      : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {onWrongChain ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-amber-700 dark:text-amber-300">
          <div className="flex items-start gap-2 text-sm">
            <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your wallet is on the wrong network. WFAIR lives on{' '}
              <strong>Base mainnet</strong>.
            </span>
          </div>
          <button
            type="button"
            disabled={isSwitchingChain}
            onClick={() => switchChain({ chainId: base.id })}
            className="h-10 rounded-xl bg-amber-500 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
          >
            {isSwitchingChain ? 'Switching network…' : 'Switch to Base'}
          </button>
        </div>
      ) : null}

      {/* You burn (WFAIR) — hero amount input */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>You burn</span>
          <span className="text-muted-foreground/80">
            Balance: {formatBalanceForDisplay(balanceFormatted)} WFAIR
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <input
            id="unwrap-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            aria-label="Amount of WFAIR to burn"
            className="w-full bg-transparent text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none sm:text-[52px]"
          />
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-popover/80 py-1.5 pl-1.5 pr-3">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              W
            </span>
            <span className="text-sm font-semibold text-foreground">WFAIR</span>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleMax}
            disabled={balanceWei === 0n}
            className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Max
          </button>
          {(['25', '50', '75'] as const).map((pct) => {
            const fraction = (balanceWei * BigInt(Number(pct))) / 100n
            const display = formatUnits(fraction, WFAIR_DECIMALS)
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setAmount(display)}
                disabled={balanceWei === 0n}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pct}%
              </button>
            )
          })}
        </div>
        {amountErrorMsg ? (
          <p className="mt-2 text-xs font-medium text-destructive">{amountErrorMsg}</p>
        ) : null}
      </div>

      {/* Direction indicator */}
      <div className="relative -my-2.5 flex justify-center" aria-hidden>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-sm">
          <ArrowDown className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* You receive — preview */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          You receive
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <span className="text-[40px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[48px]">
            {amount.trim().length > 0 && amountValid ? amount : '0'}
          </span>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-popover/80 py-1.5 pl-1.5 pr-3">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              F
            </span>
            <span className="text-sm font-semibold text-foreground">FAIR</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          1 WFAIR = 1 FAIR. No fees from the bridge — only Base network gas to sign the burn.
        </p>
      </div>

      {/* Destination */}
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <label
          htmlFor="unwrap-destination"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Send FAIR to
        </label>
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-popover/60 px-3 py-2.5 transition-colors focus-within:border-primary">
          <Wallet aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id="unwrap-destination"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="FErMgtiwoX4zrmUi5MHY7iZ2qij32ckdDg"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, destination: true }))}
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
          {destinationErrorMsg ? (
            <span className="text-right font-medium text-destructive">{destinationErrorMsg}</span>
          ) : null}
        </div>
      </div>

      {isPaused ? (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>The WFAIR contract is currently paused. Redemptions are disabled.</span>
        </div>
      ) : null}

      {/* CTA */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:h-14"
      >
        {writeContract.isPending ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Confirm in your wallet…
          </>
        ) : burnReceipt.isLoading ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Waiting for confirmation…
          </>
        ) : (
          <>
            Redeem WFAIR
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      {writeError && !writeContract.isPending ? (
        <ErrorBanner message={describeWriteError(writeError)} />
      ) : null}
      {receiptError ? <ErrorBanner message={receiptError.message} /> : null}
      {failureMessage ? <ErrorBanner message={failureMessage} /> : null}

      {burnHash && !burnReceipt.data ? (
        <p className="rounded-xl border border-border bg-background/40 px-3 py-2 text-center text-xs text-muted-foreground">
          Tx submitted — waiting for confirmation on Base.
        </p>
      ) : null}
    </form>
  )
}

// ── Step 3 — status / done ───────────────────────────────────────────────

interface StatusStepProps {
  burn: ActiveBurn
  onReset: () => void
}

function StatusStep({ burn, onReset }: StatusStepProps) {
  const withdrawal = useFaircoinWithdrawalStatus(burn.txHash)
  const status = withdrawal.data
  const isFinal = status?.status === 'FINAL'
  const isFailed = status?.status === 'FAILED'

  if (isFinal && status) {
    return <UnwrapSuccess burn={burn} status={status} onReset={onReset} />
  }

  if (isFailed && status) {
    return <UnwrapFailed burn={burn} onReset={onReset} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>You burned</span>
          <LiveDot active />
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <span className="text-[40px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[48px]">
            {formatUnits(burn.amountWei, WFAIR_DECIMALS)}
          </span>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-popover/80 py-1.5 pl-1.5 pr-3">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              W
            </span>
            <span className="text-sm font-semibold text-foreground">WFAIR</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Bridge status
        </div>
        <div className="mt-3.5">
          <UnwrapTimeline status={status} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/40 p-3.5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Burn transaction
        </div>
        <a
          href={`${BASESCAN_BASE}/tx/${encodeURIComponent(burn.txHash)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-xs text-foreground underline-offset-4 hover:underline"
        >
          {burn.txHash}
          <ExternalLink aria-hidden className="h-3 w-3 shrink-0" />
        </a>
      </div>

      {withdrawal.isError && withdrawal.failureCount > 2 ? (
        <p className="text-center text-xs text-muted-foreground">
          <Loader2 aria-hidden className="mr-1 inline h-3 w-3 animate-spin" />
          Reconnecting to bridge…
        </p>
      ) : null}
    </div>
  )
}

function UnwrapFailed({
  burn,
  onReset,
}: {
  burn: ActiveBurn
  onReset: () => void
}) {
  // Intentionally rendered inside the tracking shell to avoid a second layout
  // shift after the bridge reports FAILED mid-flight.
  return (
    <div className="flex flex-col gap-4">
      <ErrorBanner message="The bridge marked this redemption as FAILED. Reach out to support with your burn tx hash." />
      <div className="rounded-2xl border border-border bg-background/60 p-3.5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Burn transaction
        </div>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{burn.txHash}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-popover/40 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <RotateCcw aria-hidden className="h-4 w-4" />
        Start a new redemption
      </button>
    </div>
  )
}

function UnwrapSuccess({
  burn,
  status,
  onReset,
}: {
  burn: ActiveBurn
  status: WithdrawalStatusResponse
  onReset: () => void
}) {
  const fairAmount = useMemo(() => satsToFair(status.amountSats), [status.amountSats])
  const explorerUrl = status.fairTxid
    ? `${FAIR_EXPLORER_BASE}/tx/${encodeURIComponent(status.fairTxid)}`
    : null
  const burnUrl = `${BASESCAN_BASE}/tx/${encodeURIComponent(status.baseBurnTxHash)}`

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
          {status.destinationFairAddress || burn.destinationAddress}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        {explorerUrl ? (
          <a
            href={explorerUrl}
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
        <a
          href={burnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-background"
        >
          <span className="text-foreground">Base burn</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Basescan
            <ExternalLink aria-hidden className="h-3 w-3" />
          </span>
        </a>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
      >
        Redeem more WFAIR
      </button>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────

interface UnwrapTimelineStep {
  key: 'BURN' | WithdrawalStatus
  label: string
  hint: string
}

const UNWRAP_TIMELINE: readonly UnwrapTimelineStep[] = [
  { key: 'BURN', label: 'WFAIR burned', hint: 'Your burn tx is mined on Base.' },
  { key: 'DETECTED', label: 'Bridge detected burn', hint: 'Bridge watcher indexed the event.' },
  {
    key: 'CONFIRMED',
    label: 'Confirmation depth reached',
    hint: 'Waiting for finality on Base.',
  },
  { key: 'SIGNING', label: 'Authorising payout', hint: 'Bridge signer is preparing the FAIR tx.' },
  {
    key: 'BROADCAST',
    label: 'Broadcasting to FairCoin',
    hint: 'FAIR tx is in the mempool.',
  },
  { key: 'FINAL', label: 'FAIR delivered', hint: 'Transfer is final on FairCoin.' },
]

function UnwrapTimeline({ status }: { status: WithdrawalStatusResponse | null | undefined }) {
  // BURN is always done if we got here. If `status` is null the bridge has
  // not yet seen the burn (DETECTED hasn't happened yet).
  const stages: ReadonlyArray<UnwrapTimelineStep['key']> = [
    'BURN',
    'DETECTED',
    'CONFIRMED',
    'SIGNING',
    'BROADCAST',
    'FINAL',
  ]
  const completedFromBridge: WithdrawalStatus[] = []
  if (status) {
    const idx = stages.indexOf(status.status)
    for (let i = 1; i <= idx; i++) {
      completedFromBridge.push(stages[i] as WithdrawalStatus)
    }
  }
  const completed = new Set<UnwrapTimelineStep['key']>([
    'BURN',
    ...completedFromBridge,
  ])
  const currentIdx = status ? stages.indexOf(status.status) : 0

  return (
    <ol className="relative ml-2 flex flex-col gap-3 border-l border-border pl-5">
      {UNWRAP_TIMELINE.map((step, i) => {
        const done = completed.has(step.key) && i < currentIdx
        const active = i === currentIdx || (!status && step.key === 'BURN')
        const future = i > currentIdx && !done && !active
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
              {step.key === 'BROADCAST' && status?.fairTxid ? (
                <a
                  href={`${FAIR_EXPLORER_BASE}/tx/${encodeURIComponent(status.fairTxid)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {shortHash(status.fairTxid)}
                  <ExternalLink aria-hidden className="h-2.5 w-2.5" />
                </a>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function ConnectedPill({
  address,
  onDisconnect,
}: {
  address: `0x${string}`
  onDisconnect: () => void
}) {
  const [flash, setFlash] = useState(false)
  const handleCopy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(address)
      setFlash(true)
      window.setTimeout(() => setFlash(false), COPY_FLASH_MS)
    } catch {
      setFlash(false)
    }
  }, [address])
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-popover/80 p-0.5 pl-3">
      <span aria-hidden className="flex h-2 w-2 rounded-full bg-emerald-500" />
      <span className="font-mono text-xs text-foreground">{shortAddress(address)}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy address"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        {flash ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={onDisconnect}
        aria-label="Disconnect wallet"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
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
      Live
    </span>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
      <ShieldAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="break-words">{message}</span>
    </div>
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
 * Tracks the most recent confirmed burn so the parent component can transition
 * to the status screen exactly once. Implemented as derived state via a
 * `useState` + render-time compare — no useEffect needed.
 */
function useDerivedConfirmedBurn(
  burnHash: `0x${string}` | undefined,
  receiptStatus: 'success' | 'reverted' | undefined,
  amount: string,
  destination: string,
): { txHash: `0x${string}`; amountWei: bigint; destination: string } | null {
  const [reported, setReported] = useState<`0x${string}` | null>(null)
  if (
    burnHash &&
    receiptStatus === 'success' &&
    burnHash !== reported &&
    amount.trim().length > 0 &&
    destination.trim().length > 0
  ) {
    try {
      const amountWei = parseUnits(amount.trim(), WFAIR_DECIMALS)
      setReported(burnHash)
      return { txHash: burnHash, amountWei, destination: destination.trim() }
    } catch {
      // Amount parsing failed (shouldn't happen if upstream validation worked)
      setReported(burnHash)
      return null
    }
  }
  return null
}

function shortAddress(a: string): string {
  if (a.length <= 14) return a
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function shortHash(h: string): string {
  if (h.length <= 14) return h
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

function formatBalanceForDisplay(formatted: string): string {
  const numeric = Number(formatted)
  if (!Number.isFinite(numeric)) return formatted
  if (numeric === 0) return '0'
  if (numeric < 0.0001) return '<0.0001'
  if (numeric < 1) return numeric.toFixed(4)
  if (numeric < 1_000) return numeric.toFixed(2)
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })
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

function connectorLabel(name: string, id: string): string {
  if (id === 'walletConnect') return 'WalletConnect'
  if (id === 'coinbaseWallet' || id === 'coinbaseWalletSDK') return 'Coinbase Wallet'
  if (id === 'injected') return name === 'Injected' ? 'Browser wallet' : name
  return name
}

function connectorHint(id: string): string {
  if (id === 'walletConnect') return 'Scan with any mobile wallet'
  if (id === 'coinbaseWallet' || id === 'coinbaseWalletSDK') return 'Open in Coinbase'
  if (id === 'injected') return 'MetaMask, Rabby, Rainbow…'
  return 'Connect to continue'
}

function describeWriteError(err: Error): string {
  const msg = err.message
  if (/User rejected|rejected the request|denied transaction signature/i.test(msg)) {
    return 'You cancelled the transaction in your wallet.'
  }
  if (/insufficient funds/i.test(msg)) {
    return 'Insufficient ETH on Base to pay for gas.'
  }
  if (/whenNotPaused/i.test(msg)) {
    return 'WFAIR contract is currently paused. Try again later.'
  }
  if (/invalid faircoin address length/i.test(msg)) {
    return 'The destination address is not the right size for the bridge.'
  }
  // Trim noisy viem error chains to the root message line.
  const firstLine = msg.split('\n')[0]
  return firstLine.length > 0 ? firstLine : 'Could not submit transaction.'
}
