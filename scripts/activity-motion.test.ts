import { describe, expect, test } from 'bun:test'
import { activityMotion } from '../src/data/dashboard/activity-motion'

const emittedAt = '2026-09-10T00:00:02.000Z'
const windowStartedAt = '2026-09-10T00:00:00.000Z'

describe('activityMotion', () => {
  test('makes higher request rates denser, shorter and faster', () => {
    const quiet = activityMotion({ requests: 1, windowStartedAt, emittedAt })
    const busy = activityMotion({ requests: 10, windowStartedAt, emittedAt })

    expect(busy.pulseCount).toBeGreaterThan(quiet.pulseCount)
    expect(busy.pulseLength).toBeLessThan(quiet.pulseLength)
    expect(busy.pulseDurationMs).toBeLessThan(quiet.pulseDurationMs)
  })

  test('bounds rendering work for very large buckets', () => {
    const motion = activityMotion({ requests: 1_000_000, windowStartedAt, emittedAt })

    expect(motion.pulseCount).toBe(12)
    expect(motion.pulseLength).toBe(0.025)
    expect(motion.pulseDurationMs).toBe(420)
  })

  test('handles invalid windows without producing non-finite values', () => {
    const motion = activityMotion({ requests: 0, windowStartedAt: 'invalid', emittedAt })

    expect(Number.isFinite(motion.pulseDurationMs)).toBe(true)
    expect(Number.isFinite(motion.pulseLength)).toBe(true)
  })
})
