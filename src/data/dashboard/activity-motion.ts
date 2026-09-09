import type { PlatformActivityEvent } from '../../api/hooks'

const MIN_WINDOW_MS = 250
const MIN_REQUEST_RATE = 0.2
const MAX_PULSES_PER_DIRECTION = 12
const MIN_PULSE_DURATION_MS = 420
const MAX_PULSE_DURATION_MS = 2_200
const MIN_PULSE_LENGTH = 0.025
const MAX_PULSE_LENGTH = 0.14

export interface ActivityMotion {
  pulseCount: number
  pulseDurationMs: number
  pulseLength: number
}

export function activityMotion(event: Pick<PlatformActivityEvent, 'requests' | 'windowStartedAt' | 'emittedAt'>): ActivityMotion {
  const elapsed = Date.parse(event.emittedAt) - Date.parse(event.windowStartedAt)
  const windowMs = Number.isFinite(elapsed) ? Math.max(MIN_WINDOW_MS, elapsed) : MIN_WINDOW_MS
  const requests = Math.max(0, event.requests)
  const requestsPerSecond = Math.max(MIN_REQUEST_RATE, requests / (windowMs / 1_000))
  const rateScale = Math.sqrt(requestsPerSecond)

  return {
    pulseCount: Math.min(MAX_PULSES_PER_DIRECTION, Math.max(1, Math.round(requests))),
    pulseDurationMs: Math.max(MIN_PULSE_DURATION_MS, Math.min(MAX_PULSE_DURATION_MS, 1_800 / rateScale)),
    pulseLength: Math.max(MIN_PULSE_LENGTH, Math.min(MAX_PULSE_LENGTH, 0.1 / rateScale)),
  }
}
