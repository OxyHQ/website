import { useState, useMemo } from 'react'
import { careersHero } from '../../data/careers'

const avatarColors = ['#266DF0', '#9162F9', '#FD9038']

const teamMembers = [
  { name: 'Alex', flag: '\u{1F1EC}\u{1F1E7}', dept: 'Marketing' },
  { name: 'Sofia', flag: '\u{1F1F8}\u{1F1EA}', dept: 'Engineering' },
  { name: 'James', flag: '\u{1F1EC}\u{1F1E7}', dept: 'Design' },
  { name: 'Maria', flag: '\u{1F1EA}\u{1F1F8}', dept: 'Product' },
  { name: 'David', flag: '\u{1F1FA}\u{1F1F8}', dept: 'Sales' },
  { name: 'Emma', flag: '\u{1F1EC}\u{1F1E7}', dept: 'Engineering' },
  { name: 'Lucas', flag: '\u{1F1E9}\u{1F1EA}', dept: 'Engineering' },
  { name: 'Priya', flag: '\u{1F1EE}\u{1F1F3}', dept: 'Product' },
]

/** Deterministic pseudo-random from a seed */
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

// Column definitions: [numSquircles, isHidden]
const columnDefs: [number, boolean][] = [
  [1, true], [1, true], [1, true], [1, true], [1, true],
  [1, true], [1, true], [1, true], [1, true], [1, true],
  [1, false], [1, false], [1, false], [1, false], [1, false],
  [2, false], [2, false], [2, false], [2, false], [2, false],
  [3, false], [3, false], [3, false], [3, false],
  [4, false], [4, false],
  [5, false], [5, false], [5, false],
  [6, false], [6, false], [7, false], [7, false], [8, false],
]

interface SquircleCell {
  id: string
  memberIndex: number | null
}

interface Column {
  cells: SquircleCell[]
  hidden: boolean
}

function buildGrid(): Column[] {
  let memberSlot = 0

  return columnDefs.map(([numSquircles, isHidden], colIndex) => {
    const cells: SquircleCell[] = []
    for (let r = 0; r < numSquircles; r++) {
      const id = `${colIndex}-${r}`
      // ~15% of visible cells get a team member hover card
      const hasMember = !isHidden && seededRandom(colIndex * 31 + r * 17) > 0.85
      cells.push({
        id,
        memberIndex: hasMember ? memberSlot++ % teamMembers.length : null,
      })
    }
    return { cells, hidden: isHidden }
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
                className={`flex flex-col-reverse${column.hidden ? ' hidden' : ''}`}
                style={{ flex: '0 0 24px' }}
              >
                {column.cells.map((cell) => {
                  const member =
                    cell.memberIndex !== null
                      ? teamMembers[cell.memberIndex]
                      : null
                  const isHovered = hoveredId === cell.id

                  return (
                    <div
                      key={cell.id}
                      style={{ height: 24, width: 24, opacity: 1, transform: 'none' }}
                    >
                      <div className="relative size-[22px]">
                        <div
                          onMouseEnter={() => member && setHoveredId(cell.id)}
                          onMouseLeave={() => member && setHoveredId(null)}
                          className={`relative size-[22px] rounded-md z-[1] before:absolute before:-inset-px transition-colors duration-150 ${
                            isHovered
                              ? 'bg-white-500'
                              : 'bg-white-700'
                          } ${member ? 'cursor-pointer hover:bg-white-500' : ''}`}
                        />

                        {/* Hover tooltip */}
                        {isHovered && member && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-xl bg-primary-background border border-subtle-stroke px-3 py-2 shadow-lg">
                            <div className="flex items-center justify-center gap-1 text-secondary-foreground text-sm">
                              {member.name} {member.flag} {member.dept}
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
