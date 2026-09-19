export interface CameraPosition { lat: number; lng: number; altitude: number }
export interface CameraMotion extends CameraPosition { latVelocity: number; lngVelocity: number; wanderPhase: number }
export interface CameraTarget { key: string; lat: number; lng: number; requests: number }
export interface CameraFocus { target?: CameraTarget; selectedAt: number; challenger?: string; challengerSince: number }
export const CAMERA_SPEED_LIMIT = 12
export const CAMERA_ACCELERATION_LIMIT = 8
export const CAMERA_MANUAL_PAUSE_MS = 2_000
// A settled target is never approached exactly — the setpoint itself keeps
// drifting in a slow Lissajous loop around it, so the view stays subtly alive
// instead of freezing once the spring below catches up. Small amplitude and a
// multi-minute period keep it a wander, not a visible oscillation.
const WANDER_LAT_DEGREES = 4
const WANDER_LNG_DEGREES = 6
const WANDER_SPEED = 0.045
const WANDER_LNG_FREQUENCY = 0.63
const WANDER_LNG_PHASE = 1.7

export function shortestLongitude(delta: number): number {
  return ((delta + 180) % 360 + 360) % 360 - 180
}

export function cameraMotion(position: CameraPosition): CameraMotion {
  return { ...position, latVelocity: 0, lngVelocity: 0, wanderPhase: 0 }
}

/** Fixed short integration steps make motion independent of display refresh rate.
 * A suspended tab resumes from its last view instead of catching up in one jump. */
export function stepCameraMotion(previous: CameraMotion, target: CameraTarget | undefined, elapsedSeconds: number): CameraMotion {
  const next = { ...previous }
  let remaining = Math.min(0.1, Math.max(0, elapsedSeconds))
  while (remaining > 1e-8) {
    const dt = Math.min(1 / 120, remaining)
    next.wanderPhase = (next.wanderPhase + dt * WANDER_SPEED) % (Math.PI * 2)
    const wanderedLat = target ? target.lat + WANDER_LAT_DEGREES * Math.sin(next.wanderPhase) : 0
    const wanderedLng = target ? target.lng + WANDER_LNG_DEGREES * Math.sin(next.wanderPhase * WANDER_LNG_FREQUENCY + WANDER_LNG_PHASE) : 0
    let latAcceleration = target ? 4 * (wanderedLat - next.lat) - 4 * next.latVelocity : -4 * next.latVelocity
    let lngAcceleration = target ? 4 * shortestLongitude(wanderedLng - next.lng) - 4 * next.lngVelocity : 4 * (1.05 - next.lngVelocity)
    const acceleration = Math.hypot(latAcceleration, lngAcceleration)
    if (acceleration > CAMERA_ACCELERATION_LIMIT) {
      latAcceleration *= CAMERA_ACCELERATION_LIMIT / acceleration
      lngAcceleration *= CAMERA_ACCELERATION_LIMIT / acceleration
    }
    next.latVelocity += latAcceleration * dt
    next.lngVelocity += lngAcceleration * dt
    const speed = Math.hypot(next.latVelocity, next.lngVelocity)
    if (speed > CAMERA_SPEED_LIMIT) {
      next.latVelocity *= CAMERA_SPEED_LIMIT / speed
      next.lngVelocity *= CAMERA_SPEED_LIMIT / speed
    }
    next.lat += next.latVelocity * dt
    next.lng = shortestLongitude(next.lng + next.lngVelocity * dt)
    remaining -= dt
  }
  return next
}

/** Keep a focus for five seconds; a challenger must lead by 35% for two seconds. */
export function selectCameraFocus(previous: CameraFocus, candidates: CameraTarget[], now: number): CameraFocus {
  const ranked = candidates.filter(item => Number.isFinite(item.lat) && Math.abs(item.lat) <= 90 && Number.isFinite(item.lng) && Number.isFinite(item.requests) && item.requests > 0)
    .sort((a, b) => b.requests - a.requests || a.key.localeCompare(b.key))
  const leader = ranked[0]
  if (!leader) return { ...previous, challenger: undefined }
  if (!previous.target) return { target: leader, selectedAt: now, challengerSince: now }
  const current = ranked.find(item => item.key === previous.target?.key)
  const target = current ?? previous.target
  if (leader.key === target.key || (current && leader.requests < current.requests * 1.35)) return { ...previous, target, challenger: undefined }
  if (previous.challenger !== leader.key) return { ...previous, target, challenger: leader.key, challengerSince: now }
  if (now - previous.selectedAt < 5_000 || now - previous.challengerSince < 2_000) return { ...previous, target }
  return { target: leader, selectedAt: now, challengerSince: now }
}
