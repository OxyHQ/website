import { useState, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useReferralDashboard, type ReferralDashboard } from '../api/hooks'

/* ──────────────────────────────────────────────
 * /referrals/dashboard
 *
 * Lightweight referrer dashboard. Visitors paste their referral code
 * (or open the page with ?code=<code>) to see their share link, click
 * count, and signup count. No auth — the public referral lookup only
 * returns what's safe to expose. The full /dashboard route is for
 * something else entirely; this page lives under /referrals so admins
 * and ambassadors have one focused surface.
 * ──────────────────────────────────────────── */

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 10.5 18.75 19.5 5.25" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125V9.625m7.5 5.625a2.625 2.625 0 0 1-2.625-2.625V6.75m-3.375 3v6m0-6h.008v.008h-.008Z" />
    </svg>
  )
}

const PROGRAM_LABEL: Record<ReferralDashboard['type'], string> = {
  paid: 'Paid affiliate',
  ambassador: 'Ambassador',
  user: 'Share link',
}

const PROGRAM_BLURB: Record<ReferralDashboard['type'], string> = {
  paid: 'Earn commission on every paying customer who signs up via your link.',
  ambassador: 'No commission, but you get early access, swag drops, and an Ambassador badge on your Oxy profile.',
  user: 'Just share what you love. Every signup helps us keep the lights on.',
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-3xl font-medium tabular-nums text-foreground">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

function buildShareUrl(code: string, customLandingUrl: string | null | undefined): string {
  if (customLandingUrl && customLandingUrl.length > 0) {
    const sep = customLandingUrl.includes('?') ? '&' : '?'
    return `${customLandingUrl}${sep}ref=${code}`
  }
  if (typeof window === 'undefined') return `https://oxy.so/referrals?ref=${code}`
  return `${window.location.origin}/referrals?ref=${code}`
}

function DashboardContent({ referral }: { referral: ReferralDashboard }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = useMemo(
    () => buildShareUrl(referral.code, referral.customLandingUrl),
    [referral.code, referral.customLandingUrl],
  )

  const handleCopy = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }).catch(() => undefined)
  }, [shareUrl])

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {PROGRAM_LABEL[referral.type]}
        </span>
        <h1 className="text-heading-responsive-lg text-foreground">
          Welcome back, {referral.name}.
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
          {PROGRAM_BLURB[referral.type]}
        </p>
      </header>

      {/* Share link */}
      <section className="rounded-3xl border border-border bg-surface/30 p-6">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Your share link</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Anyone who lands on this URL counts as your referral. Use it in posts, DMs, email, anywhere.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 truncate rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-foreground">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              <CopyIcon copied={copied} />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Clicks" value={referral.clicks.toLocaleString()} hint="Visits via your link" />
        <StatTile label="Signups" value={referral.signups.toLocaleString()} hint="Tracked manually for now" />
        <StatTile
          label="Commission"
          value={referral.type === 'paid' && referral.commissionPercent != null ? `${referral.commissionPercent}%` : '—'}
          hint={referral.type === 'paid' ? 'Per paying signup' : 'Not applicable for this program'}
        />
      </section>

      {/* How it works recap */}
      <section className="rounded-3xl border border-border bg-background p-6">
        <h2 className="text-sm font-semibold text-foreground">How payouts work</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Clicks are counted in real time the moment someone follows your link.</li>
          <li>Signups are reconciled by the team — we're working on automated tracking.</li>
          {referral.type === 'paid' && (
            <li>Commission is paid monthly, in arrears, against your Oxy account or wire details on file.</li>
          )}
          {referral.type === 'ambassador' && (
            <li>Ambassadors get early access, swag drops, and an Ambassador badge — no cash payouts.</li>
          )}
          {referral.type === 'user' && (
            <li>Casual share links don't earn commission, but you still earn our gratitude (and karma).</li>
          )}
        </ul>
      </section>
    </div>
  )
}

function CodePrompt({ initialCode, onSubmit, error }: { initialCode: string; onSubmit: (code: string) => void; error?: string }) {
  const [value, setValue] = useState(initialCode)
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Referrer dashboard
        </span>
        <h1 className="text-heading-responsive-lg text-foreground">
          Check your referral stats.
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
          Paste the code from your referral confirmation email, or open this page with <span className="font-mono">?code=YOUR_CODE</span>.
        </p>
      </header>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim().length > 0) onSubmit(value.trim())
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="ALEX-2026"
          className="h-12 flex-1 rounded-xl border border-border bg-background px-4 font-mono text-base uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Button variant="primary" size="md" responsive>
          Open dashboard
        </Button>
      </form>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Don't have a code yet?{' '}
        <Link to="/referrals" className="underline underline-offset-2 hover:text-foreground">
          Apply to a referral program
        </Link>.
      </p>
    </div>
  )
}

export default function ReferralsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const code = (searchParams.get('code') || '').toUpperCase()
  const { data: referral, isLoading, isError } = useReferralDashboard(code)

  const handleSubmit = useCallback((next: string) => {
    setSearchParams({ code: next.toUpperCase() })
  }, [setSearchParams])

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Referrer dashboard"
        description="Track your Oxy referral clicks, signups, and commission in one place."
        canonicalPath="/referrals/dashboard"
      />
      <Navbar />

      <main className="flex-1">
        <section className="container">
          <div>
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-14">
                {!code && <CodePrompt initialCode="" onSubmit={handleSubmit} />}
                {code && isLoading && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
                {code && !isLoading && (isError || !referral) && (
                  <CodePrompt
                    initialCode={code}
                    onSubmit={handleSubmit}
                    error={`No active referral with code "${code}". Double-check the spelling.`}
                  />
                )}
                {code && referral && <DashboardContent referral={referral} />}
              </div>
            </div>
          </div>
        </section>
      </main>

      <KeepUpToDateSection />
      <Footer />
    </div>
  )
}
