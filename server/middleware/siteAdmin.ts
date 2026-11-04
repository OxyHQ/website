import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import {
  appPermissionErrorStatus,
  OxyAppPermissionError,
  type OxyAuthRequest,
} from '@oxy.so/core/server';
import { oxyService } from '../services/oxyService.js';

/* ──────────────────────────────────────────────
 * Who administers the site is decided in Oxy (`~/Oxy/docs/application-roles.md`).
 *
 * The Oxy Website application declares `website.content.manage`; its owners
 * grant it to people in the Oxy Console. This backend asks Oxy which of the
 * application's permissions the person behind the request holds — with the
 * request's own verified session, so someone acting as their organization is
 * answered for themselves. Answers are cached for 30 s; a refusal and an
 * outage never are, and an outage is 503, never "not an admin".
 * ──────────────────────────────────────────── */

export const SITE_ADMIN_PERMISSION = 'website.content.manage';

// `respond: false`: a refusal reaches `siteAdminErrors`, which answers it and
// an `isSiteAdmin` failure the same way.
const gateReads = oxyService.middleware.requireAppPermission(SITE_ADMIN_PERMISSION, {
  respond: false,
});
const gateWrites = oxyService.middleware.requireAppPermission(SITE_ADMIN_PERMISSION, {
  respond: false,
  fresh: true,
});

/**
 * Admin routes, mounted after `requireAuth`. A read may reuse a 30 s answer;
 * a write asks Oxy, so a revoked grant stops writing at once.
 */
export const adminOnly: RequestHandler = (req, res, next) =>
  req.method === 'GET' || req.method === 'HEAD'
    ? gateReads(req, res, next)
    : gateWrites(req, res, next);

/**
 * Whether the person behind a public read may see what only admins see
 * (drafts, previews, the moderation view). Anonymous requests are not asked
 * about; pass `fresh` when the answer decides a write. Throws when Oxy could not answer, so an outage reaches the error
 * handler as a 503 instead of quietly serving the public view as the answer.
 */
export async function isSiteAdmin(
  req: Request,
  options: { fresh?: boolean } = {},
): Promise<boolean> {
  const caller = req as OxyAuthRequest;
  if (!caller.userId) return false;
  try {
    return (await oxyService.appPermissionsFor(caller, options)).has(SITE_ADMIN_PERMISSION);
  } catch (error) {
    if (
      error instanceof OxyAppPermissionError &&
      (error.code === 'APP_PERMISSION_DENIED' || error.code === 'APP_PERMISSION_SESSION_REQUIRED')
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * The person an admin route acted for, to record as the actor: the operator
 * Oxy resolved, who is the person even when the session speaks as their
 * organization. Only meaningful behind `adminOnly`.
 */
export function adminActorId(req: Request): string {
  const operatorId = (req as OxyAuthRequest).oxyAppPermissions?.operatorId;
  if (!operatorId) throw new Error('adminActorId called outside adminOnly');
  return operatorId;
}

/** What a refusal or a failure is answered with, by status. */
const ADMIN_PERMISSION_ERRORS: Readonly<Record<number, string>> = {
  401: 'Authentication required',
  403: 'Admin access required',
  500: 'Internal server error',
  503: 'Access could not be checked right now',
};

/**
 * The error handler for both: the gate's refusal and Oxy being unable to say
 * whether the caller is an admin. An outage is 503 — never the refusal, and
 * never the public answer a refusal would have given.
 */
export const siteAdminErrors: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof OxyAppPermissionError)) return next(err);
  const status = appPermissionErrorStatus(err, 403);
  if (status >= 500) console.error('[admin] could not resolve the site admin permission:', err);
  res
    .status(status)
    .json({ error: ADMIN_PERMISSION_ERRORS[status] ?? ADMIN_PERMISSION_ERRORS[500] });
};
