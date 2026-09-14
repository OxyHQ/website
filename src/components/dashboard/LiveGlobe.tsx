import { useCallback, useMemo, useRef, useState } from 'react'
import { observeMapContrast } from './map-contrast'
import { createSolarMaterial } from './solar-material'
import { createMoonMaterial } from './moon-material'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Quaternion,
  type ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three'
import type { InfraStatusNode, PlatformActivityEvent } from '../../api/hooks'
import { infrastructureNodes } from '../../data/dashboard/infra-nodes'
import { activityRegionCoordinates, activityRegionLabel } from '../../data/dashboard/activity-regions'
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '../../data/dashboard/activity-categories'
import { activityRoute } from '../../data/dashboard/activity-routes'
import { activityMotion, activityFlows, retainFlowObjects } from '../../data/dashboard/activity-motion'
import { cameraMotion, stepCameraMotion, selectCameraFocus, CAMERA_MANUAL_PAUSE_MS, type CameraFocus, type CameraTarget } from '../../data/dashboard/camera-motion'
import { solarDirection } from '../../data/dashboard/solar-position'

interface LiveGlobeProps {
  infraStatus?: InfraStatusNode[]
  activityEvents?: PlatformActivityEvent[]
}

interface GlobeLayout {
  width: number
  height: number
  primary: string
  muted: string
  success: string
  warning: string
  destructive: string
  internal: string
  activityColors: Record<ActivityCategory, string>
}

interface ActivityArc {
  id: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string | string[]
  dashTime: number
  dashLength: number
  dashGap: number
  dashInitialGap: number
  stroke: number
}

interface ActivityRing {
  id: string
  lat: number
  lng: number
  color: string
  maxRadius: number
}

const MIN_GLOBE_HEIGHT = 420
/** Pale Rayleigh-scattering blue for the limb glow — a physical property of the
 * atmosphere, not a brand color, so it stays fixed across themes. */
const ATMOSPHERE_COLOR = 'rgb(80, 150, 230)'
const SUN_DISTANCE = 850
const MOON_RADIUS = 45
// Clear of the camera's whole operating range (controls.minDistance/maxDistance
// below, 150–420) — orbiting at 260 put it on almost the same shell as the
// camera itself, so whenever their angles lined up the moon sat right on top
// of the camera and filled the screen instead of being a distant object.
const MOON_ORBIT_RADIUS = 550
const MOON_ORBIT_TILT = 0.35
const MOON_ORBIT_SPEED = 0.015

function threeColor(token: string): string {
  const channels = token.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)$/)
  return channels
    ? `rgb(${channels[1]}, ${channels[2]}, ${channels[3]})`
    : token
}

/**
 * A camera-style flare: thin, sharp diffraction spikes crossing straight
 * through a pale white-hot core, the way a real lens renders a bright point
 * of light — not a stamped photo of the sun's surface (which only shows
 * granular texture at telescope range, never at this distance) and not a
 * cartoon sunburst of stubby wedges.
 */
function createSunTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const center = size / 2

  ctx.globalCompositeOperation = 'lighter'
  // Four lines through the center, each spanning both directions — an
  // eight-point star, the classic diffraction-spike shape.
  for (const degrees of [0, 45, 90, 135]) {
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate((degrees * Math.PI) / 180)
    const half = center * 0.97
    const spike = ctx.createLinearGradient(-half, 0, half, 0)
    spike.addColorStop(0, 'rgba(255,255,250,0)')
    spike.addColorStop(0.46, 'rgba(255,255,250,0.45)')
    spike.addColorStop(0.5, 'rgba(255,255,250,0.9)')
    spike.addColorStop(0.54, 'rgba(255,255,250,0.45)')
    spike.addColorStop(1, 'rgba(255,255,250,0)')
    ctx.fillStyle = spike
    ctx.fillRect(-half, -0.9, half * 2, 1.8)
    ctx.restore()
  }

  const glow = ctx.createRadialGradient(center, center, 0, center, center, center)
  glow.addColorStop(0, 'rgba(255,255,250,0.95)')
  glow.addColorStop(0.08, 'rgba(255,253,240,0.7)')
  glow.addColorStop(0.25, 'rgba(255,248,225,0.28)')
  glow.addColorStop(1, 'rgba(255,248,225,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export default function LiveGlobe({ infraStatus, activityEvents = [] }: LiveGlobeProps) {
  const [solarMaterial, setSolarMaterial] = useState<ShaderMaterial | undefined>(undefined)
  const [layout, setLayout] = useState<GlobeLayout | null>(null)
  const globeRef = useRef<GlobeMethods>(undefined)
  const activityEventsRef = useRef(activityEvents)
  const arcCacheRef = useRef(new Map<string, ActivityArc>())
  const controlsCleanupRef = useRef<(() => void) | null>(null)
  const sceneCleanupRef = useRef<(() => void) | null>(null)
  const isInteractingRef = useRef(false)
  activityEventsRef.current = activityEvents

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const measure = () => {
      const style = getComputedStyle(node)
      const width = Math.max(1, node.clientWidth)
      setLayout({
        width,
        height: Math.max(MIN_GLOBE_HEIGHT, node.clientHeight),
        muted: threeColor(style.getPropertyValue('--muted-foreground').trim()),
        primary: threeColor(style.getPropertyValue('--primary').trim()),
        success: threeColor(style.getPropertyValue('--success').trim()),
        warning: threeColor(style.getPropertyValue('--warning').trim()),
        destructive: threeColor(style.getPropertyValue('--destructive').trim()),
        internal: threeColor((style.getPropertyValue('--map-internal') || style.getPropertyValue('--foreground')).trim()),
        activityColors: Object.fromEntries(ACTIVITY_CATEGORIES.map(({ id }) => [
          id,
          threeColor(style.getPropertyValue(`--chart-${id === 'identity' ? '5' : id === 'ai' ? '2' : id === 'communication' ? '4' : id === 'media' ? '3' : '1'}`).trim()),
        ])) as Record<ActivityCategory, string>,
      })
    }

    const stopContrast = observeMapContrast(node, measure)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      observer.disconnect()
      stopContrast()
      controlsCleanupRef.current?.()
      controlsCleanupRef.current = null
      sceneCleanupRef.current?.()
      sceneCleanupRef.current = null
    }
  }, [])

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.pointOfView({ lat: 28, lng: -28, altitude: 1.7 }, 0)
    const controls = globe.controls()
    controls.autoRotate = false
    controls.enableDamping = false
    controls.enableRotate = true
    controls.enableZoom = false
    controls.enablePan = false
    controls.minDistance = 150
    controls.maxDistance = 420

    const renderer = globe.renderer()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const skyTexture = new TextureLoader().load('/images/dashboard/stars-milky-way.jpg')
    skyTexture.colorSpace = SRGBColorSpace
    // Nearest, not linear: a handful of single-texel stars smeared across
    // neighbouring pixels by linear magnification is what read as "giant
    // blurry blobs" instead of small points once wrapped around a 900-unit
    // sphere the camera sits well inside of.
    skyTexture.magFilter = NearestFilter
    const skyGeometry = new SphereGeometry(900, 64, 32)
    const skyMaterial = new MeshBasicMaterial({
      map: skyTexture,
      // Dimmed well below full brightness — a backdrop, not the subject.
      color: new Color(0x555566),
      side: BackSide,
      depthWrite: false,
    })
    const sky = new Mesh(skyGeometry, skyMaterial)
    globe.scene().add(sky)
    sceneCleanupRef.current?.()
    const solar = createSolarMaterial()
    setSolarMaterial(solar.material)

    const sunTexture = createSunTexture()
    const sunMaterial = new SpriteMaterial({
      map: sunTexture,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    })
    const sunSprite = new Sprite(sunMaterial)
    sunSprite.scale.set(260, 260, 1)
    globe.scene().add(sunSprite)

    const moon = createMoonMaterial()
    const moonGeometry = new SphereGeometry(MOON_RADIUS, 48, 32)
    const moonMesh = new Mesh(moonGeometry, moon.material)
    globe.scene().add(moonMesh)

    sceneCleanupRef.current = () => {
      solar.dispose()
      globe.scene().remove(sky)
      skyTexture.dispose()
      skyGeometry.dispose()
      skyMaterial.dispose()
      globe.scene().remove(sunSprite)
      sunTexture.dispose()
      sunMaterial.dispose()
      globe.scene().remove(moonMesh)
      moonGeometry.dispose()
      moon.dispose()
    }

    controlsCleanupRef.current?.()
    let motion = cameraMotion(globe.pointOfView())
    let focus: CameraFocus = { selectedAt: 0, challengerSince: 0 }
    let resumeAt = 0
    let previousFrame = performance.now()
    let frame = 0
    let previousEvents: PlatformActivityEvent[] | undefined
    let candidates: CameraTarget[] = []
    let moonOrbitAngle = Math.random() * Math.PI * 2
    const moonSunLocal = new Vector3()
    const moonInverseQuaternion = new Quaternion()
    const pauseAutomaticView = () => {
      isInteractingRef.current = true
    }
    const releaseAutomaticView = () => {
      isInteractingRef.current = false
      resumeAt = performance.now() + CAMERA_MANUAL_PAUSE_MS
    }
    const animateCamera = (now: number) => {
      const elapsed = (now - previousFrame) / 1_000
      previousFrame = now
      solar.update(Date.now())
      const sunDirection = solarDirection(Date.now())
      const [sunX, sunY, sunZ] = sunDirection
      sunSprite.position.set(sunX * SUN_DISTANCE, sunY * SUN_DISTANCE, sunZ * SUN_DISTANCE)
      moonOrbitAngle += elapsed * MOON_ORBIT_SPEED
      const moonBaseX = Math.cos(moonOrbitAngle) * MOON_ORBIT_RADIUS
      const moonBaseZ = Math.sin(moonOrbitAngle) * MOON_ORBIT_RADIUS
      moonMesh.position.set(moonBaseX, moonBaseZ * Math.sin(MOON_ORBIT_TILT), moonBaseZ * Math.cos(MOON_ORBIT_TILT))
      // Tidally locked, like the real Moon: the same face always points at
      // Earth. The shader shades in the mesh's own local space, so the sun
      // direction has to be rotated into that space too, or the lit face
      // would drift out of sync with the orbit instead of tracking it.
      moonMesh.lookAt(0, 0, 0)
      moonInverseQuaternion.copy(moonMesh.quaternion).invert()
      moonSunLocal.set(sunX, sunY, sunZ).applyQuaternion(moonInverseQuaternion)
      moon.setSunDirection([moonSunLocal.x, moonSunLocal.y, moonSunLocal.z])
      if (previousEvents !== activityEventsRef.current) {
        previousEvents = activityEventsRef.current
        const origins = new Map<string, CameraTarget>()
        for (const event of previousEvents) {
          const region = event.sourceRegion ?? event.region
          const coordinates = event.sourceRegion ? event.sourceCoordinates ?? activityRegionCoordinates(region) : activityRegionCoordinates(region)
          if (!coordinates) continue
          const origin = origins.get(region)
          origins.set(region, { key: region, lng: coordinates[0], lat: coordinates[1], requests: (origin?.requests ?? 0) + event.requests })
        }
        candidates = [...origins.values()]
      }
      focus = selectCameraFocus(focus, candidates, now)
      if (isInteractingRef.current || now < resumeAt) {
        motion = cameraMotion(globe.pointOfView())
      } else {
        motion = stepCameraMotion(motion, focus.target, elapsed)
        const next = { lat: motion.lat, lng: motion.lng, altitude: motion.altitude }
        globe.pointOfView(next, 0)
      }
      frame = requestAnimationFrame(animateCamera)
    }
    controls.addEventListener('start', pauseAutomaticView)
    controls.addEventListener('end', releaseAutomaticView)
    frame = requestAnimationFrame(animateCamera)
    controlsCleanupRef.current = () => {
      cancelAnimationFrame(frame)
      controls.removeEventListener('start', pauseAutomaticView)
      controls.removeEventListener('end', releaseAutomaticView)
    }
  }, [])

  const statusByRegion = useMemo(() => {
    const statuses = new Map<string, InfraStatusNode['status']>()
    for (const node of infraStatus ?? []) statuses.set(node.region, node.status)
    return statuses
  }, [infraStatus])

  const points = useMemo(() => {
    const infrastructure = infrastructureNodes(infraStatus).map((node) => ({
      region: node.region,
      label: node.label,
      lat: node.coordinates[1],
      lng: node.coordinates[0],
      status: statusByRegion.get(node.region) ?? 'unknown',
      infrastructure: true,
    }))
    const origins = new Map<string, (typeof infrastructure)[number]>()
    for (const event of activityEvents) {
      if (!event.sourceRegion?.startsWith('edge-') || origins.has(event.sourceRegion)) continue
      const coordinates = event.sourceCoordinates ?? activityRegionCoordinates(event.sourceRegion)
      if (!coordinates) continue
      origins.set(event.sourceRegion, {
        region: event.sourceRegion,
        label: `${event.sourceLabel ?? activityRegionLabel(event.sourceRegion)} · live origin`,
        lat: coordinates[1],
        lng: coordinates[0],
        status: 'online',
        infrastructure: false,
      })
    }
    return [...infrastructure, ...origins.values()]
  }, [activityEvents, statusByRegion, infraStatus])

  // Infrastructure nodes render only this chip — the status colour that used to
  // be a separate dot below the logo — the logo alone is the mark now, no
  // colour chip behind it, so a location reads as one plain icon, not a
  // colour shape with an icon stuck on top of it.
  const infrastructureLogos = useMemo(() => points.filter(point => point.infrastructure), [points])
  // Live traffic origins still render as a plain coloured dot — only Oxy's own
  // infrastructure gets the logo above.
  const liveOriginPoints = useMemo(() => points.filter(point => !point.infrastructure), [points])
  const infrastructureLogoElement = useCallback((value: object) => {
    const point = value as (typeof points)[number]
    const marker = document.createElement('span')
    marker.dataset.oxyInfrastructureLogo = point.region
    marker.title = `Oxy · ${point.label}`
    marker.style.pointerEvents = 'none'
    marker.style.display = 'block'
    const logo = document.createElement('img')
    logo.src = '/logo-mark.svg'
    logo.alt = `Oxy · ${point.label}`
    logo.width = 20
    logo.height = 20
    // An inline <img> reserves a couple of descender pixels below itself for
    // text baseline alignment, which quietly shifts the visible icon up from
    // this marker's true center (the library centers on the marker's own box,
    // via CSS2DObject's default (0.5, 0.5) anchor) — block removes that gap.
    logo.style.display = 'block'
    // Status is still legible without reintroducing a colour shape: full
    // strength online, faded the worse things get.
    logo.style.opacity = point.status === 'offline' ? '0.35' : point.status === 'degraded' ? '0.6' : point.status === 'unknown' ? '0.75' : '1'
    marker.appendChild(logo)
    return marker
  }, [])

  const arcs = useMemo<ActivityArc[]>(() => {
    if (!layout) return []
    const now = Date.now()
    const nextArcs = activityFlows(activityEvents).flatMap((event) => {
      const route = activityRoute(event, infrastructureNodes(infraStatus))
      if (!route) return []
      const { source, target } = route
      const { pulseDurationMs: dashTime, pulseLength: dashLength, pulseGap, initialPhase } = activityMotion(event, route.key, now)
      // Co-located services get a short schematic arc around their shared
      // infrastructure marker; it does not claim a second geographic location.
      const localOffset = route.local ? (route.outbound ? 0.7 : -0.7) : 0
      const pulses: ActivityArc[] = [{
        id: route.key,
        startLat: source[1],
        startLng: source[0] - localOffset,
        endLat: target[1],
        endLng: target[0] + localOffset,
        color: layout.activityColors[route.category],
        stroke: route.internal ? 0.6 : 0.35,
        dashTime,
        dashLength: route.internal ? dashLength / 2 : dashLength,
        dashGap: pulseGap + (route.internal ? dashLength / 2 : 0),
        dashInitialGap: arcCacheRef.current.get(route.key)?.dashInitialGap ?? -initialPhase,
      }]
      if (!route.internal) return pulses
      // A persistent high-contrast dashed backbone distinguishes internal hops.
      // The moving category-coloured pulses still identify operation type/direction.
      return [{
        ...pulses[0], id: `${route.key}-internal-track`, color: layout.internal,
        stroke: 0.45, dashTime: 0, dashLength: 0.035, dashGap: 0.035, dashInitialGap: 0,
      }, ...pulses]
    })
    return retainFlowObjects(arcCacheRef.current, nextArcs)
  }, [activityEvents, layout, infraStatus])

  const rings = useMemo<ActivityRing[]>(() => {
    if (!layout) return []
    return activityEvents.flatMap((event) => {
      const region = event.sourceRegion ?? event.region
      const coordinates = event.sourceRegion === region && event.sourceCoordinates
        ? event.sourceCoordinates
        : region.startsWith('edge-') ? activityRegionCoordinates(region) : infrastructureNodes(infraStatus).find(node => node.region === region)?.coordinates
      return coordinates ? [{
        id: `${region}-${event.emittedAt}`,
        lat: coordinates[1],
        lng: coordinates[0],
        color: layout.primary,
        maxRadius: Math.min(10, 3 + Math.log2(event.requests)),
      }] : []
    })
  }, [activityEvents, layout, infraStatus])

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] w-full overflow-hidden">
      {layout && (
        <Globe
          ref={globeRef}
          onGlobeReady={handleGlobeReady}
          width={layout.width}
          height={layout.height}
          rendererConfig={{ alpha: true, antialias: true }}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={solarMaterial}
          showAtmosphere
          atmosphereColor={ATMOSPHERE_COLOR}
          atmosphereAltitude={0.14}
          htmlElementsData={infrastructureLogos}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.04}
          htmlElement={infrastructureLogoElement}
          htmlTransitionDuration={0}
          pointsData={liveOriginPoints}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={0.025}
          pointRadius={0.34}
          pointColor={(point) => {
            const status = (point as { status: InfraStatusNode['status'] }).status
            if (status === 'unknown') return layout.muted
            if (status === 'offline') return layout.destructive
            if (status === 'degraded') return layout.warning
            return layout.success
          }}
          pointLabel={(point) => (point as { label: string }).label}
          pointsTransitionDuration={0}
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke="stroke"
          arcDashLength="dashLength"
          arcDashGap="dashGap"
          arcDashInitialGap="dashInitialGap"
          arcDashAnimateTime="dashTime"
          arcsTransitionDuration={0}
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringColor="color"
          ringMaxRadius="maxRadius"
          ringPropagationSpeed={4}
          ringRepeatPeriod={900}
        />
      )}
    </div>
  )
}
