import { UserBadge } from '../models/UserBadge.js'
import { Comment } from '../models/Comment.js'
import { Vote } from '../models/Vote.js'

/**
 * Check all automatic badge thresholds for a user and award any earned badges.
 * Called fire-and-forget after social actions (comment, vote).
 */
export async function checkAndAwardBadges(userId: string, username: string): Promise<void> {
  const [commentCount, voteCount] = await Promise.all([
    Comment.countDocuments({ userId, status: 'visible' }),
    Vote.countDocuments({ userId }),
  ])

  const earned: string[] = []
  if (commentCount >= 1) earned.push('first_comment')
  if (commentCount >= 50) earned.push('prolific_commenter')
  if (voteCount >= 25) earned.push('top_voter')

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
