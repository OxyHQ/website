import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { objectId, timestamps } from './columns.js'

/* ──────────────────────────────────────────────
 * The 404 page's memory game.
 *
 * One row per finished run, never an aggregate the app has to keep in step:
 * the best score, the runs played and the points that decide someone's level
 * are all queries over this table, so a run can be recorded without reading
 * anything back first.
 * ──────────────────────────────────────────── */

export const memoryGameRuns = pgTable(
  'memory_game_runs',
  {
    _id: objectId(),
    userId: text().notNull(),
    username: text().notNull(),
    /** Points scored across every round of the run. */
    score: integer().notNull(),
    /** The round the run ended on, 1-based. */
    level: integer().notNull(),
    /** Turns spent, where one turn is a pair of cards. */
    moves: integer().notNull(),
    pairsFound: integer().notNull(),
    /** True when every round was cleared rather than the run running out of moves. */
    clearedAll: boolean().notNull().default(false),
    durationMs: integer().notNull(),
    createdAt: timestamps.createdAt,
  },
  // Every read is "this user's runs, newest first", and `_id` ascends with
  // creation — so the index carries both the filter and the order.
  (table) => [index('memory_game_runs_user_idx').on(table.userId, table._id)],
)
