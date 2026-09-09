import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { geoMercator } from "d3-geo";
import dottedMapData from "../../data/dashboard/dotted-map-data.json";
import { INFRA_NODES } from "../../data/dashboard/infra-nodes";
import type { InfraStatusNode } from "../../api/hooks";

const STATUS_COLORS = {
  online: 'var(--success-text)',
  degraded: 'var(--warning-text)',
  offline: 'var(--destructive)',
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

interface DottedMapProps {
  width?: number;
  height?: number;
  infraStatus?: InfraStatusNode[];
}

export default function DottedMap({
  width = 1000,
  height = 560,
  infraStatus,
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

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[50dvh] bg-background"
      >
        {/* Static pixels */}
        <g>
          {staticPixels.map((p) => (
            <StaticPixel key={p.key} x={p.x} y={p.y} />
          ))}
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
