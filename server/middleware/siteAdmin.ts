import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import {
  type AppPermissionsSource,
  appPermissionErrorStatus,
  OxyAppPermissionError,
  type OxyAuthRequest,
  type OxyMcpCallerRequest,
} from '@oxy.so/core/server';
import { oxyService } from '../services/oxyService.js';

/* ──────────────────────────────────────────────
 * Who administers the site is decided in Oxy (`~/Oxy/docs/application-roles.md`,
 * oxy ADR 0056).
 *
 * The website is one of Oxy's own applications, so its operator key is
 * declared in code: the "Oxy Website" entry of oxy's first-party registry
 * (`operatorPermissions` in `packages/api/src/scripts/seedOxyApplicationsSpecs.ts`)
 * declares `website.content.manage`, held by the owners and admins of the
 * organization that owns the application (the `oxy` organization), and oxy's
 * "Seed Oxy applications" workflow applies it. Nobody is granted anything per
 * person (Oxy refuses a grant on a first-party application with
 * `409 FIRST_PARTY_ROLES_IN_CODE`): to make someone a site admin, give them
 * that role in the organization. The constant below must stay the registry's
 * key; renamed in only one place, it locks everybody out.
 *
 * This backend asks Oxy which of the application's permissions the person
 * behind the request holds — with the request's own verified session, so
 * someone acting as their organization is answered for themselves. The MCP
 * endpoint asks the same question with the tool call's access token
 * (`isMcpSiteAdmin`). Answers are cached for 30 s; a refusal and an outage never are, and an outage is
 * 503, never "not an admin".
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
 * a write asks Oxy, so someone whose organization role was removed stops
 * writing at once.
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
  return holdsSiteAdmin(caller, options);
}

/**
 * The same question for an MCP tool call (its `extra`, carrying the access
 * token the transport introspected): Oxy answers for the person who authorized
 * the connector, whichever account the connection is acting as. Throws when Oxy
 * could not answer, like `isSiteAdmin`.
 */
export function isMcpSiteAdmin(
  call: OxyMcpCallerRequest,
  options: { fresh?: boolean } = {},
): Promise<boolean> {
  return holdsSiteAdmin(call, options);
}

async function holdsSiteAdmin(
  source: AppPermissionsSource,
  options: { fresh?: boolean },
): Promise<boolean> {
  try {
    return (await oxyService.appPermissionsFor(source, options)).has(SITE_ADMIN_PERMISSION);
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
