import { useCallback, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import {
  BackSide,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
} from 'three'
import type { InfraStatusNode, PlatformActivityEvent } from '../../api/hooks'
import { infrastructureNodes } from '../../data/dashboard/infra-nodes'
import { activityRegionCoordinates, activityRegionLabel } from '../../data/dashboard/activity-regions'
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '../../data/dashboard/activity-categories'
import { activityRoute } from '../../data/dashboard/activity-routes'
import { activityMotion } from '../../data/dashboard/activity-motion'
import { cameraMotion, stepCameraMotion, selectCameraFocus, CAMERA_MANUAL_PAUSE_MS, type CameraFocus, type CameraTarget } from '../../data/dashboard/camera-motion'

interface LiveGlobeProps {
  infraStatus?: InfraStatusNode[]
  activityEvents?: PlatformActivityEvent[]
}

interface GlobeLayout {
  width: number
  height: number
  highResolution: boolean
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

function threeColor(token: string): string {
  const channels = token.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)$/)
  return channels
    ? `rgb(${channels[1]}, ${channels[2]}, ${channels[3]})`
    : token
}

export default function LiveGlobe({ infraStatus, activityEvents = [] }: LiveGlobeProps) {
  const [layout, setLayout] = useState<GlobeLayout | null>(null)
  const globeRef = useRef<GlobeMethods>(undefined)
  const activityEventsRef = useRef(activityEvents)
  const highResolutionRef = useRef(false)
  const controlsCleanupRef = useRef<(() => void) | null>(null)
  const sceneCleanupRef = useRef<(() => void) | null>(null)
  const isInteractingRef = useRef(false)
  activityEventsRef.current = activityEvents

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const measure = () => {
      const style = getComputedStyle(node)
      const width = Math.max(1, node.clientWidth)
      const highResolution = width * window.devicePixelRatio >= 2_400
      highResolutionRef.current = highResolution
      setLayout({
        width,
        height: Math.max(MIN_GLOBE_HEIGHT, node.clientHeight),
        highResolution,
        muted: threeColor(style.getPropertyValue('--muted-foreground').trim()),
        primary: threeColor(style.getPropertyValue('--primary').trim()),
        success: threeColor(style.getPropertyValue('--success').trim()),
        warning: threeColor(style.getPropertyValue('--warning').trim()),
        destructive: threeColor(style.getPropertyValue('--destructive').trim()),
        internal: threeColor(style.getPropertyValue('--foreground').trim()),
        activityColors: Object.fromEntries(ACTIVITY_CATEGORIES.map(({ id }) => [
          id,
          threeColor(style.getPropertyValue(`--chart-${id === 'identity' ? '5' : id === 'ai' ? '2' : id === 'communication' ? '4' : id === 'media' ? '3' : '1'}`).trim()),
        ])) as Record<ActivityCategory, string>,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      observer.disconnect()
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
    const skyTexture = new TextureLoader().load(
      highResolutionRef.current
        ? '/images/dashboard/night-sky-8k.webp'
        : '/images/dashboard/night-sky.png',
    )
    skyTexture.colorSpace = SRGBColorSpace
    skyTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    const skyGeometry = new SphereGeometry(900, 64, 32)
    const skyMaterial = new MeshBasicMaterial({
      map: skyTexture,
      side: BackSide,
      depthWrite: false,
    })
    const sky = new Mesh(skyGeometry, skyMaterial)
    globe.scene().add(sky)
    sceneCleanupRef.current?.()
    sceneCleanupRef.current = () => {
      globe.scene().remove(sky)
      skyTexture.dispose()
      skyGeometry.dispose()
      skyMaterial.dispose()
    }

    controlsCleanupRef.current?.()
    let motion = cameraMotion(globe.pointOfView())
    let focus: CameraFocus = { selectedAt: 0, challengerSince: 0 }
    let resumeAt = 0
    let previousFrame = performance.now()
    let frame = 0
    let previousEvents: PlatformActivityEvent[] | undefined
    let candidates: CameraTarget[] = []
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
      })
    }
    return [...infrastructure, ...origins.values()]
  }, [activityEvents, statusByRegion, infraStatus])

  const arcs = useMemo<ActivityArc[]>(() => {
    if (!layout) return []
    return activityEvents.flatMap((event) => {
      const route = activityRoute(event, infrastructureNodes(infraStatus))
      if (!route) return []
      const { source, target } = route
      const { pulseCount, pulseDurationMs: dashTime, pulseLength: dashLength } = activityMotion(event)
      // Co-located services get a short schematic arc around their shared
      // infrastructure marker; it does not claim a second geographic location.
      const localOffset = route.local ? (route.outbound ? 0.7 : -0.7) : 0
      const pulses: ActivityArc[] = Array.from({ length: pulseCount }, (_, pulseIndex) => ({
        id: `${route.key}-${pulseIndex}`,
        startLat: source[1],
        startLng: source[0] - localOffset,
        endLat: target[1],
        endLng: target[0] + localOffset,
        color: layout.activityColors[route.category],
        stroke: route.internal ? 0.6 : 0.35,
        dashTime,
        dashLength: route.internal ? dashLength / 2 : dashLength,
        dashGap: 1 - dashLength,
        dashInitialGap: pulseIndex / pulseCount,
      }))
      if (!route.internal) return pulses
      // A persistent high-contrast dashed backbone distinguishes internal hops.
      // The moving category-coloured pulses still identify operation type/direction.
      return [{
        ...pulses[0], id: `${route.key}-internal-track`, color: layout.internal,
        stroke: 0.45, dashTime: 0, dashLength: 0.035, dashGap: 0.035, dashInitialGap: 0,
      }, ...pulses]
    })
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
          globeImageUrl={layout.highResolution
            ? "/images/dashboard/earth-night-nasa-8k.webp"
            : "/images/dashboard/earth-night-nasa.webp"}
          showAtmosphere
          atmosphereColor={layout.primary}
          atmosphereAltitude={0.12}
          showGraticules
          pointsData={points}
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
