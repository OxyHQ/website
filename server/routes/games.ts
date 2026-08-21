import { Router } from 'express'
import { count, desc, eq, max, sum } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { memoryGameRuns } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { validate } from '../utils/validate.js'

const router = Router()

/* ──────────────────────────────────────────────
 * The 404 page's memory game.
 *
 * A signed-in visitor's runs are kept so the end-of-run panel can show a best
 * score and an account level next to what they just played. Nothing here is a
 * leaderboard: every route reads only the caller's own rows.
 * ──────────────────────────────────────────── */

/**
 * The board's own ceiling, mirroring `ROUNDS` in
 * `src/components/notfound/MemoryBoard.tsx`: four rounds of 6, 8, 10 and 12
 * pairs, 100 points a pair and 25 for each move a round finishes with to
 * spare. The client cannot be trusted with its own arithmetic, so a run that
 * claims more than a perfect one is rejected rather than stored.
 */
const MAX_LEVEL = 4
const MAX_MOVES = 66
const MAX_SCORE = 4800

/** Points per account level. Level 1 is where everyone starts. */
const POINTS_PER_LEVEL = 2500

function accountLevel(totalPoints: number): number {
  return Math.floor(totalPoints / POINTS_PER_LEVEL) + 1
}

const runBodySchema = z.object({
  score: z.number().int().min(0).max(MAX_SCORE),
  level: z.number().int().min(1).max(MAX_LEVEL),
  moves: z.number().int().min(0).max(MAX_MOVES),
  pairsFound: z.number().int().min(0).max(36),
  clearedAll: z.boolean(),
  durationMs: z.number().int().min(0).max(2 * 60 * 60 * 1000),
}).passthrough()

export interface MemoryGameStats {
  runs: number
  bestScore: number
  bestLevel: number
  totalPoints: number
  accountLevel: number
  /** Points still owed for the next account level, so the panel can say it. */
  pointsToNextLevel: number
}

async function statsFor(userId: string): Promise<MemoryGameStats> {
  const [row] = await db
    .select({
      runs: count(),
      bestScore: max(memoryGameRuns.score),
      bestLevel: max(memoryGameRuns.level),
      // `sum` comes back as a string from postgres.js, hence the Number below.
      totalPoints: sum(memoryGameRuns.score),
    })
    .from(memoryGameRuns)
    .where(eq(memoryGameRuns.userId, userId))

  const totalPoints = Number(row?.totalPoints ?? 0)
  const level = accountLevel(totalPoints)
  return {
    runs: Number(row?.runs ?? 0),
    bestScore: Number(row?.bestScore ?? 0),
    bestLevel: Number(row?.bestLevel ?? 0),
    totalPoints,
    accountLevel: level,
    pointsToNextLevel: level * POINTS_PER_LEVEL - totalPoints,
  }
}

router.get('/memory/stats', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  try {
    res.json(await statsFor(user.id))
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch game stats: ${toErrorMessage(err)}` })
  }
})

router.get('/memory/runs', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  try {
    const runs = await db
      .select()
      .from(memoryGameRuns)
      .where(eq(memoryGameRuns.userId, user.id))
      .orderBy(desc(memoryGameRuns._id))
      .limit(20)
    res.json(runs)
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch game runs: ${toErrorMessage(err)}` })
  }
})

router.post('/memory/runs', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const run = validate(runBodySchema, req.body)

  try {
    // The owner comes from the credential, never from the body.
    const [saved] = await db
      .insert(memoryGameRuns)
      .values({
        userId: user.id,
        username: user.username ?? user.id,
        score: run.score,
        level: run.level,
        moves: run.moves,
        pairsFound: run.pairsFound,
        clearedAll: run.clearedAll,
        durationMs: run.durationMs,
      })
      .returning()

    res.status(201).json({ run: saved, stats: await statsFor(user.id) })
  } catch (err) {
    res.status(500).json({ error: `Failed to save the run: ${toErrorMessage(err)}` })
  }
})

export default router
