import { useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoMercator } from "d3-geo";
import dottedMapData from "../../data/dashboard/dotted-map-data.json";
import { INFRA_NODES } from "../../data/dashboard/infra-nodes";
import type { InfraStatusNode, ActivityEvent } from "../../api/hooks";

const BLOOM_COLORS = [
  '#005c67', // teal
  '#1D9BF0', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#0EA5E9', // sky
  '#F97316', // orange
  '#14B8A6', // mint
  '#c46ede', // oxy
];

const STATUS_COLORS = {
  online: '#10B981',
  degraded: '#F59E0B',
  offline: '#EF4444',
} as const;

const StaticPixel = memo(({ x, y }: { x: number; y: number }) => (
  <rect x={x} y={y} width={3} height={3} fill="var(--muted-foreground)" fillOpacity={0.3} />
));
StaticPixel.displayName = "StaticPixel";

const AnimatedPixel = memo(
  ({
    x,
    y,
    color,
    canPulse,
    cityDistanceRank,
  }: {
    x: number;
    y: number;
    color: string;
    canPulse: boolean;
    cityDistanceRank: number;
  }) => {
    const delay = useMemo(() => cityDistanceRank * 0.1, [cityDistanceRank]);

    const animate = canPulse
      ? {
          scale: [1, 1.8, 1],
          opacity: [0.8, 1, 0.8],
        }
      : { scale: 1, opacity: 1 };

    const transition = canPulse
      ? {
          opacity: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay,
            repeatDelay: delay,
          },
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay,
            repeatDelay: delay,
          },
        }
      : { type: "spring" as const, stiffness: 260, damping: 20 };

    return (
      <motion.rect
        x={x}
        y={y}
        width={3}
        height={3}
        fill={color}
        animate={animate}
        transition={transition}
        style={{
          willChange: canPulse && cityDistanceRank < 10 ? "transform, opacity" : undefined,
        }}
      />
    );
  }
);
AnimatedPixel.displayName = "AnimatedPixel";

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
        <title>{`${label} — ${status} (${services} services)`}</title>
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

function haversineDistance(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(h));
}

interface DottedMapProps {
  width?: number;
  height?: number;
  activeCountries?: Array<{ location: string; count: number }>;
  infraStatus?: InfraStatusNode[];
  activityEvents?: ActivityEvent[];
}

export default function DottedMap({
  width = 1000,
  height = 560,
  activeCountries,
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

  const activityMap = useMemo(() => {
    const map = new Map<string, { count: number; color: string; dotsToShow: number; rank: number }>();
    if (!activeCountries || activeCountries.length === 0) return map;

    const maxCount = activeCountries[0]?.count || 1;
    activeCountries.forEach((entry, index) => {
      const code = entry.location?.toUpperCase();
      if (!code) return;
      const dotsToShow = Math.max(5, Math.floor(35 * (entry.count / maxCount)));
      map.set(code, {
        count: entry.count,
        color: BLOOM_COLORS[index % BLOOM_COLORS.length],
        dotsToShow,
        rank: index,
      });
    });
    return map;
  }, [activeCountries]);

  const { staticPixels, animatedPixels } = useMemo(() => {
    const staticArr: Array<{ key: string; x: number; y: number }> = [];
    const animatedArr: Array<{
      key: string;
      x: number;
      y: number;
      color: string;
      canPulse: boolean;
      cityDistanceRank: number;
    }> = [];

    Object.entries(dottedMapData as Record<string, Array<{ lon: number; lat: number; cityDistanceRank: number }>>).forEach(
      ([countryCode, cities]) => {
        const activity = activityMap.get(countryCode);

        cities.forEach((city) => {
          const coords = projection([city.lon, city.lat]);
          if (!coords) return;

          const [x, y] = coords;
          if (x < 0 || x > width || y < 0 || y > height) return;

          const key = `${countryCode}-${city.cityDistanceRank}`;

          if (activity && city.cityDistanceRank < activity.dotsToShow) {
            animatedArr.push({
              key,
              x,
              y,
              color: activity.color,
              canPulse: activity.rank < 3 && city.cityDistanceRank < 5,
              cityDistanceRank: city.cityDistanceRank,
            });
          } else {
            staticArr.push({ key, x, y });
          }
        });
      }
    );

    return { staticPixels: staticArr, animatedPixels: animatedArr };
  }, [projection, width, height, activityMap]);

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

  // Project activity flash positions using country centroids
  const projectedFlashes = useMemo(() => {
    if (!activityEvents || activityEvents.length === 0) return [];

    const mapData = dottedMapData as Record<string, Array<{ lon: number; lat: number; cityDistanceRank: number }>>;

    return activityEvents.map(event => {
      const countryDots = mapData[event.countryCode];
      if (!countryDots || countryDots.length === 0) return null;

      // Use the centroid (first city entry)
      const centroid = countryDots.find(d => d.cityDistanceRank === 0) ?? countryDots[0];
      const coords = projection([centroid.lon, centroid.lat]);
      if (!coords) return null;

      const activity = activityMap.get(event.countryCode);
      return {
        key: `flash-${event.timestamp}`,
        x: coords[0],
        y: coords[1],
        color: activity?.color ?? BLOOM_COLORS[0],
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);
  }, [activityEvents, projection, activityMap]);

  // Connection lines: top 3 active countries → nearest infra node
  const connectionLines = useMemo(() => {
    if (!activeCountries || activeCountries.length === 0 || projectedInfraNodes.length === 0) return [];

    const mapData = dottedMapData as Record<string, Array<{ lon: number; lat: number; cityDistanceRank: number }>>;
    const top3 = activeCountries.slice(0, 3);

    return top3.map((entry, idx) => {
      const code = entry.location?.toUpperCase();
      if (!code) return null;

      const countryDots = mapData[code];
      if (!countryDots || countryDots.length === 0) return null;

      const centroid = countryDots.find(d => d.cityDistanceRank === 0) ?? countryDots[0];
      const countryCoords = projection([centroid.lon, centroid.lat]);
      if (!countryCoords) return null;

      // Find nearest infra node by geographic distance
      let nearest = INFRA_NODES[0];
      let minDist = Infinity;
      for (const node of INFRA_NODES) {
        const dist = haversineDistance([centroid.lon, centroid.lat], node.coordinates);
        if (dist < minDist) {
          minDist = dist;
          nearest = node;
        }
      }

      const nodeCoords = projection(nearest.coordinates);
      if (!nodeCoords) return null;

      const activity = activityMap.get(code);
      return {
        key: `conn-${code}`,
        x1: countryCoords[0],
        y1: countryCoords[1],
        x2: nodeCoords[0],
        y2: nodeCoords[1],
        color: activity?.color ?? BLOOM_COLORS[idx % BLOOM_COLORS.length],
      };
    }).filter((l): l is NonNullable<typeof l> => l !== null);
  }, [activeCountries, projectedInfraNodes, projection, activityMap]);

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

        {/* Connection lines (behind everything) */}
        <g>
          <AnimatePresence>
            {connectionLines.map(line => (
              <motion.line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.color}
                strokeOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-8"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </motion.line>
            ))}
          </AnimatePresence>
        </g>

        {/* Static pixels */}
        <g>
          {staticPixels.map((p) => (
            <StaticPixel key={p.key} x={p.x} y={p.y} />
          ))}
        </g>

        {/* Animated pixels */}
        <g>
          {animatedPixels.map((p) => (
            <AnimatedPixel
              key={p.key}
              x={p.x}
              y={p.y}
              color={p.color}
              canPulse={p.canPulse}
              cityDistanceRank={p.cityDistanceRank}
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
