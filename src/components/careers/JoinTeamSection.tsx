import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function JoinTeamSection() {
  const ref = useScrollReveal()

  // Generate placeholder avatar circles
  const avatarColors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316',
    '#3b82f6','#84cc16','#e11d48','#06b6d4','#a855f7','#22c55e','#eab308','#0ea5e9']

  return (
    <section className="container">
      <div className="relative border-subtle-stroke border-x">
        {/* Background dashed grid lines */}
        <div className="absolute inset-0 grid grid-cols-12 max-lg:hidden">
          <div className="col-[2/-2] flex justify-between">
            <svg width="1" height="100%" className="text-subtle-stroke">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <svg width="1" height="100%" className="text-subtle-stroke">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center !pb-20">
          <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-center col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Join a team of builders.</h2>{' '}
            <p className="inline text-pretty font-medium text-black-800">
              We're looking for highly ambitious and talented people to help us drive real change.
            </p>
          </div>
        </header>

        {/* Avatar bubbles grid */}
        <div ref={ref} className="relative grid w-full grid-cols-12">
          <div className="relative col-[2/-2] pb-24">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-8 overflow-hidden" style={{ height: 160, width: 864, maskImage: 'linear-gradient(to right, transparent 0%, white 10%, white 90%, transparent 100%)' }}>
                {/* Grid of small avatar circles */}
                <div className="grid grid-cols-[repeat(27,32px)] gap-[2px]" style={{ width: 'max-content' }}>
                  {Array.from({ length: 135 }).map((_, i) => (
                    <div
                      key={i}
                      className="size-8 overflow-hidden rounded-full scroll-reveal"
                      style={{
                        backgroundColor: avatarColors[i % avatarColors.length] + '20',
                        transitionDelay: `${(i % 27) * 20}ms`,
                      }}
                    >
                      <div
                        className="h-full w-full rounded-full"
                        style={{ backgroundColor: avatarColors[i % avatarColors.length] + '30' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
