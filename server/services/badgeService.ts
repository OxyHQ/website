import { UserBadge } from '../models/UserBadge.js'
import { Comment } from '../models/Comment.js'
import { Vote } from '../models/Vote.js'
import { BADGE_DEFINITIONS } from '../data/badges.js'

/**
 * Check all automatic badge thresholds for a user and award any earned badges.
 * Called fire-and-forget after social actions (comment, vote).
 */
export async function checkAndAwardBadges(userId: string, username: string): Promise<void> {
  const [commentCount, voteCount] = await Promise.all([
    Comment.countDocuments({ userId, status: 'visible' }),
    Vote.countDocuments({ userId }),
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
      UserBadge.findOneAndUpdate(
        { userId, badgeId },
        { userId, username, badgeId, awardedAt: new Date(), awardedBy: null },
        { upsert: true },
      ).catch(err => {
        console.warn(`[badgeService] Failed to award ${badgeId} to ${userId}:`, err)
      })
    ),
  )
}
