import { UserBadge } from '../models/UserBadge.js'
import { Comment } from '../models/Comment.js'
import { Vote } from '../models/Vote.js'
import { BADGE_IDS } from '../data/badges.js'

interface BadgeThreshold {
  badgeId: string
  check: (userId: string) => Promise<boolean>
}

const thresholds: BadgeThreshold[] = [
  {
    badgeId: 'first_comment',
    check: async (userId) => {
      const count = await Comment.countDocuments({ userId, status: 'visible' })
      return count >= 1
    },
  },
  {
    badgeId: 'prolific_commenter',
    check: async (userId) => {
      const count = await Comment.countDocuments({ userId, status: 'visible' })
      return count >= 50
    },
  },
  {
    badgeId: 'top_voter',
    check: async (userId) => {
      const count = await Vote.countDocuments({ userId })
      return count >= 25
    },
  },
]

/**
 * Check all automatic badge thresholds for a user and award any earned badges.
 * Called fire-and-forget after social actions (comment, vote, feature request creation).
 */
export async function checkAndAwardBadges(userId: string, username: string): Promise<void> {
  for (const { badgeId, check } of thresholds) {
    if (!BADGE_IDS.includes(badgeId)) continue

    try {
      const earned = await check(userId)
      if (earned) {
        await UserBadge.findOneAndUpdate(
          { userId, badgeId },
          { userId, username, badgeId, awardedAt: new Date(), awardedBy: null },
          { upsert: true },
        )
      }
    } catch {
      // Badge check failures should not break the main request
    }
  }
}
