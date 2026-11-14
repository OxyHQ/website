import { createHash } from 'node:crypto';
import express, { type ErrorRequestHandler, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { and, desc, eq, gt, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  FAIRCOIN_APPLICATION_STATUSES,
  FAIRCOIN_APPLICATION_TRANSITIONS,
  faircoinApplicationReceiptSchema,
  faircoinApplicationSchema,
  faircoinParticipationStatusSchema,
} from '../contracts/faircoinApplication.js';
import { db } from '../db/postgres.js';
import { isUniqueViolation } from '../db/pgErrors.js';
import { faircoinApplications, newObjectId } from '../db/schema/index.js';
import { requireAuth } from '../middleware/auth.js';
import { adminActorId, adminOnly, siteAdminErrors } from '../middleware/siteAdmin.js';
import { readFaircoinParticipationConfig } from '../services/faircoinParticipationConfig.js';
import { validate, ValidationError } from '../utils/validate.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export default function createFaircoinApplicationsRouter() {
  const router = Router();

  // Covers receipts, admin data and disabled/error responses as well as status.
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Mount before the application's larger JSON parser. Parsing failures are
  // handled here so malformed bodies and database parameters never reach logs.
  router.use(express.json({ limit: '32kb' }));

  router.get('/status', (_req, res) => {
    const settings = readFaircoinParticipationConfig();
    res.json(
      faircoinParticipationStatusSchema.parse({
        state: 'preparation',
        acceptingApplications: settings.enabled,
        retentionDays: settings.enabled ? settings.retentionDays : null,
        privacyContact: settings.enabled ? settings.privacyContact : null,
      }),
    );
  });

  const submitLimiter = rateLimit({
    windowMs: 10 * 60_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Only a transient, per-process address bucket; no IP is persisted.
    handler: (_req, res) => res.status(429).json({ code: 'RATE_LIMITED' }),
  });

  router.post('/', submitLimiter, async (req, res) => {
    const settings = readFaircoinParticipationConfig();
    if (!settings.enabled) return res.status(503).json({ code: 'APPLICATIONS_CLOSED' });
    if (!req.is('application/json')) return res.status(415).json({ code: 'JSON_REQUIRED' });

    const key = validate(z.string().uuid(), req.get('Idempotency-Key'));
    const input = validate(faircoinApplicationSchema, req.body);
    const now = new Date();
    const deleteAfter = new Date(now.getTime() + settings.retentionDays * 86_400_000);
    if (input.website_confirm.trim()) {
      return res.status(201).json(
        faircoinApplicationReceiptSchema.parse({
          id: newObjectId(),
          status: 'received',
          submittedAt: now.toISOString(),
          deleteAfter: deleteAfter.toISOString(),
        }),
      );
    }

    const { website_confirm: _trap, contactConsent: _consent, ...details } = input;
    const keyHash = hash(key);
    // Zod emits a fixed field order and normalizes whitespace/defaults first.
    const requestHash = hash(JSON.stringify(details));
    const [created] = await db
      .insert(faircoinApplications)
      .values({ ...details, keyHash, requestHash, contactConsentAt: now, deleteAfter })
      .onConflictDoNothing({ target: faircoinApplications.keyHash })
      .returning({
        id: faircoinApplications._id,
        requestHash: faircoinApplications.requestHash,
        createdAt: faircoinApplications.createdAt,
        deleteAfter: faircoinApplications.deleteAfter,
      });
    // The unique index serializes racing inserts across instances. A retry gets
    // exactly the first receipt, never the current review state or private input.
    const row =
      created ??
      (
        await db
          .select({
            id: faircoinApplications._id,
            requestHash: faircoinApplications.requestHash,
            createdAt: faircoinApplications.createdAt,
            deleteAfter: faircoinApplications.deleteAfter,
          })
          .from(faircoinApplications)
          .where(eq(faircoinApplications.keyHash, keyHash))
          .limit(1)
      )[0];
    if (!row) return res.status(503).json({ code: 'TEMPORARILY_UNAVAILABLE' });
    if (row.requestHash !== requestHash) {
      return res.status(409).json({ code: 'IDEMPOTENCY_CONFLICT' });
    }
    res.status(created ? 201 : 200).json(
      faircoinApplicationReceiptSchema.parse({
        id: row.id,
        status: 'received',
        submittedAt: row.createdAt.toISOString(),
        deleteAfter: row.deleteAfter.toISOString(),
      }),
    );
  });

  const listSchema = z.object({
    status: z.enum(FAIRCOIN_APPLICATION_STATUSES).optional(),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  });

  router.get('/', requireAuth, adminOnly, async (req, res) => {
    const { status, page, limit } = validate(listSchema, req.query);
    const where = and(
      gt(faircoinApplications.deleteAfter, new Date()),
      status ? eq(faircoinApplications.status, status) : undefined,
    );
    const rows = await db
      .select()
      .from(faircoinApplications)
      .where(where)
      .orderBy(desc(faircoinApplications.createdAt), desc(faircoinApplications._id))
      .limit(limit)
      .offset((page - 1) * limit);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(faircoinApplications)
      .where(where);
    // Hashes are backend duplicate controls, not review data.
    res.json({
      applications: rows.map(({ keyHash: _key, requestHash: _request, ...row }) => row),
      total: count,
      page,
      limit,
    });
  });

  // Counts are private and never joined to wallet/account identifiers.
  router.get('/metrics', requireAuth, adminOnly, async (_req, res) => {
    const rows = await db
      .select({ status: faircoinApplications.status, count: sql<number>`count(*)::int` })
      .from(faircoinApplications)
      .where(gt(faircoinApplications.deleteAfter, new Date()))
      .groupBy(faircoinApplications.status)
      .orderBy(faircoinApplications.status);
    res.json({ applications: rows });
  });

  const idSchema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
  const reviewSchema = z.strictObject({
    fromStatus: z.enum(FAIRCOIN_APPLICATION_STATUSES),
    status: z.enum(FAIRCOIN_APPLICATION_STATUSES),
    internalNote: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => !value.includes('\0'))
      .default(''),
  });

  router.patch('/:id', requireAuth, adminOnly, async (req, res) => {
    const { id } = validate(idSchema, req.params);
    const patch = validate(reviewSchema, req.body);
    if (!FAIRCOIN_APPLICATION_TRANSITIONS[patch.fromStatus].includes(patch.status)) {
      return res.status(409).json({ code: 'INVALID_TRANSITION' });
    }
    const now = new Date();
    const [row] = await db
      .update(faircoinApplications)
      .set({
        status: patch.status,
        internalNote: patch.internalNote,
        statusChangedAt: now,
        statusChangedBy: adminActorId(req),
        updatedAt: now,
      })
      .where(
        and(
          eq(faircoinApplications._id, id),
          eq(faircoinApplications.status, patch.fromStatus),
          gt(faircoinApplications.deleteAfter, now),
        ),
      )
      .returning({ id: faircoinApplications._id, status: faircoinApplications.status });
    if (!row) return res.status(409).json({ code: 'REVIEW_CONFLICT' });
    res.json(row);
  });

  router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
    const { id } = validate(idSchema, req.params);
    const [row] = await db
      .delete(faircoinApplications)
      .where(eq(faircoinApplications._id, id))
      .returning({ id: faircoinApplications._id });
    if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
    res.json({ deleted: row.id });
  });

  router.use(siteAdminErrors);
  const privateErrors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        issues: error.issues.map(({ path, code }) => ({ path, code })),
      });
    }
    const type = error && typeof error === 'object' && 'type' in error ? error.type : undefined;
    if (type === 'entity.too.large') return res.status(413).json({ code: 'BODY_TOO_LARGE' });
    if (type === 'entity.parse.failed') return res.status(400).json({ code: 'INVALID_JSON' });
    if (isUniqueViolation(error)) return res.status(409).json({ code: 'APPLICATION_CONFLICT' });
    // Driver errors carry SQL parameters. Never pass them to the global logger.
    console.error('[faircoin-applications] request failed');
    return res.status(503).json({ code: 'TEMPORARILY_UNAVAILABLE' });
  };
  router.use(privateErrors);

  return router;
}

/** No status exempts private data from its agreed retention period. */
export async function purgeExpiredFaircoinApplications(): Promise<number> {
  const rows = await db
    .delete(faircoinApplications)
    .where(lte(faircoinApplications.deleteAfter, new Date()))
    .returning({ id: faircoinApplications._id });
  return rows.length;
}
