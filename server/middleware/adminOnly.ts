import type { Request, Response, NextFunction } from 'express'
import { isAdminUser } from '../utils/adminAccess.js'

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' })
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
