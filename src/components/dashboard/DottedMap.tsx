import { useCallback, useMemo, memo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoEquirectangular } from "d3-geo";
import { INFRA_NODES } from "../../data/dashboard/infra-nodes";
import { activityRegionCoordinates } from "../../data/dashboard/activity-regions";
import { activityCategoryColor } from "../../data/dashboard/activity-categories";
import type { InfraStatusNode, PlatformActivityEvent } from "../../api/hooks";

const STATUS_COLORS = {
  online: 'var(--color-success)',
  degraded: 'var(--color-warning)',
  offline: 'var(--color-destructive)',
} as const;

const InfraNodeMarker = memo(
  ({ x, y, label, status, services }: {
    x: number;
    y: number;
    label: string;
    status: 'online' | 'degraded' | 'offline';
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

    return INFRA_NODES.map(node => {
      const coords = projection(node.coordinates);
      if (!coords) return null;
      const status = statusMap.get(node.region);
      return {
        key: node.region,
        x: coords[0],
        y: coords[1],
        label: node.label,
        status: status?.status ?? 'online' as const,
        services: node.services.length,
      };
    }).filter((n): n is NonNullable<typeof n> => n !== null);
  }, [projection, infraStatus]);

  // Project anonymous activity buckets at the infrastructure region that
  // processed them. No user IP or user-derived coordinate enters this path.
  const projectedFlashes = useMemo(() => {
    if (!activityEvents || activityEvents.length === 0) return [];

    return activityEvents.map(event => {
      const node = INFRA_NODES.find(candidate => candidate.region === event.region);
      if (!node) return null;
      const coords = projection(node.coordinates);
      if (!coords) return null;
      return {
        key: `flash-${event.region}-${event.emittedAt}`,
        x: coords[0],
        y: coords[1],
        color: 'var(--color-primary)',
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);
  }, [activityEvents, projection]);

  const projectedRoutes = useMemo(() => {
    if (!activityEvents || activityEvents.length === 0) return [];

    return activityEvents.flatMap(event => {
      if (!event.sourceRegion || !event.targetRegion || event.sourceRegion === event.targetRegion) return [];
      const source = activityRegionCoordinates(event.sourceRegion);
      const start = source ? projection(source) : null;
      if (!start) return [];
      const target = activityRegionCoordinates(event.targetRegion);
      const end = target ? projection(target) : null;
      if (!end) return [];
      const curve = Math.min(80, Math.abs(end[0] - start[0]) * 0.18 + 24);
      return [{
        key: `route-${event.sourceRegion}-${event.targetRegion}-${event.emittedAt}`,
        path: `M ${start[0]} ${start[1]} Q ${(start[0] + end[0]) / 2} ${Math.min(start[1], end[1]) - curve} ${end[0]} ${end[1]}`,
        color: activityCategoryColor(event.service),
      }];
    });
  }, [activityEvents, projection]);

  const cancelAutomaticFocus = useCallback(() => {
    if (returnTimerRef.current !== null) window.clearTimeout(returnTimerRef.current);
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    returnTimerRef.current = null;
    focusFrameRef.current = null;
  }, []);

  const scheduleAutomaticFocus = useCallback(() => {
    cancelAutomaticFocus();
    returnTimerRef.current = window.setTimeout(() => {
      const requestsByRegion = new Map<string, number>();
      for (const event of activityEvents ?? []) {
        requestsByRegion.set(event.region, (requestsByRegion.get(event.region) ?? 0) + event.requests);
      }
      const busiestRegion = [...requestsByRegion.entries()]
        .sort((left, right) => right[1] - left[1])[0]?.[0];
      const busiestNode = INFRA_NODES.find(node => node.region === busiestRegion);
      const focus = busiestNode ? projection(busiestNode.coordinates) : null;
      if (!focus) return;

      const start = viewportRef.current;
      const targetX = Math.max(0, Math.min(width - start.width, focus[0] - start.width / 2));
      const targetY = Math.max(0, Math.min(height - start.height, focus[1] - start.height / 2));
      const startedAt = performance.now();
      const animateFocus = (now: number) => {
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
    }, 4_000);
  }, [activityEvents, cancelAutomaticFocus, height, projection, width]);

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
            <motion.path
              key={route.key}
              d={route.path}
              fill="none"
              stroke={route.color}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeDasharray="7 9"
              initial={{ strokeDashoffset: 0, opacity: 0 }}
              animate={{ strokeDashoffset: -32, opacity: 0.75 }}
              exit={{ opacity: 0 }}
              transition={{
                strokeDashoffset: { duration: 1.4, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.25 },
              }}
            />
          ))}
        </g>

        {/* Activity flashes */}
        <g>
          <AnimatePresence>
            {projectedFlashes.map(f => (
              <ActivityFlash key={f.key} x={f.x} y={f.y} color={f.color} />
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
