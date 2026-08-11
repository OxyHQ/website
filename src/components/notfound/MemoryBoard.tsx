import { useCallback, useRef, useState } from 'react'

/* ──────────────────────────────────────────────
 * MemoryBoard
 *
 * The 404 page's board: pairs of Oxy app marks face down, three of the covers
 * carrying the digits of the code. Turn two over; a pair stays up, anything
 * else goes back after a beat.
 *
 * The cover is a sibling of the mark, not a wrapper, so revealing is one
 * transform on one element rather than a flip that has to keep two faces in
 * step.
 * ──────────────────────────────────────────── */

interface MemoryCard {
  /** The app whose mark is on the face. A pair shares it. */
  sprite: string
  image: string
  /** Bloom's chart family: five hues that belong to the palette. */
  tone: string
  /** One of the digits of 404, on three of the covers. */
  label?: string
}

const PAIRS: { sprite: string; image: string; tone: string }[] = [
  { sprite: 'mention', image: '/images/apps/mention.png', tone: 'bg-chart-1' },
  { sprite: 'inbox', image: '/images/apps/inbox.png', tone: 'bg-chart-2' },
  { sprite: 'alia', image: '/images/apps/alia.svg', tone: 'bg-chart-3' },
  { sprite: 'faircoin', image: '/images/apps/faircoin.jpg', tone: 'bg-chart-4' },
  { sprite: 'bloom', image: '/images/apps/bloom.png', tone: 'bg-chart-5' },
  { sprite: 'clarity', image: '/images/apps/clarity.png', tone: 'bg-chart-1' },
  { sprite: 'codea', image: '/images/apps/codea.png', tone: 'bg-chart-2' },
  { sprite: 'oxyos', image: '/images/apps/oxyos.png', tone: 'bg-chart-3' },
  { sprite: 'oxypay', image: '/images/apps/oxypay.png', tone: 'bg-chart-4' },
  { sprite: 'astro', image: '/images/apps/astro.svg', tone: 'bg-chart-5' },
  { sprite: 'mercaria', image: '/images/apps/mercaria.png', tone: 'bg-chart-1' },
  { sprite: 'tnp', image: '/images/apps/tnp.png', tone: 'bg-chart-2' },
]

/*
 * The deal is written down rather than shuffled at render: a board that dealt
 * itself would deal differently on the server and in the browser, and the
 * digits have to land on the three cards that spell the code.
 */
const DEAL: number[] = [0, 5, 1, 8, 3, 7, 2, 10, 6, 4, 9, 11, 8, 2, 5, 0, 11, 3, 9, 6, 1, 7, 4, 10]
const DIGITS: Record<number, string> = { 8: '4', 13: '0', 16: '4' }

const CARDS: MemoryCard[] = DEAL.map((pair, position) => ({
  ...PAIRS[pair],
  label: DIGITS[position],
}))

/**
 * Three tones a shade apart, dealt by position. The covers overlap the card
 * borders — a hairline between two covers read as a gap prising the board in
 * half — so this is what carries the grid while everything is face down. The
 * lines come back around a card as soon as it turns.
 */
const COVER_TONES = ['bg-surface', 'bg-muted', 'bg-background']

/** How long a mismatched pair stays face up before it turns back. */
const PEEK_MS = 750

export default function MemoryBoard() {
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const turn = useCallback(
    (index: number) => {
      if (locked || open.includes(index) || matched.includes(index)) return

      const next = [...open, index]
      if (next.length < 2) {
        setOpen(next)
        return
      }

      const [first, second] = next
      if (CARDS[first].sprite === CARDS[second].sprite) {
        setMatched((current) => [...current, first, second])
        setOpen([])
        return
      }

      setOpen(next)
      setLocked(true)
      timer.current = setTimeout(() => {
        setOpen([])
        setLocked(false)
        timer.current = null
      }, PEEK_MS)
    },
    [locked, open, matched],
  )

  // The board owns its own timeout: leaving the page mid-peek must not fire a
  // state update into a component that is gone.
  const board = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const found = matched.length / 2

  return (
    <section aria-labelledby="memory-board-heading">
      <h2 id="memory-board-heading" className="sr-only">
        A memory game, while you are here
      </h2>
      <div ref={board} className="grid w-full grid-cols-4 md:grid-cols-8">
        {CARDS.map((card, index) => {
          const revealed = open.includes(index) || matched.includes(index)
          return (
            <button
              key={index}
              type="button"
              aria-label={revealed ? card.sprite : 'Face-down card'}
              aria-pressed={revealed}
              onClick={() => turn(index)}
              className="group relative aspect-square cursor-pointer overflow-hidden border-b border-r border-border"
            >
              {/*
                The face carries the colour, not the button. `inset-0` is the
                PADDING box, so a tone on the button showed through as a
                coloured hairline down the right of every card — the border's
                own width, wearing the card's colour.
              */}
              <span aria-hidden="true" className={`absolute inset-0 ${card.tone}`} />

              <img
                src={card.image}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-0 m-auto size-1/2 object-contain"
              />

              <span
                aria-hidden="true"
                className={`absolute -inset-px flex items-center justify-center transition-transform duration-[650ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
                  COVER_TONES[index % COVER_TONES.length]
                } ${revealed ? '-translate-y-full' : 'translate-y-0'}`}
              >
                {card.label ? (
                  <span className="font-display text-[clamp(3.5rem,10vw,10.625rem)] font-medium leading-none tracking-[-0.06em] text-foreground">
                    {card.label}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      {/* Announced, not drawn: the board says it in colour, this says it once. */}
      <p aria-live="polite" className="sr-only">
        {found} of {PAIRS.length} pairs found
      </p>
    </section>
  )
}
