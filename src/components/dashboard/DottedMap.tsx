import { useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoMercator } from "d3-geo";
import dottedMapData from "../../data/dashboard/dotted-map-data.json";
import { INFRA_NODES } from "../../data/dashboard/infra-nodes";
import type { InfraStatusNode, PlatformActivityEvent } from "../../api/hooks";

const STATUS_COLORS = {
  online: 'var(--color-success)',
  degraded: 'var(--color-warning)',
  offline: 'var(--color-destructive)',
} as const;

const StaticPixel = memo(({ x, y }: { x: number; y: number }) => (
  <rect x={x} y={y} width={3} height={3} fill="var(--muted-foreground)" fillOpacity={0.3} />
));
StaticPixel.displayName = "StaticPixel";

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
  const projection = useMemo(
    () =>
      geoMercator()
        .scale(140)
        .center([15, 25])
        .rotate([0, 0, 0])
        .translate([width / 2, height / 2]),
    [width, height]
  );

  const staticPixels = useMemo(() => {
    const staticArr: Array<{ key: string; x: number; y: number }> = [];

    Object.entries(dottedMapData as Record<string, Array<{ lon: number; lat: number; cityDistanceRank: number }>>).forEach(
      ([countryCode, cities]) => {
        cities.forEach((city) => {
          const coords = projection([city.lon, city.lat]);
          if (!coords) return;

          const [x, y] = coords;
          if (x < 0 || x > width || y < 0 || y > height) return;

          const key = `${countryCode}-${city.cityDistanceRank}`;

          staticArr.push({ key, x, y });
        });
      }
    );

    return staticArr;
  }, [projection, width, height]);

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
  // processed them. No user location enters this data path.
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

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[50dvh] bg-background"
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

        {/* Static pixels */}
        <g>
          {staticPixels.map((p) => (
            <StaticPixel key={p.key} x={p.x} y={p.y} />
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
