import { useCallback, useEffect, useMemo, memo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoEquirectangular } from "d3-geo";
import { infrastructureNodes } from "../../data/dashboard/infra-nodes";
import { activityRegionCoordinates, activityRegionLabel } from "../../data/dashboard/activity-regions";
import { ACTIVITY_CATEGORIES } from "../../data/dashboard/activity-categories";
import { activityRoute } from "../../data/dashboard/activity-routes";
import { activityMotion } from "../../data/dashboard/activity-motion";
import type { InfraStatusNode, PlatformActivityEvent } from "../../api/hooks";

const STATUS_COLORS = {
  unknown: 'var(--muted-foreground)',
  online: 'var(--color-success)',
  degraded: 'var(--color-warning)',
  offline: 'var(--color-destructive)',
} as const;

const InfraNodeMarker = memo(
  ({ x, y, label, status, services }: {
    x: number;
    y: number;
    label: string;
    status: 'online' | 'degraded' | 'offline' | 'unknown';
    services: number;
  }) => {
    const color = STATUS_COLORS[status];
    return (
      <g>
        <title>{`${label}: ${status} (${services} services)`}</title>
        {/* Pulsing ring */}
        <motion.circle
          cx={x}
          cy={y}
          r={6}
          fill="none"
          stroke={color}
          strokeWidth={1}
          animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
        {/* Diamond shape */}
        <polygon
          points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`}
          fill={color}
          fillOpacity={0.9}
        />
        {/* Label */}
        <text
          x={x}
          y={y + 14}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize={8}
          fontFamily="monospace"
          style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          {label}
        </text>
      </g>
    );
  }
);
InfraNodeMarker.displayName = "InfraNodeMarker";

const ActivityFlash = memo(
  ({ x, y, color }: { x: number; y: number; color: string }) => (
    <motion.circle
      cx={x}
      cy={y}
      r={4}
      fill={color}
      filter="url(#flash-glow)"
      initial={{ scale: 0, opacity: 0.8 }}
      animate={{ scale: 3, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    />
  )
);
ActivityFlash.displayName = "ActivityFlash";

interface DottedMapProps {
  width?: number;
  height?: number;
  infraStatus?: InfraStatusNode[];
  activityEvents?: PlatformActivityEvent[];
}

export default function DottedMap({
  width = 1000,
  height = 560,
  infraStatus,
  activityEvents,
}: DottedMapProps) {
  const [viewport, setViewport] = useState({ x: 140, y: 42, width: 720, height: 476 });
  const viewportRef = useRef(viewport);
  const dragRef = useRef<{ pointerX: number; pointerY: number; viewX: number; viewY: number } | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  viewportRef.current = viewport;
  const projection = useMemo(
    () =>
      geoEquirectangular()
        .scale(height / Math.PI)
        .translate([width / 2, height / 2]),
    [width, height]
  );

  // Project infra node positions
  const projectedInfraNodes = useMemo(() => {
    const statusMap = new Map<string, InfraStatusNode>();
    if (infraStatus) {
      for (const node of infraStatus) statusMap.set(node.region, node);
    }

    return infrastructureNodes(infraStatus).map(node => {
      const coords = projection(node.coordinates);
      if (!coords) return null;
      const status = statusMap.get(node.region);
      return {
        key: node.region,
        x: coords[0],
        y: coords[1],
        label: node.label,
        status: status?.status ?? 'unknown' as const,
        services: node.services.length,
      };
    }).filter((n): n is NonNullable<typeof n> => n !== null);
  }, [projection, infraStatus]);

  // Project anonymous activity buckets at the infrastructure region that
  // processed them. No user IP or user-derived coordinate enters this path.
  const projectedFlashes = useMemo(() => {
    if (!activityEvents || activityEvents.length === 0) return [];

    const seenRegions = new Set<string>();
    return activityEvents.map(event => {
      const region = event.sourceRegion ?? event.region;
      if (seenRegions.has(region)) return null;
      seenRegions.add(region);
      const coordinates = event.sourceRegion === region && event.sourceCoordinates
        ? event.sourceCoordinates
        : region.startsWith('edge-') ? activityRegionCoordinates(region) : infrastructureNodes(infraStatus).find(node => node.region === region)?.coordinates;
      if (!coordinates) return null;
      const coords = projection(coordinates);
      if (!coords) return null;
      return {
        key: `flash-${region}-${event.emittedAt}`,
        x: coords[0],
        y: coords[1],
        color: 'var(--color-primary)',
        label: event.sourceLabel ?? activityRegionLabel(region),
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);
  }, [activityEvents, projection, infraStatus]);

  const projectedRoutes = useMemo(() => {
    if (!activityEvents || activityEvents.length === 0) return [];

    return activityEvents.flatMap(event => {
      const route = activityRoute(event, infrastructureNodes(infraStatus));
      if (!route) return [];
      const start = projection(route.source);
      const end = projection(route.target);
      if (!start || !end) return [];
      const curve = Math.min(80, Math.abs(end[0] - start[0]) * 0.18 + 24);
      const activity = activityMotion(event);
      return [{
        key: route.key,
        path: route.local
          ? `M ${start[0]} ${start[1]} c ${route.outbound ? 32 : -32} -36 ${route.outbound ? -32 : 32} -36 0 0`
          : `M ${start[0]} ${start[1]} Q ${(start[0] + end[0]) / 2} ${Math.min(start[1], end[1]) - curve} ${end[0]} ${end[1]}`,
        color: ACTIVITY_CATEGORIES.find(item => item.id === route.category)!.color,
        trackColor: route.internal ? 'var(--tertiary)' : ACTIVITY_CATEGORIES.find(item => item.id === route.category)!.color,
        direction: route.outbound ? 'outbound' : 'inbound',
        category: route.category,
        internal: route.internal,
        pulseCount: activity.pulseCount,
        pulseDuration: activity.pulseDurationMs / 1_000,
        pulseLength: activity.pulseLength * 100,
      }];
    });
  }, [activityEvents, projection, infraStatus]);

  const cancelAutomaticFocus = useCallback(() => {
    if (returnTimerRef.current !== null) window.clearTimeout(returnTimerRef.current);
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    returnTimerRef.current = null;
    focusFrameRef.current = null;
  }, []);

  const focusBusiestOrigin = useCallback(() => {
    if (dragRef.current) return;
    const requestsByOrigin = new Map<string, number>();
    for (const event of activityEvents ?? []) {
      if (event.sourceRegion) {
        requestsByOrigin.set(event.sourceRegion, (requestsByOrigin.get(event.sourceRegion) ?? 0) + event.requests);
      }
    }
    const busiestOrigin = [...requestsByOrigin.entries()]
      .sort((left, right) => right[1] - left[1])[0]?.[0];
    const busiestEvent = activityEvents?.find(event => event.sourceRegion === busiestOrigin);
    const coordinates = busiestEvent?.sourceCoordinates
      ?? (busiestOrigin ? activityRegionCoordinates(busiestOrigin) : undefined);
    const focus = coordinates ? projection(coordinates) : null;
    if (!focus) return;

    const start = viewportRef.current;
    const targetX = Math.max(0, Math.min(width - start.width, focus[0] - start.width / 2));
    const targetY = Math.max(0, Math.min(height - start.height, focus[1] - start.height / 2));
    const startedAt = performance.now();
    const animateFocus = (now: number) => {
      if (dragRef.current) return;
      const progress = Math.min(1, (now - startedAt) / 900);
      const eased = 1 - Math.pow(1 - progress, 3);
      setViewport(current => ({
        ...current,
        x: start.x + (targetX - start.x) * eased,
        y: start.y + (targetY - start.y) * eased,
      }));
      if (progress < 1) focusFrameRef.current = window.requestAnimationFrame(animateFocus);
    };
    focusFrameRef.current = window.requestAnimationFrame(animateFocus);
  }, [activityEvents, height, projection, width]);

  const scheduleAutomaticFocus = useCallback(() => {
    cancelAutomaticFocus();
    returnTimerRef.current = window.setTimeout(() => {
      focusBusiestOrigin();
    }, 600);
  }, [cancelAutomaticFocus, focusBusiestOrigin]);

  useEffect(() => {
    if (!dragRef.current) {
      cancelAutomaticFocus();
      focusBusiestOrigin();
    }
  }, [cancelAutomaticFocus, focusBusiestOrigin]);

  const rootRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    return cancelAutomaticFocus;
  }, [cancelAutomaticFocus]);

  return (
    <div ref={rootRef} className="relative h-full w-full">
      <svg
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
        className="h-full w-full cursor-grab touch-none bg-background active:cursor-grabbing"
        preserveAspectRatio="none"
        onPointerDown={(event) => {
          cancelAutomaticFocus();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            viewX: viewport.x,
            viewY: viewport.y,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const nextX = drag.viewX - (event.clientX - drag.pointerX) * viewport.width / bounds.width;
          const nextY = drag.viewY - (event.clientY - drag.pointerY) * viewport.height / bounds.height;
          setViewport(current => ({
            ...current,
            x: Math.max(0, Math.min(width - current.width, nextX)),
            y: Math.max(0, Math.min(height - current.height, nextY)),
          }));
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          dragRef.current = null;
          scheduleAutomaticFocus();
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          scheduleAutomaticFocus();
        }}
      >
        <defs>
          <filter id="flash-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <image
          href="/images/dashboard/earth-night-nasa.webp"
          x={0}
          y={0}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />

        <g>
          {projectedRoutes.map(route => (
            <g key={route.key} data-traffic-direction={route.direction} data-traffic-scope={route.internal ? "internal" : "external"} data-traffic-type={route.category}>
              <path d={route.path} fill="none" stroke={route.trackColor} strokeWidth={route.internal ? 1.4 : 0.8} strokeDasharray={route.internal ? "3 3" : undefined} opacity={route.internal ? 0.65 : 0.28} />
              {Array.from({ length: route.pulseCount }, (_, pulseIndex) => (
                <motion.path
                  key={`${route.key}-${pulseIndex}`}
                  d={route.path}
                  pathLength={100}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={route.internal ? 1.5 : 2}
                  strokeLinecap="round"
                  strokeDasharray={`${route.internal ? route.pulseLength / 2 : route.pulseLength} ${100 - route.pulseLength}`}
                  initial={{ strokeDashoffset: -100 * pulseIndex / route.pulseCount, opacity: 0 }}
                  animate={{ strokeDashoffset: -100 * (1 + pulseIndex / route.pulseCount), opacity: 0.95 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    strokeDashoffset: { duration: route.pulseDuration, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 0.2 },
                  }}
                />
              ))}

            </g>
          ))}
        </g>

        {/* Activity flashes */}
        <g>
          <AnimatePresence>
            {projectedFlashes.map(f => (
              <g key={f.key}>
                <ActivityFlash x={f.x} y={f.y} color={f.color} />
                <text x={f.x} y={f.y - 10} textAnchor="middle" fill="var(--foreground)" fontSize={9} fontWeight={600}>{f.label}</text>
              </g>
            ))}
          </AnimatePresence>
        </g>

        {/* Infrastructure nodes (topmost) */}
        <g>
          {projectedInfraNodes.map(node => (
            <InfraNodeMarker
              key={node.key}
              x={node.x}
              y={node.y}
              label={node.label}
              status={node.status}
              services={node.services}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
