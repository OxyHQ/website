import { useState, useMemo } from 'react'
import { careersHero } from '../../data/careers'

const avatarColors = ['#266DF0', '#9162F9', '#FD9038']

interface HoverCard {
  title: string
  description: string
  tags: { label: string; bg: string; border: string; color: string }[]
}

const hoverCards: HoverCard[] = [
  {
    title: 'View contributing data',
    description: 'Added the ability for users to view contributing data for Insight reports, so they can drill-down into underlying records or segments.',
    tags: [
      { label: 'Design', bg: 'rgb(255,243,204)', border: 'rgb(255,210,105)', color: 'rgb(82,56,23)' },
      { label: 'Enhancement', bg: 'rgb(245,240,255)', border: 'rgb(216,196,255)', color: 'rgb(69,41,125)' },
    ],
  },
  {
    title: 'Automated lead scoring',
    description: 'Deploy AI-powered lead scoring that automatically evaluates and prioritizes leads based on engagement signals and fit criteria.',
    tags: [
      { label: 'Feature', bg: 'rgb(229,238,255)', border: 'rgb(194,214,255)', color: 'rgb(43,62,109)' },
      { label: 'AI', bg: 'rgb(224,252,237)', border: 'rgb(167,242,207)', color: 'rgb(36,74,58)' },
    ],
  },
  {
    title: 'Real-time pipeline sync',
    description: 'Sync pipeline data in real-time across all connected tools, ensuring your team always has the latest information.',
    tags: [
      { label: 'Engineering', bg: 'rgb(229,238,255)', border: 'rgb(194,214,255)', color: 'rgb(43,62,109)' },
      { label: 'Data', bg: 'rgb(245,240,255)', border: 'rgb(216,196,255)', color: 'rgb(69,41,125)' },
    ],
  },
  {
    title: 'Custom workflow builder',
    description: 'Build complex automation workflows with a visual builder that supports branching, conditions, and integrations.',
    tags: [
      { label: 'Product', bg: 'rgb(255,243,204)', border: 'rgb(255,210,105)', color: 'rgb(82,56,23)' },
      { label: 'Feature', bg: 'rgb(229,238,255)', border: 'rgb(194,214,255)', color: 'rgb(43,62,109)' },
    ],
  },
  {
    title: 'Multi-language support',
    description: 'Full internationalization support across the platform, enabling teams worldwide to work in their preferred language.',
    tags: [
      { label: 'Enhancement', bg: 'rgb(245,240,255)', border: 'rgb(216,196,255)', color: 'rgb(69,41,125)' },
      { label: 'Reports', bg: 'rgb(224,252,237)', border: 'rgb(167,242,207)', color: 'rgb(36,74,58)' },
    ],
  },
  {
    title: 'Advanced reporting engine',
    description: 'Create real-time, detailed reports that scale with your data. Visualize, customize, and get deep insights in seconds.',
    tags: [
      { label: 'Design', bg: 'rgb(255,243,204)', border: 'rgb(255,210,105)', color: 'rgb(82,56,23)' },
      { label: 'Reports', bg: 'rgb(224,252,237)', border: 'rgb(167,242,207)', color: 'rgb(36,74,58)' },
    ],
  },
  {
    title: 'Call intelligence insights',
    description: 'AI automatically picks up buying signals, blockers, and feature requests during calls — not days later.',
    tags: [
      { label: 'AI', bg: 'rgb(224,252,237)', border: 'rgb(167,242,207)', color: 'rgb(36,74,58)' },
      { label: 'Feature', bg: 'rgb(229,238,255)', border: 'rgb(194,214,255)', color: 'rgb(43,62,109)' },
    ],
  },
  {
    title: 'Flexible data model',
    description: 'Build custom objects, attributes, and relationships that perfectly mirror how your business actually works.',
    tags: [
      { label: 'Engineering', bg: 'rgb(229,238,255)', border: 'rgb(194,214,255)', color: 'rgb(43,62,109)' },
      { label: 'Product', bg: 'rgb(255,243,204)', border: 'rgb(255,210,105)', color: 'rgb(82,56,23)' },
    ],
  },
]

/** Deterministic pseudo-random from a seed */
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

// Exact column counts from original: 53 columns, 268 total squircles
const columnCounts = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  2,2,2,2,2,2,2,2,
  3,3,3,3,3,3,
  4,4,4,4,
  5,5,5,5,
  6,6,
  7,7,
  8,8,
  9,10,11,12,13,14,15,17,19,21,
]

interface SquircleCell {
  id: string
  cardIndex: number | null
}

interface Column {
  cells: SquircleCell[]
}

function buildGrid(): Column[] {
  let cardSlot = 0

  return columnCounts.map((numSquircles, colIndex) => {
    const cells: SquircleCell[] = []
    for (let r = 0; r < numSquircles; r++) {
      const id = `${colIndex}-${r}`
      // ~12% of cells get a hover card
      const hasCard = seededRandom(colIndex * 31 + r * 17) > 0.88
      cells.push({
        id,
        cardIndex: hasCard ? cardSlot++ % hoverCards.length : null,
      })
    }
    return { cells }
  })
}

export default function CareersHeroSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const columns = useMemo(() => buildGrid(), [])

  return (
    <section className="container relative max-lg:overflow-hidden">
      <div className="relative grid w-full grid-cols-12 gap-x-6 lg:border-subtle-stroke lg:border-x">
        {/* Left content */}
        <div className="relative col-span-full row-1 lg:col-[2/-2]">
          <header
            className="flex w-full flex-col max-xl:pt-25 max-lg:pt-20 max-lg:items-center py-36 pb-48 max-lg:pb-20"
            style={{ '--animate-delay': '0ms', '--animate-delay-mobile': '0ms' } as React.CSSProperties}
          >
            <div className="inline-block w-fit rounded-[13px] border border-weak-stroke bg-primary-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-secondary-foreground mb-6">
              <h1>{careersHero.badge}</h1>
            </div>

            <h2 className="max-w-[15em] text-balance text-heading-responsive-lg max-lg:text-center">
              {careersHero.title}
            </h2>

            <p className="mt-4 max-w-xl text-balance text-lg text-secondary-foreground lg:text-xl max-lg:text-center">
              {careersHero.subtitle}
            </p>

            <div className="mt-7 flex w-auto items-center gap-x-3 gap-y-4 max-lg:flex-col">
              <button className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-9 gap-x-1.5 rounded-[10px] px-3 text-sm max-lg:h-11.5 max-lg:gap-x-2 max-lg:rounded-xl max-lg:px-3.5 max-lg:text-base button-primary">
                Join the team
              </button>

              {/* Avatar stack */}
              <div className="group flex">
                {avatarColors.map((color, i) => (
                  <div
                    key={i}
                    className="relative -mr-2 size-[36px] rounded-full border lg:size-7 lg:group-hover:mr-0.5 transition-all duration-150 ease-out lg:hover:z-10 lg:hover:scale-[1.12]"
                    style={{ borderColor: color, transitionDelay: `${i * 25}ms` }}
                  >
                    <div className="h-full w-full overflow-hidden rounded-full border border-white-100">
                      <div className="h-full w-full rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} />
                    </div>
                  </div>
                ))}
                {/* Count badge */}
                <div className="relative size-[36px] rounded-full border border-subtle-stroke lg:size-7 transition-transform duration-150 ease-out hover:z-10 lg:hover:scale-[1.12]">
                  <div className="h-full w-full rounded-full">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FBFBFB] text-[#75777C]">
                    <span className="lg:text-[10px] lg:leading-[14px] text-[12px] tabular-nums leading-[16px] tracking-tighter">
                      +127
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Right — squircle staircase grid (desktop only) */}
        <div className="col-[2/-1] row-1 hidden flex-col overflow-x-clip pt-36 pb-16 lg:flex">
          <div className="min-h-[392px] lg:min-h-[504px]">
            <div className="flex justify-end" style={{ minHeight: 504 }}>
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className="flex flex-col-reverse"
                style={{ flex: '0 0 24px' }}
              >
                {column.cells.map((cell) => {
                  const card =
                    cell.cardIndex !== null
                      ? hoverCards[cell.cardIndex]
                      : null
                  const isHovered = hoveredId === cell.id

                  return (
                    <div
                      key={cell.id}
                      className="px"
                      style={{ height: 24, width: 24, opacity: 1, transform: 'none' }}
                    >
                      <div className="relative size-[22px]">
                        <div
                          onMouseEnter={() => card && setHoveredId(cell.id)}
                          onMouseLeave={() => card && setHoveredId(null)}
                          className={`relative size-[22px] rounded-md z-[1] before:absolute before:-inset-px transition-colors duration-150 ${
                            isHovered ? 'bg-white-500' : 'bg-white-700'
                          } ${card ? 'cursor-pointer hover:bg-white-500' : ''}`}
                        />

                        {/* Hover card popover */}
                        {isHovered && card && (
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-[101] mb-2 w-[280px] rounded-xl bg-primary-background p-2.5 shadow-[0px_0px_0px_1px_rgba(28,40,64,0.05),_0px_4px_8px_-4px_rgba(28,40,64,0.12),_0px_4px_12px_-2px_rgba(28,40,64,0.16)]">
                            <div className="flex w-full flex-col gap-0.5">
                              {/* Image placeholder */}
                              <div className="relative mb-2 w-full">
                                <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-white-300 to-white-500" />
                                <div className="absolute inset-0 rounded-lg ring-1 ring-default-stroke/40 ring-inset" />
                              </div>
                              <p className="font-semibold text-primary-foreground text-sm">{card.title}</p>
                              <p className="text-sm text-tertiary-foreground leading-tight">{card.description}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {card.tags.map((tag) => (
                                  <span
                                    key={tag.label}
                                    className="inline-block rounded-lg border px-1.5 py-0.5 text-xs"
                                    style={{
                                      backgroundColor: tag.bg,
                                      borderColor: tag.border,
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
