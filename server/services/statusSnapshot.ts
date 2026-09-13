import { lt, sql } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { serviceUptimeDaily } from '../db/schema/index.js'
import { config } from '../config.js'
import { getStatus, type ServiceStatus } from './statusProbe.js'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function cutoffUtc(retentionDays: number): string {
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays)
  return cutoff.toISOString().slice(0, 10)
}

function oneHot(status: ServiceStatus) {
  return {
    operational: status === 'operational' ? 1 : 0,
    degraded: status === 'degraded' ? 1 : 0,
    down: status === 'down' ? 1 : 0,
    unknown: status === 'unknown' ? 1 : 0,
  }
}

/**
 * One tick: read the already-memoized probe cache (never re-probes on its own)
 * and upsert one row per service for today, incrementing counters — then prune
 * anything past the retention window. Every write is keyed on the
 * (product, date) unique index, so overlapping/retried ticks just add up
 * rather than duplicate rows.
 */
async function run(): Promise<void> {
  const payload = await getStatus()
  const date = todayUtc()
  for (const service of payload.services) {
    const counts = oneHot(service.status)
    await db
      .insert(serviceUptimeDaily)
      .values({
        product: service.productDocId,
        date,
        totalChecks: 1,
        operationalChecks: counts.operational,
        degradedChecks: counts.degraded,
        downChecks: counts.down,
        unknownChecks: counts.unknown,
        avgLatencyMs: service.latencyMs ?? undefined,
      })
      .onConflictDoUpdate({
        target: [serviceUptimeDaily.product, serviceUptimeDaily.date],
        set: {
          totalChecks: sql`${serviceUptimeDaily.totalChecks} + 1`,
          operationalChecks: sql`${serviceUptimeDaily.operationalChecks} + ${counts.operational}`,
          degradedChecks: sql`${serviceUptimeDaily.degradedChecks} + ${counts.degraded}`,
          downChecks: sql`${serviceUptimeDaily.downChecks} + ${counts.down}`,
          unknownChecks: sql`${serviceUptimeDaily.unknownChecks} + ${counts.unknown}`,
          updatedAt: new Date(),
        },
      })
  }
  await db.delete(serviceUptimeDaily).where(lt(serviceUptimeDaily.date, cutoffUtc(config.statusHistory.retentionDays)))
}

export function startStatusSnapshotInterval(): void {
  const intervalMs = config.statusHistory.snapshotIntervalMinutes * 60_000

  // Run once after a short delay (let the database connection settle).
  setTimeout(() => {
    run().catch((err) => console.error('[Status Snapshot] Initial snapshot error:', err))
  }, 10_000)

  const snapshotInterval = setInterval(() => {
    run().catch((err) => console.error('[Status Snapshot] Interval snapshot error:', err))
  }, intervalMs)
  // Background housekeeping must never hold the event loop open on its own.
  snapshotInterval.unref?.()

  console.log(`[Status Snapshot] Background snapshot started (every ${intervalMs / 60000} min)`)
}
