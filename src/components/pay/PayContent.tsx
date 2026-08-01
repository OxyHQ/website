import { motion } from 'framer-motion'
import { PAY_FEATURES } from './data'
import PayAccountsCloud from './PayAccountsCloud'
import PayFAQ from './PayFAQ'
import { CashbackIcon, DotField, ShieldCheckIcon, TrendingIcon } from './PayIcons'
import { ActivityScene, CardArt, CardScene, CashbackScene, SecurityScene, SupportScene, TransfersScene } from './PayScenes'

/** Maps a feature's `scene` key to the mock rendered beside its copy. */
const SCENES = {
  activity: ActivityScene,
  transfers: TransfersScene,
  card: CardScene,
  cashback: CashbackScene,
  security: SecurityScene,
  support: SupportScene,
} as const

const HERO_LINES = [
  ['Money', 'that', 'answers', 'to', 'you,'],
  ['not', 'to', 'an', 'advertiser.'],
]

/** Hero headline — each word rises into place, so the line reads as it lands. */
function HeroHeadline() {
  let word = 0
  return (
    <h1 className="whitespace-pre-line text-balance text-center font-display text-h3 text-fg-primary tablet-lg:text-display" style={{ perspective: '1200px' }}>
      {HERO_LINES.map((line, lineIndex) => (
        <span key={lineIndex}>
          {line.map((text) => {
            const delay = word++ * 0.06
            return (
              <motion.span
                key={text + delay}
                className="relative inline-block"
                initial={{ opacity: 0, y: '0.4em', rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
              >
                {text}
              </motion.span>
            )
          }).reduce<React.ReactNode[]>((acc, node, i) => (i === 0 ? [node] : [...acc, ' ', node]), [])}
          {lineIndex === 0 && <br />}
        </span>
      ))}
    </h1>
  )
}

/**
 * The card-in-envelope hero visual. The source ships this as a WebGL scene; it
 * is drawn here so it costs no runtime and follows the page theme.
 */
function HeroEnvelope() {
  return (
    <motion.div
      aria-label="Envelope with the Oxy Pay Card"
      className="relative aspect-3/2 w-full overflow-hidden tablet:aspect-16/9 tablet-lg:aspect-2/1 tablet-lg:w-188 tablet-lg:max-w-none"
      role="img"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 flex items-end justify-center pb-[8%]">
        {/* The envelope sets the scale; the card is positioned as a share of it,
         * so the pair keeps its proportions at every viewport width. */}
        <div className="relative aspect-[1.62] w-[46%] max-w-[420px]">
          <motion.div
            className="absolute bottom-[44%] left-1/2 aspect-[1.583] w-[80%] -translate-x-1/2"
            animate={{ y: [0, -8, 0], rotate: [-2, -1, -2] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.32))' }}
          >
            <CardArt face="front" />
          </motion.div>
          <div className="absolute inset-0 rounded-[2%] border border-border-normal bg-bg-secondary" style={{ boxShadow: '0 18px 44px rgba(0,0,0,0.14)' }} />
          <div
            className="absolute inset-0 rounded-[2%]"
            style={{
              background: 'linear-gradient(180deg, var(--pay-bg-tertiary) 0%, var(--pay-bg-secondary) 78%)',
              clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/** Shared panel frame for the two full-bleed statement sections. */
function StatementPanel({ align, children }: { align: 'start' | 'end'; children: React.ReactNode }) {
  return (
    <div
      className={`relative mt-10 flex w-full shrink-0 overflow-hidden bg-bg-secondary tablet-lg:col-start-2 tablet-lg:row-span-2 tablet-lg:row-start-1 tablet-lg:mt-0 tablet-lg:max-w-[400px] tablet-lg:self-start ${
        align === 'start' ? 'items-start justify-center' : 'items-end justify-end'
      }`}
    >
      <DotField align={align === 'start' ? 'top' : 'bottom'} />
      {children}
    </div>
  )
}

/** The in-app account screen shown inside the first statement panel. */
function AppScreen() {
  return (
    <div className="relative z-10 w-full px-10 py-12 tablet-lg:px-12 tablet-lg:py-16">
      <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[28px] border border-border-normal bg-bg-primary shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col gap-1 px-5 pt-6 pb-5">
          <span className="text-caption text-fg-secondary">Total balance</span>
          <span className="font-display text-h3 text-fg-primary">$48,203.11</span>
          <span className="text-caption text-fg-secondary">Across 3 pots</span>
        </div>
        <div className="flex flex-col border-border-normal border-t">
          {[
            { label: 'Savings', value: '$8,763.45' },
            { label: 'New House', value: '$22,905.71' },
            { label: 'Emergency', value: '$7,248.21' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-caption text-fg-secondary">{row.label}</span>
              <span className="font-display text-stat-label text-fg-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** The custody seal shown inside the second statement panel. */
function CoverageSeal() {
  return (
    <div className="relative z-10 flex w-full items-center justify-center px-10 py-16">
      <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-full border border-border-normal bg-bg-primary text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <ShieldCheckIcon className="size-8 text-fg-primary" />
        <span className="font-display text-h4 text-fg-primary">Your keys</span>
        <span className="text-caption text-fg-secondary">on your device</span>
      </div>
    </div>
  )
}

export default function PayContent() {
  return (
    <article className="pay-surface container flex flex-1 flex-col gap-14">
      <div className="flex flex-col max-tablet-lg:gap-[50px]">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="-mx-4 flex flex-col items-center py-20 tablet-lg:mx-0 tablet-lg:pt-20 tablet-lg:pb-16">
          <div className="flex w-full flex-col items-center gap-10 tablet-lg:w-164 tablet-lg:max-w-full">
            <HeroHeadline />
            <div className="flex w-full flex-col items-center gap-5 tablet-lg:gap-0">
              <HeroEnvelope />
              <div className="flex w-auto max-w-full flex-col items-center gap-3">
                <p className="whitespace-nowrap text-center text-caption text-fg-secondary tablet-lg:text-[13px] tablet-lg:leading-5 tablet-lg:tracking-normal">
                  <span className="text-fg-primary">In development</span>. Nothing here is open for deposits yet.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://x.com/oxyhqinc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex h-6 min-w-6 items-center justify-center gap-2 rounded-full bg-button-primary px-3 text-nav text-fg-inverted transition-colors hover:bg-button-primary-hover active:bg-button-primary-pressed max-tablet:h-9 max-tablet:min-w-9 max-tablet:px-4 max-tablet:text-button"
                  >
                    <span className="inline-flex items-center whitespace-nowrap">Follow for updates</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Built to earn ────────────────────────────────────── */}
        <section className="border-border-normal border-t py-16 tablet-lg:py-24">
          <div className="flex flex-col tablet-lg:grid tablet-lg:grid-cols-[minmax(0,1fr)_400px] tablet-lg:grid-rows-[auto_1fr] tablet-lg:gap-x-8 tablet-lg:gap-y-3 min-[1220px]:flex min-[1220px]:flex-row min-[1220px]:items-stretch min-[1220px]:gap-8">
            <div className="flex flex-1 flex-col gap-3 tablet-lg:col-start-1 tablet-lg:row-start-1">
              <div className="flex items-center gap-2">
                <span className="size-1 shrink-0 bg-fg-tertiary" />
                <span className="font-display text-h4 text-fg-primary [font-feature-settings:'ss11']">Oxy Pay</span>
              </div>
              <h2 className="text-balance font-display text-h3 [font-feature-settings:'ss11']">
                <span className="text-fg-primary">Built to be understood</span>
                <br />
                <span className="text-fg-secondary">Every movement of money, explained before it happens</span>
              </h2>
            </div>

            <StatementPanel align="start">
              <AppScreen />
            </StatementPanel>

            <div className="mt-8 flex flex-1 flex-col justify-between gap-8 tablet-lg:col-start-1 tablet-lg:row-start-2 tablet-lg:mt-0 tablet-lg:flex-col tablet-lg:items-stretch tablet-lg:justify-between tablet-lg:gap-8">
              <p className="hidden text-balance font-display text-h4 text-fg-secondary tablet-lg:block [font-feature-settings:'ss11']">
                Money apps are opaque by habit, not by necessity. This one states the fee, the rail and the recipient before you confirm.
              </p>
              <div className="flex flex-col gap-5 tablet-lg:gap-4">
                <div className="flex items-center gap-3">
                  <TrendingIcon className="size-5 shrink-0 text-fg-primary" />
                  <span className="font-display text-h4 text-fg-primary">Every fee shown before you confirm</span>
                </div>
                <span className="h-px w-full bg-border-normal" />
                <div className="flex items-center gap-3">
                  <CashbackIcon className="size-5 shrink-0 text-fg-primary" />
                  <span className="font-display text-h4 text-fg-primary">No ads, no data sold, no exceptions</span>
                </div>
                <span className="h-px w-full bg-border-normal" />
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="size-5 shrink-0 text-fg-primary" />
                  <span className="font-display text-h4 text-fg-primary">Keys on your device, not in our database</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Automatic growth ─────────────────────────────────── */}
        <section id="features" className="flex w-full scroll-mt-24 flex-col gap-12 border-border-normal border-t pt-4 pb-4 tablet-lg:pt-20 tablet-lg:pb-30">
          <div className="flex flex-col gap-4 tablet-lg:grid tablet-lg:grid-cols-8 tablet-lg:gap-4">
            <div className="flex items-center gap-2 tablet-lg:col-span-4 tablet-lg:self-start tablet-lg:pt-1">
              <span aria-hidden="true" className="size-1 shrink-0 bg-fg-tertiary" />
              <p className="text-eyebrow text-fg-primary">Money with a purpose</p>
            </div>
            <h2 className="text-balance font-display text-h3 text-fg-primary tablet-lg:col-span-4 tablet-lg:col-start-5">
              Pots for the things you are saving for
              <br />
              <span className="text-fg-secondary">Named, separate and yours to move</span>
            </h2>
          </div>
          <PayAccountsCloud />
        </section>

        {/* ── One app ──────────────────────────────────────────── */}
        <section className="flex w-full flex-col gap-14 border-border-normal border-t pt-[42px] pb-4 tablet-lg:pt-20 tablet-lg:pb-30">
          <div className="flex flex-col">
            <h3 className="text-balance text-h3 text-fg-primary">One app</h3>
            <p className="text-balance text-h3 text-fg-secondary">The whole picture, in plain language</p>
          </div>
          <ol className="flex w-full flex-col gap-12 tablet-lg:grid tablet-lg:grid-cols-8 tablet-lg:gap-x-4 tablet-lg:gap-y-12">
            {PAY_FEATURES.map((feature) => {
              const Scene = SCENES[feature.scene]
              return (
                <li key={feature.index} className="flex flex-col items-stretch gap-4 mobile:grid mobile:grid-cols-2 tablet-lg:contents">
                  <div
                    className={`flex aspect-[3/2] w-full items-center justify-center overflow-hidden bg-bg-secondary transition-opacity duration-500 ease-smooth mobile:aspect-[9/6] tablet-wide:aspect-[11/6] tablet-lg:h-auto tablet-lg:w-auto tablet-lg:order-none ${
                      feature.padded ? 'p-4 tablet-lg:p-6' : 'p-0'
                    } ${feature.mediaClassName} ${feature.mediaOrder}`}
                  >
                    <Scene />
                  </div>
                  <div
                    className={`flex min-w-0 flex-col items-start justify-start gap-3 self-stretch text-balance transition-opacity duration-500 ease-smooth mobile:justify-between mobile:gap-0 tablet-lg:order-none tablet-lg:col-span-2 tablet-lg:pr-px ${feature.copyClassName} ${feature.copyOrder}`}
                  >
                    <span className="text-nav text-fg-tertiary">{feature.index}</span>
                    <div className="flex flex-col items-start gap-1 self-stretch">
                      <h3 className="text-nav text-fg-primary">{feature.title}</h3>
                      <div className="text-body text-fg-secondary">
                        <p>{feature.body}</p>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ── Secured assets ───────────────────────────────────── */}
        <section className="border-border-normal border-t py-16 tablet-lg:py-24">
          <div className="flex flex-col tablet-lg:grid tablet-lg:grid-cols-[minmax(0,1fr)_400px] tablet-lg:grid-rows-[auto_1fr] tablet-lg:gap-x-8 tablet-lg:gap-y-3 min-[1220px]:flex min-[1220px]:flex-row min-[1220px]:items-stretch min-[1220px]:gap-8">
            <div className="flex flex-1 flex-col gap-3 tablet-lg:col-start-1 tablet-lg:row-start-1">
              <div className="flex items-center gap-2">
                <span className="size-1 shrink-0 bg-fg-tertiary" />
                <span className="font-display text-h4 text-fg-primary [font-feature-settings:'ss11']">Custody</span>
              </div>
              <h2 className="text-balance font-display text-h3 [font-feature-settings:'ss11']">
                <span className="text-fg-primary">You will know who holds it</span>
                <br />
                <span className="text-fg-secondary">Named, licensed and published before launch</span>
              </h2>
            </div>

            <StatementPanel align="end">
              <CoverageSeal />
            </StatementPanel>

            <div className="mt-6 flex flex-1 flex-row items-center gap-6 tablet-lg:col-start-1 tablet-lg:row-start-2 tablet-lg:mt-0 tablet-lg:flex-col tablet-lg:items-stretch tablet-lg:justify-between tablet-lg:gap-8">
              <div className="relative size-24 shrink-0 tablet-lg:order-last min-[1220px]:order-none">
                <div className="flex size-24 flex-col items-center justify-center rounded-full border border-border-normal bg-bg-secondary">
                  <span className="font-display text-h4 text-fg-primary">Open</span>
                  <span className="text-caption text-fg-secondary">by default</span>
                </div>
              </div>
              <p className="text-balance text-body text-fg-secondary">
                Who holds the money, under which licence and in which country goes on this page before the first deposit,
                not in a footnote afterwards. The FairCoin side is self-custodied today: the keys are already yours.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <PayFAQ />
      </div>
    </article>
  )
}
