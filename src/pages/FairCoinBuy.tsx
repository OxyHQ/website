import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import { fc } from '../lib/faircoin-links'
import {
  useFairCoinFooterBrand,
  useFairCoinFooterColumns,
  useFairCoinFooterCopyright,
  useFairCoinFooterLegalLinks,
  useFairCoinNavCtaButtons,
  useFairCoinNavItems,
  useFairCoinNavbarBrand,
} from '../lib/faircoin-chrome'

const SEO_TITLE = 'Buy FairCoin — fairco.in'
const SEO_DESCRIPTION =
  'Buy FAIR delivered straight to your FairCoin wallet. Pay, confirm, and receive — handled in one flow.'

/**
 * FairCoin address format heuristic. Mainnet addresses start with `F` and are
 * Base58Check-encoded, typically 33–35 characters. We avoid pulling a full
 * Base58 validator into the bundle for what is, today, a marketing form — the
 * authoritative validation happens server-side via fairRpc validateAddress
 * once the orchestrator backend is wired up. This catches obvious typos
 * (wrong network, wrong length, illegal characters) before submission.
 */
const FAIR_ADDRESS_RE = /^F[1-9A-HJ-NP-Za-km-z]{32,34}$/

const STEPS: ReadonlyArray<{ index: string; title: string; description: string }> = [
  {
    index: '01',
    title: 'Pay',
    description:
      'Choose how much FAIR you want and pay with your card or bank. Pricing is locked at the moment of payment.',
  },
  {
    index: '02',
    title: 'Confirm',
    description:
      'We process the order and prepare the delivery to your FairCoin address. You get an email when everything is queued.',
  },
  {
    index: '03',
    title: 'FAIR delivered',
    description:
      'FAIR arrives in your wallet in minutes. No exchange account, no L2 wallet to manage, no extra steps.',
  },
]

interface FormState {
  amount: string
  address: string
}

type SubmitState = 'idle' | 'invalid' | 'pending' | 'queued'

function validate(state: FormState): { ok: true } | { ok: false; reason: string } {
  const amountNumber = Number(state.amount)
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return { ok: false, reason: 'Enter an amount of FAIR greater than 0.' }
  }
  if (amountNumber > 1_000_000) {
    return { ok: false, reason: 'For amounts above 1,000,000 FAIR contact us directly for OTC.' }
  }
  if (!FAIR_ADDRESS_RE.test(state.address.trim())) {
    return {
      ok: false,
      reason: 'That does not look like a FairCoin mainnet address (should start with F).',
    }
  }
  return { ok: true }
}

export default function FairCoinBuyPage() {
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()
  const homeHref = useMemo(() => fc('/'), [])
  const bridgeHref = useMemo(() => fc('/bridge'), [])

  const [form, setForm] = useState<FormState>({ amount: '', address: '' })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validate(form)
    if (!result.ok) {
      setSubmitState('invalid')
      setValidationError(result.reason)
      return
    }
    setValidationError(null)
    setSubmitState('pending')
    // The live payment + bridge orchestrator is phase 2. For now we move the
    // user to a "queued" state and surface OTC contact details — no fake
    // payment dialog.
    window.setTimeout(() => setSubmitState('queued'), 600)
  }

  return (
    <div className="faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/buy" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth
        hideBanner
        hideLocalePicker
      />
      <main className="cursor-theme faircoin-theme flex-1">
        {/* ── Hero ── */}
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide text-center">
              <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
                <span>[</span> <span>Buy FairCoin</span> <span>]</span>
              </div>
              <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
                Get FAIR delivered to your wallet
              </h1>
              <p className="type-base text-muted-foreground text-pretty mb-v1 mx-auto max-w-2xl">
                Pay once. Receive FAIR straight in your FairCoin wallet. No exchange account, no
                token swaps, no manual steps.
              </p>
            </div>
          </div>
        </section>

        {/* ── Form ── */}
        <section className="section">
          <div className="container">
            <div className="mx-auto max-w-2xl">
              <form
                onSubmit={handleSubmit}
                className="card flex flex-col gap-4 border border-border bg-surface"
                aria-label="Buy FairCoin"
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor="buy-amount" className="text-sm font-medium text-foreground">
                    Amount of FAIR
                  </label>
                  <input
                    id="buy-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="100"
                    value={form.amount}
                    onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="buy-address" className="text-sm font-medium text-foreground">
                    Your FairCoin address
                  </label>
                  <input
                    id="buy-address"
                    name="address"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="F..."
                    value={form.address}
                    onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    aria-describedby="buy-address-hint"
                    required
                  />
                  <p id="buy-address-hint" className="text-xs text-muted-foreground">
                    Mainnet addresses start with <span className="font-mono">F</span>. Get one in{' '}
                    <a
                      href="https://github.com/FairCoinOfficial/FAIRWallet/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                    >
                      FAIRWallet
                    </a>
                    .
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Estimated total</span>
                  <div className="flex h-11 w-full items-center rounded-lg border border-dashed border-border bg-background px-3 text-sm text-muted-foreground">
                    Live pricing arrives once the FAIR market is live.
                  </div>
                </div>

                {validationError && submitState === 'invalid' && (
                  <p role="alert" className="text-sm text-destructive">
                    {validationError}
                  </p>
                )}

                {submitState === 'queued' ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">
                    <p className="font-medium">You're on the list.</p>
                    <p className="text-muted-foreground">
                      Card and bank-transfer payments are coming soon. Until then, send an email to{' '}
                      <a
                        href={`mailto:hello@fairco.in?subject=Buy%20FairCoin%20OTC&body=Amount%3A%20${encodeURIComponent(form.amount)}%20FAIR%0AAddress%3A%20${encodeURIComponent(form.address)}`}
                        className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                      >
                        hello@fairco.in
                      </a>{' '}
                      and we'll arrange OTC delivery to your address.
                    </p>
                  </div>
                ) : (
                  <Button type="submit" size="lg" className="self-start">
                    {submitState === 'pending' ? 'Working…' : 'Continue'}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="section">
          <div className="container">
            <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
              <span>[</span> <span>How it works</span> <span>]</span>
            </div>
            <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">Three steps</h2>
            <div className="grid gap-g1 grid-cols-1 items-stretch md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.index} className="card flex h-full grow-1 flex-col">
                  <span className="mono-tag text-sm mb-v8/12 text-primary">{step.index}</span>
                  <h3 className="type-base md:type-md text-foreground">{step.title}</h3>
                  <p className="mt-2 text-pretty text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer note ── */}
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <p className="text-xs text-muted-foreground">
                Powered by the WFAIR bridge under the hood — FAIR is delivered to your wallet
                automatically. See{' '}
                <Link
                  to={bridgeHref}
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  the bridge page
                </Link>{' '}
                for the technical details.
              </p>
              <Link to={homeHref} className="inline-block text-sm underline text-muted-foreground">
                ← Back to FairCoin
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer
        brand={footerBrand}
        columns={footerColumns}
        socialLinks={[]}
        legalLinks={footerLegalLinks}
        copyright={footerCopyright}
      />
    </div>
  )
}
