import { useMemo, memo, useState } from "react";
import { ComposableMap, Geographies, Marker } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { geoMercator } from "d3-geo";
import dottedMapData from "../../data/dashboard/dotted-map-data.json";
import { regionMarkers, topCountries, countryRequests } from "../../data/dashboard/country-data";

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

// Assign Bloom colors to countries in rotation
const countryKeys = Object.keys(countryRequests);
const countryColors: Record<string, string> = {};
countryKeys.forEach((code, i) => {
  countryColors[code] = BLOOM_COLORS[i % BLOOM_COLORS.length];
});

const getCountryColor = (iso2: string): string => {
  return countryColors[iso2] || BLOOM_COLORS[0];
};

const top10Countries = new Set(
  topCountries.slice(0, 10).map((c) => c.code)
);

const getDotsToShow = (iso2: string): number => {
  const data = countryRequests[iso2];
  if (!data) return 2;

  const rate = (data.value / 260000) * 1000;

  if (rate < 400) return 2;
  if (rate < 1000) return 4;
  if (rate < 5000) return 8;
  if (rate < 10000) return 15;
  if (rate < 50000) return 25;
  return 35;
};

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

const EdgeMarker = memo(
  ({ marker, delay, onHover }: { marker: (typeof regionMarkers)[0]; delay: number; onHover: (marker: (typeof regionMarkers)[0] | null) => void }) => (
    <Marker coordinates={marker.coordinates}>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay,
        }}
        onMouseEnter={() => onHover(marker)}
        onMouseLeave={() => onHover(null)}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
      >
        <polygon
          data-edge={marker.id}
          data-lat={marker.coordinates[1]}
          data-lng={marker.coordinates[0]}
          fill="var(--foreground)"
          stroke="var(--background)"
          strokeWidth={1}
          strokeOpacity={0.5}
          style={{ paintOrder: "stroke" }}
          points="0,-2.3 -2,1.2 2,1.2"
        />
      </motion.g>
    </Marker>
  )
);
EdgeMarker.displayName = "EdgeMarker";

interface DottedMapProps {
  width?: number;
  height?: number;
  activeCountries?: Array<{ location: string; count: number }>;
}

export default function DottedMap({ width = 1000, height = 560, activeCountries }: DottedMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<(typeof regionMarkers)[0] | null>(null);

  const handleMarkerHover = (marker: (typeof regionMarkers)[0] | null) => {
    setHoveredMarker(marker);
  };

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(140)
        .center([15, 25])
        .rotate([0, 0, 0])
        .translate([width / 2, height / 2]),
    [width, height]
  );

  const liveActiveSet = useMemo(() => {
    if (!activeCountries || activeCountries.length === 0) return null;
    return new Set(activeCountries.map((c) => c.location?.toUpperCase()));
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
        const dotsToShow = getDotsToShow(countryCode);
        const color = getCountryColor(countryCode);
        const isTop10 = liveActiveSet
          ? liveActiveSet.has(countryCode)
          : top10Countries.has(countryCode);

        cities.forEach((city) => {
          const coords = projection([city.lon, city.lat]);
          if (!coords) return;

          const [x, y] = coords;
          if (x < 0 || x > width || y < 0 || y > height) return;

          const key = `${countryCode}-${city.cityDistanceRank}`;
          const liveBoost = isTop10 && liveActiveSet ? dotsToShow + 10 : dotsToShow;
          const isAnimated = city.cityDistanceRank < liveBoost;

          if (isAnimated) {
            animatedArr.push({
              key,
              x,
              y,
              color,
              canPulse: isTop10 && city.cityDistanceRank < 5,
              cityDistanceRank: city.cityDistanceRank,
            });
          } else {
            staticArr.push({ key, x, y });
          }
        });
      }
    );

    return { staticPixels: staticArr, animatedPixels: animatedArr };
  }, [projection, width, height, liveActiveSet]);

  const markerDelays = useMemo(
    () => regionMarkers.map((_, i) => (i * 0.05) % 1),
    []
  );

  return (
    <div className="relative w-full max-h-[70dvh] overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto bg-background"
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

      <div className="absolute inset-0 pointer-events-none">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [15, 25],
            rotate: [0, 0, 0],
          }}
          width={width}
          height={height}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
            {() => null}
          </Geographies>
          {regionMarkers.map((marker, index) => (
            <EdgeMarker
              key={marker.id}
              marker={marker}
              delay={markerDelays[index]}
              onHover={handleMarkerHover}
            />
          ))}
        </ComposableMap>
      </div>

      <AnimatePresence>
        {hoveredMarker && (() => {
          const coords = projection(hoveredMarker.coordinates);
          if (!coords) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-10 bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono shadow-lg whitespace-nowrap"
              style={{
                left: `${(coords[0] / width) * 100}%`,
                top: `${(coords[1] / height) * 100}%`,
                transform: "translate(-50%, -140%)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-foreground">▲</span>
                <span className="text-foreground font-medium">{hoveredMarker.id}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{hoveredMarker.name}</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
