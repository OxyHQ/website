import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { isAdminUser } from '../utils/adminAccess.js'

const router = Router()

/**
 * Who am I, and am I an admin?
 *
 * The SPA used to answer this itself by matching `user.username` against a
 * hardcoded list, while the API answered it by matching the Oxy user id against
 * `OXY_ADMIN_USER_IDS`. Two allowlists keyed on two different identity fields
 * drift, and when they did the admin UI rendered a 404 at a real admin. This
 * endpoint makes the server the only source of truth: the client asks instead
 * of guessing.
 *
 * Deliberately `optionalAuth`, not `requireAuth`. A 401 would force the client
 * to tell "no session" apart from "request failed" by sniffing an error shape,
 * and getting that wrong is what produced a terminal 404 in the first place.
 * Every outcome is a 200 with an explicit `authenticated` flag, so the UI maps
 * states instead of interpreting failures — a thrown error then unambiguously
 * means the request itself failed.
 *
 * `userId` is echoed back deliberately: when access is denied, the UI shows it
 * so the exact value to add to `OXY_ADMIN_USER_IDS` can be read straight off the
 * screen instead of guessed.
 *
 * This grants nothing. Authorization is enforced independently on every mutating
 * route by `adminOnly`, which calls the same `isAdminUser()`.
 */
router.get('/me', optionalAuth, (req, res) => {
  const user = req.user
  // Never cache: the answer is per-session, and a shared cache hit would be a
  // cross-user identity leak.
  res.set('Cache-Control', 'no-store')
  if (!user) {
    return res.json({ authenticated: false, isAdmin: false, userId: null, username: null })
  }
  res.json({
    authenticated: true,
    isAdmin: isAdminUser(user),
    userId: user.id ?? user._id ?? null,
    username: user.username ?? null,
  })
})

export default router
