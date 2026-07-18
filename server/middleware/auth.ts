import { OxyServices } from '@oxyhq/core'
import {
  createOxyAuthMiddleware,
  createOptionalOxyAuth,
  type OxyRequestUser,
} from '@oxyhq/core/server'
import { config } from '../config.js'

// Single shared OxyServices instance for the whole backend — constructed once.
// Routes that need to call the Oxy API import this rather than building their own.
export const oxy = new OxyServices({ baseURL: config.oxyApiBase })

declare global {
  // The Express namespace is the canonical augmentation point for
  // attaching request-scoped data; module syntax cannot extend it.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: OxyRequestUser
    }
  }
}

export type { OxyRequestUser }

/**
 * Optional auth — attaches user to req if valid token present, continues either way.
 */
export const optionalAuth = createOptionalOxyAuth(oxy, { auth: { loadUser: true } })

/**
 * Require auth — 401s when no valid token is present.
 */
export const requireAuth = createOxyAuthMiddleware(oxy, { auth: { loadUser: true } })
