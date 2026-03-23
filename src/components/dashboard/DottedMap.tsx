import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { geoMercator } from "d3-geo";
import dottedMapData from "../../data/dashboard/dotted-map-data.json";

// All 11 Bloom preset hex colors
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

interface DottedMapProps {
  width?: number;
  height?: number;
  activeCountries?: Array<{ location: string; count: number }>;
}

export default function DottedMap({ width = 1000, height = 560, activeCountries }: DottedMapProps) {
  const projection = useMemo(
    () =>
      geoMercator()
        .scale(140)
        .center([15, 25])
        .rotate([0, 0, 0])
        .translate([width / 2, height / 2]),
    [width, height]
  );

  // Build activity map from real SSE data: country code → { count, color, dotsToShow }
  const activityMap = useMemo(() => {
    const map = new Map<string, { count: number; color: string; dotsToShow: number; rank: number }>();
    if (!activeCountries || activeCountries.length === 0) return map;

    const maxCount = activeCountries[0]?.count || 1;
    activeCountries.forEach((entry, index) => {
      const code = entry.location?.toUpperCase();
      if (!code) return;
      // More sessions → more dots (scale 5–35 based on rank)
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

          // Only animate dots in countries with real live activity
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

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[50dvh] bg-background"
      >
        <g>
          {staticPixels.map((p) => (
            <StaticPixel key={p.key} x={p.x} y={p.y} />
          ))}
        </g>

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
      </svg>
    </div>
  );
}
