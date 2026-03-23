import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'

export interface AuthUser {
  _id: string
  username: string
  name?: { first?: string; last?: string }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/**
 * Optional auth — attaches user to req if valid token present, continues either way.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return next()

  try {
    const res = await fetch(`${config.oxyApiBase}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      req.user = await res.json()
    }
  } catch {
    // Ignore — proceed without user
  }
  next()
}

/**
 * Required auth — returns 401 if no valid token.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const response = await fetch(`${config.oxyApiBase}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return res.status(401).json({ error: 'Invalid session' })
    req.user = await response.json()
    next()
  } catch {
    res.status(401).json({ error: 'Authentication failed' })
  }
}
