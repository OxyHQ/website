import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Fingerprint, Sparkle, Stack, Cube, Cloud, Compass } from '@phosphor-icons/react'
import { AnimatedTitle } from '../ui/AnimatedTitle'

/* ──────────────────────────────────────────────
 * EcosystemStack
 *
 * The platform drawn as the blocks it is made of: identity at the top, the
 * layers that sit on it, and Oxy itself closing the shape at the bottom. Each
 * block is a link, each row is offset from the one above, and the empty squares
 * between them are what makes the outline read as one figure rather than as a
 * table of cards.
 *
 * The blocks arrive one after another the first time the section is seen, in
 * DOM order — `--i` on each block is its place in that queue, and the delay is
 * a multiple of it (see `.stack-block` in `index.css`).
 * ──────────────────────────────────────────── */

interface StackBlock {
  title: string
  description?: string
  href: string
  icon: ReactNode
  /** Bloom's chart family: the one sanctioned way to have five distinct hues. */
  tone: string
  /** Size and place in its row. */
  className: string
  /** Where it leans when the pointer is on it. */
  hover: string
  origin?: string
  innerClass?: string
  dot?: 'top-left' | 'top-right'
}

const ICON = { size: 18, weight: 'bold' } as const

const ROW_ONE: StackBlock[] = [
  {
    title: 'Oxy ID',
    description: 'One identity across everything Oxy builds.',
    href: '/products/oxy-id',
    icon: <Fingerprint {...ICON} />,
    tone: 'bg-chart-1 text-background',
    className: 'h-34 w-full lg:h-50 lg:w-100',
    hover: 'lg:group-hover:-translate-x-10',
    origin: 'origin-bottom-right',
  },
]

const ROW_TWO: StackBlock[] = [
  {
    title: 'Oxy AI',
    description: 'Private models, an API and the SDKs around them.',
    href: '/ai',
    icon: <Sparkle {...ICON} />,
    tone: 'bg-chart-2 text-background',
    className: 'h-40 w-1/2 lg:h-50 lg:w-50',
    hover: 'lg:group-hover:-translate-x-10',
    origin: 'origin-bottom-left',
  },
  {
    title: 'Bloom',
    description: 'The design system every app is built from.',
    href: '/developers/docs/bloom',
    icon: <Stack {...ICON} />,
    tone: 'bg-chart-3 text-background',
    className: 'h-40 w-1/2 lg:h-50 lg:w-50',
    hover: 'lg:group-hover:translate-x-10',
    origin: 'origin-bottom-right',
    innerClass: 'border-l-0',
  },
  {
    title: 'The apps',
    href: '/technologies',
    icon: <Compass {...ICON} />,
    tone: 'bg-chart-5 text-background',
    className: 'h-30 w-full lg:h-50 lg:w-50',
    hover: 'lg:group-hover:rotate-12',
    origin: 'origin-bottom-right',
    dot: 'top-left',
  },
]

const ROW_THREE: StackBlock[] = [
  {
    title: 'Open source',
    href: 'https://github.com/OxyHQ',
    icon: <Cube {...ICON} />,
    tone: 'bg-foreground text-background',
    className: 'z-20 h-30 w-full lg:h-50 lg:w-50',
    hover: 'lg:group-hover:translate-x-20',
    dot: 'top-right',
  },
  {
    title: 'Infrastructure',
    description: 'The servers, the storage and the pipes underneath.',
    href: '/developers',
    icon: <Cloud {...ICON} />,
    tone: 'bg-chart-4 text-background',
    className: 'z-20 h-40 w-full shrink-0 lg:h-50 lg:w-100',
    hover: 'lg:group-hover:translate-x-20',
  },
]

const ROW_FOUR: StackBlock[] = [
  {
    title: 'Oxy',
    description: 'An open institution, and the technology it runs on.',
    href: '/company/charter',
    icon: <Fingerprint {...ICON} />,
    tone: 'bg-foreground text-background',
    className: 'h-34 w-full lg:h-50 lg:w-100',
    hover: 'lg:group-hover:translate-x-10',
    origin: 'origin-top-left',
  },
]

export default function EcosystemStack() {
  const [inView, setInView] = useState(false)

  // React 19 callback ref with cleanup: it owns the observer, and the observer
  // disconnects itself the first time the section is seen.
  const watch = useCallback((node: HTMLElement | null) => {
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        observer.disconnect()
      },
      { threshold: 0.1 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // One counter across every row, so the blocks arrive in the order they read.
  let order = 0
  const next = () => order++

  return (
    <>
      <section className="w-full border-t border-border bg-surface px-4 text-foreground lg:px-10">
        <div className="mx-auto flex h-auto w-full max-w-(--layout-max-width) flex-col items-center justify-center pb-10 pt-10 lg:pt-40">
          <AnimatedTitle
            as="h2"
            className="max-w-5xl text-center font-display text-[clamp(2.5rem,5.4vw,5.375rem)] font-medium leading-[0.98] tracking-[-0.045em]"
          >
            Do it all with Oxy.
          </AnimatedTitle>
        </div>
      </section>

      <section
        ref={watch}
        className={`stack-section relative flex min-h-[calc(100dvh-270px)] flex-col items-center justify-center overflow-hidden bg-surface px-4 text-foreground md:px-10 ${
          inView ? 'in-view' : ''
        }`}
      >
        <div className="w-full pb-10 pt-10 lg:pb-20 lg:pt-20">
          <div className="flex w-full translate-y-1 items-end justify-center lg:-translate-x-9">
            <StackSpacer
              index={next()}
              className="absolute hidden size-15 shrink-0 -translate-x-10 rotate-45 border border-border bg-background lg:relative lg:block"
            />
            {ROW_ONE.map((block) => (
              <StackTile key={block.title} block={block} index={next()} />
            ))}
          </div>

          <div className="flex w-full translate-y-0.5 flex-row flex-wrap items-end justify-center lg:translate-x-8.5 lg:flex-nowrap">
            <StackSpacer
              index={next()}
              dot="top-left"
              className="hidden aspect-square h-50 shrink-0 border border-r-0 border-border bg-background lg:block"
            />
            <StackTile block={ROW_TWO[0]} index={next()} />
            <StackTile block={ROW_TWO[1]} index={next()} />
            <div className="hidden w-20 shrink-0 lg:block" />
            <StackTile block={ROW_TWO[2]} index={next()} />
          </div>

          <div className="flex w-full translate-y-px flex-row flex-wrap items-end justify-center lg:translate-x-6 lg:flex-nowrap">
            <StackTile block={ROW_THREE[0]} index={next()} />
            <StackSpacer
              index={next()}
              className="hidden aspect-square h-20 shrink-0 border border-x-0 border-border bg-background lg:block"
            />
            <StackTile block={ROW_THREE[1]} index={next()} />
          </div>

          <div className="flex w-full items-start justify-center lg:-translate-x-10">
            <StackSpacer
              index={next()}
              className="hidden size-15 shrink-0 translate-x-10 -rotate-45 border border-border bg-background lg:block"
            />
            {ROW_FOUR.map((block) => (
              <StackTile key={block.title} block={block} index={next()} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function dotClass(dot: StackBlock['dot']): string {
  if (dot === 'top-left') return 'stack-dot-top-left'
  if (dot === 'top-right') return 'stack-dot-top-right'
  return ''
}

function StackTile({ block, index }: { block: StackBlock; index: number }) {
  const face = (
    <div
      className={`flex h-full w-full flex-col items-start justify-between border border-border bg-background p-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:shadow-[8px_8px_0_var(--color-border)] ${block.origin ?? ''} ${block.hover} ${block.innerClass ?? ''}`}
    >
      <span className={`flex size-8 items-center justify-center ${block.tone}`}>{block.icon}</span>
      <span className="block">
        <span className="block text-[clamp(1.375rem,1.8vw,1.875rem)] leading-none tracking-[-0.035em]">
          {block.title}
        </span>
        {block.description ? (
          <span className="mt-1 block max-w-[270px] text-body-sm leading-[1.25] text-muted-foreground">
            {block.description}
          </span>
        ) : null}
      </span>
    </div>
  )

  const className = `stack-block group relative outline outline-1 -outline-offset-1 outline-border ${dotClass(block.dot)} ${block.className}`
  const style = { '--i': index } as CSSProperties

  if (block.href.startsWith('/')) {
    return (
      <Link to={block.href} className={className} style={style}>
        {face}
      </Link>
    )
  }
  return (
    <a href={block.href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
      {face}
    </a>
  )
}

function StackSpacer({
  index,
  className,
  dot,
}: {
  index: number
  className: string
  dot?: StackBlock['dot']
}) {
  return (
    <div
      aria-hidden="true"
      className={`stack-block relative ${dotClass(dot)} ${className}`}
      style={{ '--i': index } as CSSProperties}
    />
  )
}
