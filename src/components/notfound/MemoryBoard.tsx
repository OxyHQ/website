import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@oxyhq/services'
import { useMemoryGameStats, useSaveMemoryGameRun } from '../../api/hooks'

/* ──────────────────────────────────────────────
 * MemoryBoard
 *
 * The 404 page's board: pairs of Oxy app marks face down, three of the covers
 * carrying the digits of the code. Turn two over; a pair stays up, anything
 * else goes back after a beat.
 *
 * A run is four rounds, each dealing more pairs than the last on a fixed
 * budget of turns. Clear a round and the turns left over are worth points; run
 * out and the run ends there. A signed-in visitor has the run recorded, so the
 * panel at the end can put it next to their best and their level.
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
  /** A recipe token chosen to remain legible against the chart surface. */
  iconTone: string
  /** One of the digits of 404, on three of the covers. */
  label?: string
}

const PAIRS: MemoryCard[] = [
  { sprite: 'mention', image: '/images/apps/mention.svg', tone: 'bg-chart-1', iconTone: 'bg-tertiary' },
  { sprite: 'inbox', image: '/images/apps/inbox.svg', tone: 'bg-chart-2', iconTone: 'bg-tertiary' },
  { sprite: 'alia', image: '/images/apps/alia-mark.svg', tone: 'bg-chart-3', iconTone: 'bg-primary' },
  { sprite: 'faircoin', image: '/images/apps/faircoin.svg', tone: 'bg-chart-4', iconTone: 'bg-primary' },
  { sprite: 'bloom', image: '/images/apps/bloom.png', tone: 'bg-chart-5', iconTone: 'bg-secondary' },
  { sprite: 'clarity', image: '/images/apps/clarity.png', tone: 'bg-chart-1', iconTone: 'bg-tertiary' },
  { sprite: 'codea', image: '/images/apps/codea.png', tone: 'bg-chart-2', iconTone: 'bg-tertiary' },
  { sprite: 'oxyos', image: '/images/apps/oxyos.png', tone: 'bg-chart-3', iconTone: 'bg-primary' },
  { sprite: 'oxypay', image: '/images/apps/oxypay.png', tone: 'bg-chart-4', iconTone: 'bg-primary' },
  { sprite: 'astro', image: '/images/apps/astro.svg', tone: 'bg-chart-5', iconTone: 'bg-secondary' },
  { sprite: 'mercaria', image: '/images/apps/mercaria.svg', tone: 'bg-chart-1', iconTone: 'bg-tertiary' },
  { sprite: 'tnp', image: '/images/apps/tnp.png', tone: 'bg-chart-2', iconTone: 'bg-tertiary' },
]

/**
 * The rounds of a run: how many pairs each deals, how many turns it allows and
 * how wide it sits from `md` up. The budget is a perfect round plus half again,
 * so a round is winnable without being a memory test nobody passes.
 * `server/routes/games.ts` mirrors the ceiling these add up to.
 */
const ROUNDS: ReadonlyArray<{ pairs: number; turns: number; columns: string }> = [
  { pairs: 6, turns: 9, columns: 'md:grid-cols-6' },
  { pairs: 8, turns: 12, columns: 'md:grid-cols-8' },
  { pairs: 10, turns: 15, columns: 'md:grid-cols-10' },
  { pairs: 12, turns: 18, columns: 'md:grid-cols-12' },
]

const POINTS_PER_PAIR = 100
const POINTS_PER_SPARE_TURN = 25

/** How long a mismatched pair stays face up before it turns back. */
const PEEK_MS = 750
/** How long a cleared board stays up before the next round is dealt. */
const ROUND_BREAK_MS = 900

/*
 * The deal is computed from a seed rather than shuffled at render: a board that
 * dealt itself from `Math.random` would deal differently in the prerendered
 * HTML and in the browser. Seeded, every visitor gets the same four boards and
 * the digits still land on three covers.
 */
function dealRound(round: number): MemoryCard[] {
  const deck = PAIRS.slice(0, ROUNDS[round].pairs).flatMap((card) => [card, card])

  let seed = 404 + round * 977
  const nextRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  const digits = new Map<number, string>([
    [1, '4'],
    [Math.floor(deck.length / 2), '0'],
    [deck.length - 2, '4'],
  ])
  return deck.map((card, position) => ({ ...card, label: digits.get(position) }))
}

const DEALS: MemoryCard[][] = ROUNDS.map((_, round) => dealRound(round))

/**
 * Three tones a shade apart, dealt by position. The covers overlap the card
 * borders — a hairline between two covers read as a gap prising the board in
 * half — so this is what carries the grid while everything is face down. The
 * lines come back around a card as soon as it turns.
 */
const COVER_TONES = ['bg-surface', 'bg-muted', 'bg-background']

interface RunResult {
  score: number
  /** The round the run ended on, 1-based. */
  level: number
  turns: number
  pairsFound: number
  clearedAll: boolean
  durationMs: number
}

/**
 * A result reads on the same cards the game is played on: one square, the
 * cover's tone, the same rules between cells. Nothing about the container
 * changes when the run ends — only what the squares carry.
 */
function Tile({
  index,
  label,
  children,
  onClick,
}: {
  index: number
  /** Left off for the blank cards that finish a row. */
  label?: string
  children?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <>
      <span aria-hidden="true" className={`absolute inset-0 ${COVER_TONES[index % COVER_TONES.length]}`} />
      {label ? (
        <span className="relative flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="text-label-sm uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="font-display text-[clamp(1.25rem,3vw,2.25rem)] font-medium leading-none tracking-[-0.04em] text-foreground">
            {children}
          </span>
        </span>
      ) : null}
    </>
  )

  const shell = 'relative col-span-2 aspect-[2/1] overflow-hidden border-b border-r border-border'
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${shell} group cursor-pointer transition-opacity hover:opacity-80`}>
        {body}
      </button>
    )
  }
  return <div className={shell}>{body}</div>
}

export default function MemoryBoard() {
  const { isAuthenticated, signIn } = useAuth()
  const stats = useMemoryGameStats(isAuthenticated)
  const saveRun = useSaveMemoryGameRun()

  const [round, setRound] = useState(0)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [turnsUsed, setTurnsUsed] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<RunResult | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAt = useRef(Date.now())
  const pairsFound = useRef(0)

  const cards = DEALS[round]
  const { pairs, turns, columns } = ROUNDS[round]
  const turnsLeft = turns - turnsUsed

  const finish = useCallback(
    (run: RunResult) => {
      setResult(run)
      setLocked(true)
      // Keeping the run is the whole point of being signed in; a guest just
      // sees what they scored.
      if (isAuthenticated) {
        saveRun.mutate({
          score: run.score,
          level: run.level,
          moves: run.turns,
          pairsFound: run.pairsFound,
          clearedAll: run.clearedAll,
          durationMs: run.durationMs,
        })
      }
    },
    [isAuthenticated, saveRun],
  )

  const turn = useCallback(
    (index: number) => {
      if (locked || result || open.includes(index) || matched.includes(index)) return

      const next = [...open, index]
      if (next.length < 2) {
        setOpen(next)
        return
      }

      const [first, second] = next
      const spent = turnsUsed + 1
      setTurnsUsed(spent)

      if (cards[first].sprite === cards[second].sprite) {
        const nextMatched = [...matched, first, second]
        const runningScore = score + POINTS_PER_PAIR
        pairsFound.current += 1
        setMatched(nextMatched)
        setOpen([])
        setScore(runningScore)

        if (nextMatched.length / 2 < pairs) return

        // Round cleared: what it finished with to spare is the bonus.
        const cleared = runningScore + (turns - spent) * POINTS_PER_SPARE_TURN
        setScore(cleared)

        if (round === ROUNDS.length - 1) {
          finish({
            score: cleared,
            level: ROUNDS.length,
            turns: spent,
            pairsFound: pairsFound.current,
            clearedAll: true,
            durationMs: Date.now() - startedAt.current,
          })
          return
        }

        setLocked(true)
        timer.current = setTimeout(() => {
          setRound(round + 1)
          setMatched([])
          setOpen([])
          setTurnsUsed(0)
          setLocked(false)
          timer.current = null
        }, ROUND_BREAK_MS)
        return
      }

      setOpen(next)
      setLocked(true)
      timer.current = setTimeout(() => {
        setOpen([])
        timer.current = null
        // The mismatch spent the last turn, so the run ends on this round
        // rather than leaving a board nobody can finish.
        if (spent >= turns) {
          finish({
            score,
            level: round + 1,
            turns: spent,
            pairsFound: pairsFound.current,
            clearedAll: false,
            durationMs: Date.now() - startedAt.current,
          })
          return
        }
        setLocked(false)
      }, PEEK_MS)
    },
    [cards, finish, locked, matched, open, pairs, result, round, score, turns, turnsUsed],
  )

  const playAgain = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pairsFound.current = 0
    startedAt.current = Date.now()
    setRound(0)
    setOpen([])
    setMatched([])
    setTurnsUsed(0)
    setScore(0)
    setLocked(false)
    setResult(null)
  }, [])

  // The board owns its own timeout: leaving the page mid-peek must not fire a
  // state update into a component that is gone.
  const board = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const found = matched.length / 2

  if (result) {
    const cleared = result.clearedAll
    const record = isAuthenticated ? stats.data : undefined
    const tiles: Array<{ label: string; value: ReactNode; onClick?: () => void } | null> = [
      { label: 'Points', value: result.score },
      { label: 'Level', value: `${result.level}/${ROUNDS.length}` },
      { label: 'Pairs', value: result.pairsFound },
      { label: 'Turns', value: result.turns },
      ...(record
        ? [
            { label: 'Account level', value: record.accountLevel },
            { label: 'Best score', value: record.bestScore },
            { label: 'Best level', value: `${record.bestLevel}/${ROUNDS.length}` },
            { label: 'Runs played', value: record.runs },
          ]
        : []),
      ...(isAuthenticated ? [] : [{ label: 'Keep your points', value: 'Sign in', onClick: () => signIn() }]),
      { label: 'Again', value: 'Play', onClick: playAgain },
    ]
    // The result sits on the grid of the round that just ended, two cells to a
    // tile: same cell height as the cards, so the board does not jump when the
    // last one turns. Blank cards finish the row.
    const ended = ROUNDS[result.level - 1]
    const perRow = ended.pairs / 2
    // Every round is two rows deep from `md` up, so the result keeps two rows:
    // blank cards fill whatever the stats leave over, and the board's height
    // stays put when the last card turns.
    while (tiles.length < perRow * 2 || tiles.length % perRow !== 0) tiles.push(null)
    return (
      <section aria-labelledby="memory-board-heading">
        <h2 id="memory-board-heading" className="sr-only">
          A memory game, while you are here
        </h2>

        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4">
          <p className="text-label-sm uppercase tracking-wider text-muted-foreground">
            {cleared ? 'Every round cleared' : 'Out of turns'}
          </p>
          <p className="text-label-sm uppercase tracking-wider text-muted-foreground">
            {isAuthenticated
              ? saveRun.isPending
                ? 'Saving this run…'
                : saveRun.isError
                  ? 'This run could not be saved'
                  : 'Run saved'
              : 'Sign in and your points, level and runs are kept'}
          </p>
        </div>

        {/* The same grid, the same squares: a run ends on the board it was played on. */}
        <div className={`grid w-full grid-cols-4 ${ended.columns}`}>
          {tiles.map((tile, index) =>
            tile ? (
              <Tile key={tile.label} index={index} label={tile.label} onClick={tile.onClick}>
                {tile.value}
              </Tile>
            ) : (
              // The row is finished with face-down cards rather than left ragged.
              <Tile key={`blank-${index}`} index={index} />
            ),
          )}
        </div>

        {isAuthenticated && stats.data ? (
          <p aria-live="polite" className="pt-4 text-label-sm uppercase tracking-wider text-muted-foreground">
            {stats.data.totalPoints} points in total · {stats.data.pointsToNextLevel} to level{' '}
            {stats.data.accountLevel + 1}
          </p>
        ) : null}
      </section>
    )
  }

  return (
    <section aria-labelledby="memory-board-heading">
      <h2 id="memory-board-heading" className="sr-only">
        A memory game, while you are here
      </h2>

      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4">
        <p className="text-label-sm uppercase tracking-wider text-muted-foreground">
          Level {round + 1} of {ROUNDS.length}
        </p>
        <p className="text-label-sm uppercase tracking-wider text-muted-foreground">
          {score} points · {turnsLeft} {turnsLeft === 1 ? 'turn' : 'turns'} left
        </p>
      </div>

      <div ref={board} className={`grid w-full grid-cols-4 ${columns}`}>
        {cards.map((card, index) => {
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

              {card.image.endsWith('.svg') ? (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 m-auto size-1/2 ${card.iconTone}`}
                  style={{
                    maskImage: `url(${card.image})`,
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    maskSize: 'contain',
                    WebkitMaskImage: `url(${card.image})`,
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                  }}
                />
              ) : (
                <img
                  src={card.image}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute inset-0 m-auto size-1/2 object-contain"
                />
              )}

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
        {found} of {pairs} pairs found, {turnsLeft} turns left
      </p>
    </section>
  )
}
