import type { OxyRequestUser } from '../middleware/auth.js'
import { config } from '../config.js'

export function isAdminUser(user: OxyRequestUser | null | undefined): boolean {
  const stableUserId = user?.id ?? user?._id
  return Boolean(stableUserId && config.adminUserIds.includes(stableUserId))
}
