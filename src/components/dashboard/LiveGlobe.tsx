import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { INFRA_NODES } from '../../data/dashboard/infra-nodes'
import { activityRegionCoordinates, activityRegionLabel } from '../../data/dashboard/activity-regions'
import { activityCategory, ACTIVITY_CATEGORIES, type ActivityCategory } from '../../data/dashboard/activity-categories'
import { activityMotion } from '../../data/dashboard/activity-motion'

interface LiveGlobeProps {
  infraStatus?: InfraStatusNode[]
  activityEvents?: PlatformActivityEvent[]
}

interface GlobeLayout {
  width: number
  height: number
  highResolution: boolean
  primary: string
  success: string
  warning: string
  destructive: string
  activityColors: Record<ActivityCategory, string>
}

interface ActivityArc {
  id: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
  dashTime: number
  dashLength: number
  dashGap: number
  dashInitialGap: number
}

interface ActivityRing {
  id: string
  lat: number
  lng: number
  color: string
  maxRadius: number
}

const MIN_GLOBE_HEIGHT = 420
const RETURN_TO_ACTIVITY_DELAY = 600
const FOCUS_TRANSITION_DURATION = 1_200

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
  const returnTimerRef = useRef<number | null>(null)
  const resumeTimerRef = useRef<number | null>(null)
  const controlsCleanupRef = useRef<(() => void) | null>(null)
  const sceneCleanupRef = useRef<(() => void) | null>(null)
  const isInteractingRef = useRef(false)
  activityEventsRef.current = activityEvents

  useEffect(() => {
    if (isInteractingRef.current) return
    const requestsByOrigin = new Map<string, number>()
    for (const event of activityEvents) {
      if (event.sourceRegion) {
        requestsByOrigin.set(event.sourceRegion, (requestsByOrigin.get(event.sourceRegion) ?? 0) + event.requests)
      }
    }
    const busiestOrigin = [...requestsByOrigin.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
    const busiestEvent = activityEvents.find((event) => event.sourceRegion === busiestOrigin)
    const coordinates = busiestEvent?.sourceCoordinates
      ?? (busiestOrigin ? activityRegionCoordinates(busiestOrigin) : undefined)
    if (coordinates && globeRef.current) {
      globeRef.current.pointOfView({ lat: coordinates[1], lng: coordinates[0], altitude: 1.65 }, 1_200)
    }
  }, [activityEvents])

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
        primary: threeColor(style.getPropertyValue('--primary').trim()),
        success: threeColor(style.getPropertyValue('--success').trim()),
        warning: threeColor(style.getPropertyValue('--warning').trim()),
        destructive: threeColor(style.getPropertyValue('--destructive').trim()),
        activityColors: Object.fromEntries(ACTIVITY_CATEGORIES.map(({ id }) => [
          id,
          threeColor(style.getPropertyValue(`--chart-${id === 'identity' ? '5' : id === 'ai' ? '2' : id === 'communication' ? '4' : '1'}`).trim()),
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
      if (returnTimerRef.current !== null) window.clearTimeout(returnTimerRef.current)
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current)
    }
  }, [])

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.pointOfView({ lat: 28, lng: -28, altitude: 1.7 }, 0)
    const controls = globe.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.35
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

    const pauseAutomaticView = () => {
      isInteractingRef.current = true
      controls.autoRotate = false
      if (returnTimerRef.current !== null) window.clearTimeout(returnTimerRef.current)
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current)
    }

    const returnToBusiestRegion = () => {
      isInteractingRef.current = false
      returnTimerRef.current = window.setTimeout(() => {
        const requestsByOrigin = new Map<string, number>()
        for (const event of activityEventsRef.current) {
          if (!event.sourceRegion) continue
          requestsByOrigin.set(
            event.sourceRegion,
            (requestsByOrigin.get(event.sourceRegion) ?? 0) + event.requests,
          )
        }
        const busiestOrigin = [...requestsByOrigin.entries()]
          .sort((left, right) => right[1] - left[1])[0]?.[0]
        const busiestEvent = activityEventsRef.current.find(
          (event) => event.sourceRegion === busiestOrigin,
        )
        const coordinates = busiestEvent?.sourceCoordinates
          ?? (busiestOrigin ? activityRegionCoordinates(busiestOrigin) : undefined)
        if (coordinates) {
          globe.pointOfView({
            lat: coordinates[1],
            lng: coordinates[0],
            altitude: 1.55,
          }, FOCUS_TRANSITION_DURATION)
        }
        resumeTimerRef.current = window.setTimeout(() => {
          controls.autoRotate = true
        }, coordinates ? FOCUS_TRANSITION_DURATION : 0)
      }, RETURN_TO_ACTIVITY_DELAY)
    }

    controls.addEventListener('start', pauseAutomaticView)
    controls.addEventListener('end', returnToBusiestRegion)
    controlsCleanupRef.current?.()
    controlsCleanupRef.current = () => {
      controls.removeEventListener('start', pauseAutomaticView)
      controls.removeEventListener('end', returnToBusiestRegion)
    }
  }, [])

  const statusByRegion = useMemo(() => {
    const statuses = new Map<string, InfraStatusNode['status']>()
    for (const node of infraStatus ?? []) statuses.set(node.region, node.status)
    return statuses
  }, [infraStatus])

  const points = useMemo(() => {
    const infrastructure = INFRA_NODES.map((node) => ({
      region: node.region,
      label: node.label,
      lat: node.coordinates[1],
      lng: node.coordinates[0],
      status: statusByRegion.get(node.region) ?? 'online',
    }))
    const origins = new Map<string, (typeof infrastructure)[number]>()
    for (const event of activityEvents) {
      if (!event.sourceRegion || origins.has(event.sourceRegion)) continue
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
  }, [activityEvents, statusByRegion])

  const arcs = useMemo<ActivityArc[]>(() => {
    if (!layout) return []
    return activityEvents.flatMap((event) => {
      if (!event.sourceRegion || !event.targetRegion || event.sourceRegion === event.targetRegion) return []
      const source = event.sourceCoordinates ?? activityRegionCoordinates(event.sourceRegion)
      const target = activityRegionCoordinates(event.targetRegion)
      if (!source || !target) return []
      const { pulseCount, pulseDurationMs: dashTime, pulseLength: dashLength } = activityMotion(event)
      return Array.from({ length: pulseCount }, (_, pulseIndex) => [
        {
          id: `${event.sourceRegion}-${event.targetRegion}-${event.emittedAt}-request-${pulseIndex}`,
          startLat: source[1],
          startLng: source[0],
          endLat: target[1],
          endLng: target[0],
          color: layout.activityColors[activityCategory(event.service)],
          dashTime,
          dashLength,
          dashGap: 1 - dashLength,
          dashInitialGap: pulseIndex / pulseCount,
        },
        {
          id: `${event.sourceRegion}-${event.targetRegion}-${event.emittedAt}-response-${pulseIndex}`,
          startLat: target[1],
          startLng: target[0],
          endLat: source[1],
          endLng: source[0],
          color: layout.activityColors[activityCategory(event.service)],
          dashTime,
          dashLength,
          dashGap: 1 - dashLength,
          dashInitialGap: (pulseIndex + 0.5) / pulseCount,
        },
      ]).flat()
    })
  }, [activityEvents, layout])

  const rings = useMemo<ActivityRing[]>(() => {
    if (!layout) return []
    return activityEvents.flatMap((event) => {
      const region = event.sourceRegion ?? event.region
      const coordinates = event.sourceRegion === region && event.sourceCoordinates
        ? event.sourceCoordinates
        : activityRegionCoordinates(region)
      return coordinates ? [{
        id: `${region}-${event.emittedAt}`,
        lat: coordinates[1],
        lng: coordinates[0],
        color: layout.primary,
        maxRadius: Math.min(10, 3 + Math.log2(event.requests)),
      }] : []
    })
  }, [activityEvents, layout])

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
          arcStroke={0.35}
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
