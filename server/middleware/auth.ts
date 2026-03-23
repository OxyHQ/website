import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'

export interface AuthUser {
  id: string
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
async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  const response = await fetch(`${config.oxyApiBase}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return null
  const body = await response.json()
  return body.data ?? body
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return next()

  try {
    const user = await fetchCurrentUser(token)
    if (user) req.user = user
  } catch {
    // Ignore — proceed without user
  }
  next()
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const user = await fetchCurrentUser(token)
    if (!user) return res.status(401).json({ error: 'Invalid session' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Authentication failed' })
  }
}
