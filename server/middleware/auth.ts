import {
  createOxyAuthMiddleware,
  createOptionalOxyAuth,
  type OxyAuthMiddlewareOptions,
  type OxyRequestUser,
} from '@oxy.so/core/server';
import { oxyService } from '../services/oxyService.js';

declare global {
  // The Express namespace is the canonical augmentation point for
  // attaching request-scoped data; module syntax cannot extend it.
  // biome-ignore lint/style/noNamespace: the Express namespace is the canonical augmentation point; module syntax cannot extend it
  namespace Express {
    interface Request {
      user?: OxyRequestUser;
    }
  }
}

export type { OxyRequestUser };

/**
 * How every mount resolves the session. One value, because whichever mount
 * runs first — the global rate limiter or a route's own — resolves it for the
 * rest of the request, and the later ones skip resolution: a mount without
 * `loadUser` would leave every route behind it without the profile.
 */
export const OXY_AUTH_OPTIONS: OxyAuthMiddlewareOptions = { auth: { loadUser: true } };

/**
 * Optional auth — attaches user to req if valid token present, continues either way.
 */
export const optionalAuth = createOptionalOxyAuth(oxyService, OXY_AUTH_OPTIONS);

/**
 * Require auth — 401s when no valid token is present.
 */
export const requireAuth = createOxyAuthMiddleware(oxyService, OXY_AUTH_OPTIONS);
