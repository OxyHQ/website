import { Router } from 'express'
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { incidents, newObjectId, products, serviceUptimeDaily } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'
import { config } from '../config.js'

const router = Router()

const SEVERITIES = ['minor', 'major', 'critical'] as const
const UPDATE_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const

interface IncidentUpdate {
  _id: string
  status: (typeof UPDATE_STATUSES)[number]
  body: string
  createdAt: string
}

function readUpdates(row: typeof incidents.$inferSelect): IncidentUpdate[] {
  return Array.isArray(row.updates) ? (row.updates as unknown as IncidentUpdate[]) : []
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function dayKeysBack(days: number): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

type DayStatus = 'operational' | 'degraded' | 'down' | 'no-data'

function dayStatus(row: typeof serviceUptimeDaily.$inferSelect | undefined): { status: DayStatus; uptimePct: number | null } {
  if (!row || row.totalChecks === 0) return { status: 'no-data', uptimePct: null }
  const known = row.totalChecks - row.unknownChecks
  if (known <= 0) return { status: 'no-data', uptimePct: null }
  const status: DayStatus = row.downChecks > 0 ? 'down' : row.degradedChecks > 0 ? 'degraded' : 'operational'
  const uptimePct = Math.round(((row.operationalChecks + row.degradedChecks) / known) * 1000) / 10
  return { status, uptimePct }
}

router.get('/uptime', async (req, res) => {
  const query = validate(z.object({ days: z.coerce.number().int().positive().optional() }), req.query)
  const days = Math.min(query.days ?? 90, config.statusHistory.retentionDays)
  const dayKeys = dayKeysBack(days)
  const oldest = dayKeys[0]

  const serviceRows = await db
    .select({ _id: products._id, productId: products.productId, name: products.name })
    .from(products)
    .where(eq(products.showOnStatus, true))
    .orderBy(asc(products.section), asc(products.order), asc(products._id))
  const productDocIds = serviceRows.map((s) => s._id)

  const uptimeRows = productDocIds.length > 0
    ? await db
        .select()
        .from(serviceUptimeDaily)
        .where(and(inArray(serviceUptimeDaily.product, productDocIds), gte(serviceUptimeDaily.date, oldest)))
    : []
  const byProductAndDate = new Map<string, typeof serviceUptimeDaily.$inferSelect>()
  for (const row of uptimeRows) byProductAndDate.set(`${row.product}:${row.date}`, row)

  res.json({
    days,
    services: serviceRows.map((service) => ({
      productId: service.productId,
      name: service.name,
      days: dayKeys.map((date) => ({ date, ...dayStatus(byProductAndDate.get(`${service._id}:${date}`)) })),
    })),
  })
})

async function resolveAffectedServices(rows: (typeof incidents.$inferSelect)[]) {
  const ids = [...new Set(rows.flatMap((row) => row.products))]
  if (ids.length === 0) return new Map<string, { _id: string; productId: string; name: string }>()
  const rowsById = await db
    .select({ _id: products._id, productId: products.productId, name: products.name })
    .from(products)
    .where(inArray(products._id, ids))
  return new Map(rowsById.map((p) => [p._id, { _id: p._id, productId: p.productId, name: p.name }]))
}

router.get('/incidents', async (req, res) => {
  const query = validate(z.object({ page: z.coerce.number().int().positive().optional() }), req.query)
  const page = query.page ?? 1
  const now = new Date()
  const monthIndex = now.getUTCFullYear() * 12 + now.getUTCMonth() - (page - 1)
  const year = Math.floor(monthIndex / 12)
  const month = monthIndex % 12
  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd = new Date(Date.UTC(year, month + 1, 1))

  const rows = await db
    .select()
    .from(incidents)
    .where(and(gte(incidents.startedAt, monthStart), sql`${incidents.startedAt} < ${monthEnd}`))
    .orderBy(desc(incidents.startedAt), desc(incidents._id))

  const [{ earliest }] = await db.select({ earliest: sql<string | null>`min(${incidents.startedAt})` }).from(incidents)
  const pages = earliest
    ? now.getUTCFullYear() * 12 + now.getUTCMonth() - (new Date(earliest).getUTCFullYear() * 12 + new Date(earliest).getUTCMonth()) + 1
    : 1

  const serviceById = await resolveAffectedServices(rows)
  const label = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  res.json({
    page,
    pages,
    year,
    month: month + 1,
    label,
    incidents: rows.map((row) => ({
      _id: row._id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      products: row.products,
      startedAt: row.startedAt,
      resolvedAt: row.resolvedAt,
      affectedServices: row.products
        .map((id) => serviceById.get(id))
        .filter((s): s is { _id: string; productId: string; name: string } => Boolean(s)),
      updates: readUpdates(row),
    })),
  })
})

const incidentBodySchema = z.object({
  title: z.string().min(1),
  severity: z.enum(SEVERITIES).optional().default('minor'),
  products: z.array(z.string()).optional().default([]),
  startedAt: z.coerce.date().optional(),
  update: z.object({
    status: z.enum(UPDATE_STATUSES),
    body: z.string().min(1),
    createdAt: z.coerce.date().optional(),
  }),
})

router.post('/incidents', requireAuth, adminOnly, async (req, res) => {
  const body = validate(incidentBodySchema, req.body)
  const createdAt = body.update.createdAt ?? new Date()
  const firstUpdate: IncidentUpdate = {
    _id: newObjectId(),
    status: body.update.status,
    body: body.update.body,
    createdAt: createdAt.toISOString(),
  }
  const [doc] = await db
    .insert(incidents)
    .values({
      title: body.title,
      severity: body.severity,
      status: body.update.status,
      products: body.products,
      ...(body.startedAt ? { startedAt: body.startedAt } : {}),
      resolvedAt: body.update.status === 'resolved' ? createdAt : null,
      updates: [firstUpdate as unknown as Record<string, unknown>],
    })
    .returning()
  res.status(201).json(doc)
})

const updateEntrySchema = z.object({
  _id: z.string().optional(),
  status: z.enum(UPDATE_STATUSES),
  body: z.string().min(1),
  createdAt: z.coerce.date().optional(),
})

const incidentPatchSchema = z.object({
  title: z.string().min(1).optional(),
  severity: z.enum(SEVERITIES).optional(),
  products: z.array(z.string()).optional(),
  startedAt: z.coerce.date().optional(),
  updates: z.array(updateEntrySchema).optional(),
})

router.put('/incidents/:id', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(incidentPatchSchema, req.body)
  const { updates, ...metadata } = patch
  const resolvedUpdates = updates?.map((update) => ({
    _id: update._id ?? newObjectId(),
    status: update.status,
    body: update.body,
    createdAt: (update.createdAt ?? new Date()).toISOString(),
  }))
  const last = resolvedUpdates?.at(-1)

  const [row] = await db
    .update(incidents)
    .set({
      ...metadata,
      ...(resolvedUpdates ? { updates: resolvedUpdates as unknown as Record<string, unknown>[] } : {}),
      ...(last ? { status: last.status, resolvedAt: last.status === 'resolved' ? new Date(last.createdAt) : null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(incidents._id, String(req.params.id)))
    .returning()
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

const appendUpdateSchema = z.object({
  status: z.enum(UPDATE_STATUSES),
  body: z.string().min(1),
  createdAt: z.coerce.date().optional(),
})

router.post('/incidents/:id/updates', requireAuth, adminOnly, async (req, res) => {
  const body = validate(appendUpdateSchema, req.body)
  const createdAt = body.createdAt ?? new Date()
  const entry: IncidentUpdate = { _id: newObjectId(), status: body.status, body: body.body, createdAt: createdAt.toISOString() }

  const [row] = await db
    .update(incidents)
    .set({
      updates: sql`${incidents.updates} || ${JSON.stringify([entry])}::jsonb`,
      status: body.status,
      resolvedAt: body.status === 'resolved' ? createdAt : null,
      updatedAt: new Date(),
    })
    .where(eq(incidents._id, String(req.params.id)))
    .returning()
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

router.delete('/incidents/:id', requireAuth, adminOnly, async (req, res) => {
  const [row] = await db.delete(incidents).where(eq(incidents._id, String(req.params.id))).returning({ id: incidents._id })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

export default router
