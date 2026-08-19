import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button as BloomButton } from '@oxyhq/bloom/button'
import { StarFour, PlugsConnected, Unite, Cpu } from '@phosphor-icons/react'
import { useFairCoinStats, useNewsroomPosts } from '../../api/hooks'
import type { FairCoinStats } from '../../api/faircoinStore'
import { AnimatedTitle } from '../ui/AnimatedTitle'

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

const STAT_META: { key: FairCoinStatKey; label: string; decimals: number; Icon: typeof StarFour }[] = [
  { key: 'blocks', label: 'Current blocks', decimals: 0, Icon: StarFour },
  { key: 'hashrate', label: 'Network (KH/s)', decimals: 0, Icon: PlugsConnected },
  { key: 'peers', label: 'Active peers', decimals: 0, Icon: Unite },
  { key: 'difficulty', label: 'Difficulty', decimals: 4, Icon: Cpu },
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
  { href: 'https://buy.fairco.in', label: 'Buy', solid: true },
  { href: 'https://explorer.fairco.in', label: 'Explorer', solid: false },
  { href: 'https://fairco.in', label: 'Learn more', solid: false },
]

const NEWS_DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const FALLBACK_NEWS_IMAGE = '/images/landing/faircoin-store.png'

export default function FairCoinSection() {
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
  const newsTitle = post?.title ?? 'Empowering local stores with FairCoin'
  const newsDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', NEWS_DATE_FORMAT)
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
  const newsCellClass = 'group flex min-h-[320px] flex-col overflow-hidden bg-surface'

  return (
    <section className="faircoin-theme bg-background text-foreground">
      <div className="border-t border-border">
        <div className="container">
          <div className="grid gap-px border-border bg-border lg:grid-cols-4 lg:border-x">
            <div className="flex flex-col justify-center gap-5 bg-background px-6 py-12 lg:col-span-3 lg:px-12 lg:py-16">
              <p className="text-label-sm font-bold uppercase tracking-widest text-primary">FairCoin</p>
              <AnimatedTitle as="h2" className="text-heading-responsive-lg">
                FairCoin today.
              </AnimatedTitle>
              <p className="max-w-[540px] text-muted-foreground">
                A currency built for cooperation rather than speculation: mined without a race to burn power, held by
                the people who use it, and open for anyone to audit block by block.
              </p>
              <div className="flex flex-wrap gap-3">
                {LINKS.map((link) => (
                  <BloomButton
                    key={link.label}
                    asChild
                    variant={link.solid ? 'primary' : 'outline'}
                    size="md"
                  >
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
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

          {/*
            One hairline between every pair of cells, whichever way they wrap:
            the grid's own gap shows the rule through, so two columns and four
            columns need no separate border rules.
          */}
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:grid-cols-4 lg:border-x">
            {STAT_META.map((stat, i) => (
              <button
                type="button"
                key={stat.key}
                className="flex cursor-pointer select-none items-center gap-3 bg-background px-5 py-5 text-left transition-colors hover:bg-foreground/5 lg:px-6 lg:py-6"
                onClick={() => setRuns((r) => r.map((v, j) => (j === i ? v + 1 : v)))}
              >
                <stat.Icon size={20} className="shrink-0 text-primary" weight="bold" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </span>
                  <span className="block text-3xl font-bold leading-tight lg:text-3xl">
                    <AnimatedStat key={`${runs[i]}-${values[stat.key]}`} end={values[stat.key]} decimals={stat.decimals} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
