// Seeded random for deterministic opacity values
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const COLS = 27
const ROWS = 5

const bubbles = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const opacity = 0.15 + seededRandom(i) * 0.2 // 0.15–0.35
  return {
    key: i,
    left: col * 32 + 16,
    top: row * 32 + 16,
    opacity,
  }
})

export default function JoinTeamSection() {
  return (
    <section className="container">
      <div className="relative border-border border-x">
        {/* Background dashed grid lines */}
        <div className="absolute inset-0 grid grid-cols-12 max-lg:hidden">
          <div className="col-[2/-2] flex justify-between">
            <svg width="1" height="100%" className="text-border">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <svg width="1" height="100%" className="text-border">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center !pb-20">
          <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-center col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Join a team of builders.</h2>{' '}
            <p className="inline text-pretty font-medium text-muted-foreground">
              We're looking for highly ambitious and talented people to help us drive real change.
            </p>
          </div>
        </header>

        <div className="relative grid w-full grid-cols-12">
          <div className="relative col-[2/-2] pb-24">
            <div className="flex flex-col items-center justify-center bg-white">
              {/* Avatar bubble grid */}
              <div
                className="relative mb-8 [mask-image:linear-gradient(to_right,transparent_0%,white_10%,white_90%,transparent_100%)] max-lg:pointer-events-none"
                style={{ height: 160, width: 864 }}
              >
                {bubbles.map(({ key, left, top, opacity }) => (
                  <div
                    key={key}
                    className="absolute overflow-hidden rounded-full bg-muted after:absolute after:inset-0 after:z-1 after:mix-blend-hard-light after:rounded-full after:bg-linear-to-tl after:from-muted-foreground after:to-border after:opacity-0 after:transition after:duration-300 after:ease-out"
                    style={{
                      height: 32,
                      width: 32,
                      left,
                      top,
                      opacity,
                      transform: 'translateX(-50%) translateY(-50%) scale(0.8)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
