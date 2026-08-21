import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button as BloomButton } from '@oxyhq/bloom/button'
import { StarFour, PlugsConnected, Unite, Cpu } from '@phosphor-icons/react'
import { useFairCoinStats, useNewsroomPosts } from '../../api/hooks'
import type { FairCoinStats } from '../../api/faircoinStore'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import { useTranslation } from '../../lib/i18n'

/**
 * FairCoin on the home page: the live chain, the latest post, and the three
 * places to go next.
 *
 * The scope is `.faircoin-theme` (see `src/theme/brands.ts`), so the green is
 * FairCoin's own seed rather than a hex written down here. The band paints
 * itself in that palette's SURFACE tokens and spends the green on the accents —
 * the mark, the numbers, the one solid button. FairCoin's primary is a lime
 * bright enough to be a highlighter; a full bleed of it reads as a warning
 * banner and sits nothing like the rest of this page.
 */

const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/*
 * Short forms, the way a balance is written: 378,995,651 reads as a length
 * before it reads as a number. Below a thousand there is nothing to shorten, so
 * those keep their decimals, which is the only place a difficulty's fraction
 * still means anything.
 */
function formatStat(value: number, decimals: number): string {
  if (Math.abs(value) >= 1000) return COMPACT.format(value)
  // `maximumFractionDigits`, not `toFixed`: the count-up starts at zero, and a
  // stat declaring four decimals would open on "0.0000".
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value)
}

function AnimatedStat({ end, decimals, duration = 2000 }: { end: number; decimals: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let rafId = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setValue(parseFloat((ease * end).toFixed(decimals)))
        if (t < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [end, decimals, duration])

  return <span ref={ref}>{formatStat(value, decimals)}</span>
}

type FairCoinStatKey = 'blocks' | 'hashrate' | 'peers' | 'difficulty'

const STAT_META: { key: FairCoinStatKey; labelKey: string; decimals: number; Icon: typeof StarFour }[] = [
  { key: 'blocks', labelKey: 'home.faircoinBlocks', decimals: 0, Icon: StarFour },
  { key: 'hashrate', labelKey: 'home.faircoinNetwork', decimals: 0, Icon: PlugsConnected },
  { key: 'peers', labelKey: 'home.faircoinPeers', decimals: 0, Icon: Unite },
  { key: 'difficulty', labelKey: 'home.faircoinDifficulty', decimals: 4, Icon: Cpu },
]

function toDisplayValues(stats: FairCoinStats | null): Record<FairCoinStatKey, number> {
  if (!stats) return { blocks: 0, hashrate: 0, peers: 0, difficulty: 0 }
  return {
    blocks: stats.blocks,
    hashrate: stats.networkHashPs / 1000,
    peers: stats.connections,
    difficulty: stats.difficulty,
  }
}

const LINKS = [
  { href: 'https://buy.fairco.in', labelKey: 'home.faircoinBuy', solid: true },
  { href: 'https://explorer.fairco.in', labelKey: 'home.faircoinExplorer', solid: false },
  { href: 'https://fairco.in', labelKey: 'home.faircoinLearnMore', solid: false },
]

const FAIRCOIN_PRIMARY_BUTTON_STYLE = {
  backgroundColor: 'var(--color-primary)',
  borderColor: 'var(--color-primary)',
  color: 'var(--color-primary-foreground)',
}

const FAIRCOIN_OUTLINE_BUTTON_STYLE = {
  backgroundColor: 'transparent',
  borderColor: 'var(--color-border)',
  color: 'var(--color-foreground)',
}

const NEWS_DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const FALLBACK_NEWS_IMAGE = '/images/landing/faircoin-store.png'

export default function FairCoinSection() {
  const { t, locale } = useTranslation()
  const stats = useFairCoinStats()
  const values = toDisplayValues(stats)
  // Re-running the count-up is the whole interaction: a cell is a button that
  // replays its own number.
  const [runs, setRuns] = useState(() => STAT_META.map(() => 0))

  // The newsroom endpoint orders filtered posts by publishedAt descending, so
  // the first result is always the latest published FairCoin story.
  const { data: newsData } = useNewsroomPosts({ tag: 'faircoin', limit: 1 })
  const post = newsData?.posts?.[0]
  const newsImage = (post && typeof post.coverImage === 'string' && post.coverImage) || FALLBACK_NEWS_IMAGE
  const newsTitle = post?.title ?? t('home.faircoinNewsFallback')
  const newsDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale, NEWS_DATE_FORMAT)
    : ''
  const newsHref = post?.slug ? `/newsroom/${post.slug}` : null

  const newsCell = (
    <>
      <div className="min-h-0 flex-1 overflow-hidden">
        <img
          src={newsImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={600}
          height={400}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex shrink-0 flex-col p-5 lg:p-6">
        <span className="mb-1 block text-label-sm font-bold uppercase tracking-wider text-primary">{newsDate}</span>
        <p className="font-display line-clamp-3 text-xl font-semibold leading-snug lg:text-2xl">{newsTitle}</p>
      </div>
    </>
  )
  // Same cell whether or not there is a post to link to, so the two readings of
  // it cannot drift apart.
  const newsCellClass = 'group flex min-h-[280px] flex-col overflow-hidden bg-surface'

  return (
    <section className="faircoin-theme bg-background text-foreground">
      <div className="container flex flex-col gap-4 pb-4 lg:pb-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="flex flex-col justify-center gap-4 bg-background py-8 lg:col-span-3 lg:py-10">
            <img
              src="/images/apps/faircoin.svg"
              alt="FairCoin"
              className="size-8 object-contain"
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
            />
            <AnimatedTitle as="h2" className="text-heading-responsive-lg">
              {t('home.faircoinTitle')}
            </AnimatedTitle>
            <p className="max-w-[540px] text-muted-foreground">
              {t('home.faircoinDescription')}
            </p>
            <div className="flex flex-wrap gap-3">
              {LINKS.map((link) => (
                <BloomButton
                  key={link.labelKey}
                  asChild
                  variant={link.solid ? 'primary' : 'outline'}
                  size="md"
                  style={link.solid ? FAIRCOIN_PRIMARY_BUTTON_STYLE : FAIRCOIN_OUTLINE_BUTTON_STYLE}
                >
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {t(link.labelKey)}
                  </a>
                </BloomButton>
              ))}
            </div>
          </div>

          {newsHref ? (
            <Link
              to={newsHref}
              className={`${newsCellClass} lg:col-span-1`}
            >
              {newsCell}
            </Link>
          ) : (
            <div className={`${newsCellClass} lg:col-span-1`}>
              {newsCell}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STAT_META.map((stat, i) => (
            <button
              type="button"
              key={stat.key}
              className="flex cursor-pointer select-none items-center gap-3 rounded-full bg-surface px-4 py-4 text-left transition-colors hover:bg-foreground/5 lg:px-5 lg:py-5"
              onClick={() => setRuns((r) => r.map((v, j) => (j === i ? v + 1 : v)))}
            >
              <stat.Icon size={20} className="shrink-0 text-primary" weight="bold" />
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(stat.labelKey)}
                </span>
                <span className="block text-3xl font-bold leading-tight lg:text-3xl">
                  <AnimatedStat key={`${runs[i]}-${values[stat.key]}`} end={values[stat.key]} decimals={stat.decimals} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
