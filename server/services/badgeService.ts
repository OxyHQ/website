import { and, count, eq } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { comments, userBadges, votes } from '../db/schema/index.js'
import { BADGE_DEFINITIONS } from '../data/badges.js'

async function countRows(query: Promise<Array<{ value: number }>>): Promise<number> {
  const [row] = await query
  return Number(row?.value ?? 0)
}

/**
 * Check all automatic badge thresholds for a user and award any earned badges.
 * Called fire-and-forget after social actions (comment, vote).
 */
export async function checkAndAwardBadges(userId: string, username: string): Promise<void> {
  const [commentCount, voteCount] = await Promise.all([
    countRows(
      db
        .select({ value: count() })
        .from(comments)
        .where(and(eq(comments.userId, userId), eq(comments.status, 'visible'))),
    ),
    countRows(db.select({ value: count() }).from(votes).where(eq(votes.userId, userId))),
  ])

  const FIRST_COMMENT: keyof typeof BADGE_DEFINITIONS = 'first_comment'
  const PROLIFIC_COMMENTER: keyof typeof BADGE_DEFINITIONS = 'prolific_commenter'
  const TOP_VOTER: keyof typeof BADGE_DEFINITIONS = 'top_voter'

  const earned: string[] = []
  if (commentCount >= 1) earned.push(FIRST_COMMENT)
  if (commentCount >= 50) earned.push(PROLIFIC_COMMENTER)
  if (voteCount >= 25) earned.push(TOP_VOTER)

  await Promise.allSettled(
    earned.map(badgeId =>
      db
        .insert(userBadges)
        .values({ userId, username, badgeId, awardedAt: new Date(), awardedBy: null })
        // Already awarded: keep the original `awardedAt`, since re-awarding
        // would silently move the date every time the user comments again.
        .onConflictDoNothing({ target: [userBadges.userId, userBadges.badgeId] })
        .catch((err: unknown) => {
          console.warn(`[badgeService] Failed to award ${badgeId} to ${userId}:`, err)
        }),
    ),
  )
}
