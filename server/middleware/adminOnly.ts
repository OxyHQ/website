import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'

/**
 * Requires req.user to exist and username to be in the admin whitelist.
 * Must be used after requireAuth middleware.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' })
  if (!config.adminUsernames.includes(req.user.username)) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
