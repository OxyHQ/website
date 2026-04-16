import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fc } from '../../../lib/faircoin-links'

interface WizardStep {
  id: string
  label: string
}

interface AppShellProps {
  /** Section eyebrow shown above the heading (e.g. "Buy FAIR"). */
  eyebrow?: string
  /** App heading shown above the wizard stepper. */
  title: string
  /** One-line subtitle below the title. */
  subtitle?: string
  /** Wizard steps in order — pass `currentStep` to mark which is active. */
  steps?: readonly WizardStep[]
  /** Index of the active step; previous steps render as completed. */
  currentStep?: number
  /** Card body — typically the wizard content. */
  children: ReactNode
  /** Optional small actions rendered next to the title (e.g. "Connect wallet"). */
  toolbar?: ReactNode
  /** Optional muted note rendered under the card (e.g. "advanced users…"). */
  footnote?: ReactNode
}

/**
 * Focused app-feel layout wrapper used by `/buy` and `/unwrap`.
 *
 * The page chrome (Navbar/Footer) stays put; this component owns the centered
 * card area and a small wizard stepper, so transactional flows feel like a
 * crypto-app card (Uniswap swap, Stripe checkout) rather than a marketing
 * page section.
 */
export default function AppShell({
  eyebrow,
  title,
  subtitle,
  steps,
  currentStep = 0,
  children,
  toolbar,
  footnote,
}: AppShellProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-primary/[0.08] via-primary/[0.02] to-transparent" />
        <div className="absolute left-1/2 top-24 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[560px] flex-col px-4 pb-16 pt-10 sm:pt-14 lg:pt-20">
        {/* Header */}
        <header className="mb-6 flex flex-col items-center text-center sm:mb-8">
          {eyebrow ? (
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-balance text-2xl font-semibold leading-tight text-foreground sm:text-[28px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-[420px] text-pretty text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
          {toolbar ? <div className="mt-5">{toolbar}</div> : null}
        </header>

        {/* Step indicator */}
        {steps && steps.length > 1 ? (
          <nav
            aria-label="Progress"
            className="mb-4 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            {steps.map((step, idx) => {
              const done = idx < currentStep
              const active = idx === currentStep
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <span
                    className={[
                      'flex h-6 min-w-6 items-center justify-center rounded-full border px-2 transition-all duration-300',
                      done
                        ? 'border-primary bg-primary text-primary-foreground'
                        : active
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-background/60 text-muted-foreground/70',
                    ].join(' ')}
                  >
                    <span className="text-[10px]">{idx + 1}</span>
                    <span className="ml-1.5 hidden text-[10px] sm:inline">{step.label}</span>
                  </span>
                  {idx < steps.length - 1 ? (
                    <span
                      aria-hidden
                      className={[
                        'h-px w-6 transition-colors duration-300 sm:w-10',
                        done ? 'bg-primary/60' : 'bg-border',
                      ].join(' ')}
                    />
                  ) : null}
                </div>
              )
            })}
          </nav>
        ) : null}

        {/* Card */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-b from-primary/30 via-border to-border opacity-60 blur-[2px]" />
          <div className="relative rounded-[28px] border border-border bg-popover/95 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6">
            {children}
          </div>
        </div>

        {footnote ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">{footnote}</p>
        ) : null}

        <p className="mt-8 text-center text-xs text-muted-foreground/70">
          <Link to={fc('/')} className="underline-offset-4 hover:text-muted-foreground hover:underline">
            ← Back to FairCoin
          </Link>
        </p>
      </div>
    </section>
  )
}
