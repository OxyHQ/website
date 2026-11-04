import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { isSiteAdmin, SITE_ADMIN_PERMISSION } from '../middleware/siteAdmin.js';

const router = Router();

/**
 * Who am I, and am I an admin?
 *
 * The SPA asks instead of guessing: whether someone administers the site is
 * Oxy's answer (`middleware/siteAdmin.ts`), and this endpoint relays it.
 *
 * Deliberately `optionalAuth`, not `requireAuth`. A 401 would force the client
 * to tell "no session" apart from "request failed" by sniffing an error shape,
 * and getting that wrong is what produced a terminal 404 in the first place.
 * Signed out and "not an admin" are both a 200 with explicit flags, so the UI
 * maps states instead of interpreting failures. Oxy being unable to answer is
 * NOT one of them: it is a 503 (the error handler), which the UI shows as
 * "couldn't verify access" rather than as a refusal.
 *
 * `userId` and `permission` are echoed back deliberately: when access is
 * denied, the UI shows them so the grant to make in the Oxy Console can be read
 * straight off the screen.
 *
 * This grants nothing. Every admin route is gated independently by `adminOnly`.
 */
router.get('/me', optionalAuth, async (req, res) => {
  const user = req.user;
  // Never cache: the answer is per-session, and a shared cache hit would be a
  // cross-user identity leak.
  res.set('Cache-Control', 'no-store');
  if (!user) {
    return res.json({
      authenticated: false,
      isAdmin: false,
      userId: null,
      username: null,
      permission: SITE_ADMIN_PERMISSION,
    });
  }
  res.json({
    authenticated: true,
    isAdmin: await isSiteAdmin(req),
    userId: user.id ?? user._id ?? null,
    username: user.username ?? null,
    permission: SITE_ADMIN_PERMISSION,
  });
});

export default router;
