import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "../../data/dashboard/country-data";
import type { PlatformStats } from "../../api/hooks";

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function PixelGridTransition({
  firstContent,
  secondContent,
  isActive,
  gridSize = 30,
  animationStepDuration = 0.3,
  className,
}: {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  isActive: boolean;
  gridSize?: number;
  animationStepDuration?: number;
  className?: string;
}) {
  const [showPixels, setShowPixels] = useState(false);
  const [animState, setAnimState] = useState<"idle" | "growing" | "shrinking">("idle");
  const hasActivatedRef = useRef(false);

  const pixels = useMemo(() => {
    const total = gridSize * gridSize;
    const result = [];
    for (let n = 0; n < total; n++) {
      const row = Math.floor(n / gridSize);
      const col = n % gridSize;
      const color = Math.random() > 0.85 ? "var(--primary)" : "var(--border)";
      result.push({ id: n, row, col, color });
    }
    return result;
  }, [gridSize]);

  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  useEffect(() => {
    if (!hasActivatedRef.current && !isActive) return;
    if (isActive) hasActivatedRef.current = true;

    const indices = pixels.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices);

    setShowPixels(true);
    setAnimState("growing");

    const shrinkTimer = setTimeout(() => setAnimState("shrinking"), animationStepDuration * 1000);
    const hideTimer = setTimeout(() => {
      setShowPixels(false);
      setAnimState("idle");
    }, animationStepDuration * 2000);

    return () => {
      clearTimeout(shrinkTimer);
      clearTimeout(hideTimer);
    };
  }, [isActive, animationStepDuration, pixels]);

  const delayPerPixel = useMemo(() => animationStepDuration / pixels.length, [animationStepDuration, pixels.length]);
  const orderMap = useMemo(() => {
    const map = new Map<number, number>();
    shuffledOrder.forEach((idx, order) => map.set(idx, order));
    return map;
  }, [shuffledOrder]);

  return (
    <div className={`w-full overflow-hidden max-w-full relative ${className || ""}`}>
      <motion.div
        className="h-full"
        aria-hidden={isActive}
        initial={{ opacity: 1 }}
        animate={{ opacity: isActive ? 0 : 1 }}
        transition={{ duration: 0, delay: animationStepDuration }}
      >
        {firstContent}
      </motion.div>

      <motion.div
        className="absolute inset-0 w-full h-full z-[2] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0, delay: animationStepDuration }}
        style={{ pointerEvents: isActive ? "auto" : "none" }}
        aria-hidden={!isActive}
      >
        {secondContent}
      </motion.div>

      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        }}
      >
        <AnimatePresence>
          {showPixels &&
            pixels.map((pixel) => {
              const order = orderMap.get(pixel.id) ?? 0;
              return (
                <motion.div
                  key={pixel.id}
                  style={{
                    backgroundColor: pixel.color,
                    aspectRatio: "1 / 1",
                    gridArea: `${pixel.row + 1} / ${pixel.col + 1}`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: animState === "growing" ? 1 : 0,
                    scale: animState === "growing" ? 1 : 0,
                  }}
                  transition={{ duration: 0.01, delay: order * delayPerPixel }}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  children,
  infoContent,
  href,
  className,
}: {
  title: string;
  value?: number;
  children?: React.ReactNode;
  infoContent?: string;
  href?: string;
  className?: string;
}) {
  const [showInfo, setShowInfo] = useState(false);

  const statsContent = (
    <div className="bg-surface p-4 md:p-6 w-full min-h-[120px] h-full">
      <div className="space-y-2">
        <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-foreground pr-6">
          {title}
        </h2>
        {value !== undefined && (
          <div className="text-3xl md:text-4xl tracking-normal font-mono tabular-nums">
            {formatNumber(value)}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const infoContentView = (
    <div className="bg-surface p-4 md:p-6 w-full h-full overflow-y-auto flex flex-col gap-y-2">
      {href ? (
        <a
          href={href}
          tabIndex={showInfo ? 0 : -1}
          className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-foreground hover:underline underline-offset-2 inline-flex gap-x-0.5 items-center w-fit shrink-0"
        >
          {title}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M6.75011 4H6.00011V5.5H6.75011H9.43945L5.46978 9.46967L4.93945 10L6.00011 11.0607L6.53044 10.5303L10.499 6.56182V9.25V10H11.999V9.25V5C11.999 4.44772 11.5512 4 10.999 4H6.75011Z" />
          </svg>
        </a>
      ) : (
        <span className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-foreground shrink-0">
          {title}
        </span>
      )}
      <span className="tracking-tight text-sm text-muted-foreground leading-relaxed line-clamp-6">
        {infoContent}
      </span>
    </div>
  );

  return (
    <div className={`relative group rounded-md overflow-hidden ${className || ""}`}>
      <PixelGridTransition
        firstContent={statsContent}
        secondContent={infoContentView}
        isActive={showInfo}
        gridSize={30}
        animationStepDuration={0.3}
        className="h-full"
      />
      {infoContent && (
        <div className={`absolute top-2 right-2 transition-opacity duration-150 z-[20] isolate ${showInfo ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"}`}>
          <button
            aria-label={`Learn more about ${title}`}
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 m-0 bg-transparent text-muted-foreground border-none md:border md:border-solid border-border hover:text-foreground hover:bg-accent transition-colors duration-150 flex items-center justify-center outline-none focus-visible:ring cursor-pointer"
          >
            <InfoIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3">
      <h3 className="m-0 font-mono font-normal text-sm text-muted-foreground uppercase">
        {label}
      </h3>
      <div className="text-foreground text-sm font-mono tabular-nums">
        {formatNumber(value)}
      </div>
    </li>
  );
}

export function TotalRequests({ stats }: { stats: PlatformStats }) {
  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-muted-foreground">
        Total Users
      </h2>
      <div className="text-4xl md:text-5xl tracking-normal font-mono tabular-nums">
        {formatNumber(stats.totalUsers)}
      </div>
    </div>
  );
}

function LocationRow({ location, count }: { location: string; count: number }) {
  return (
    <li className="flex items-center w-full md:w-fit justify-between md:justify-start">
      <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
        <span className="text-primary" style={{ opacity: 1 }}>■</span>
      </span>
      <div className="text-left">
        <h3 className="inline-block my-0 font-medium text-[16px] text-primary">
          &nbsp;{location}
        </h3>
      </div>
      <div className="w-[16ch] text-right">
        <span className="inline-flex tabular-nums">{formatNumber(count)}</span>
      </div>
    </li>
  );
}

export function TopCountries({ stats }: { stats: PlatformStats }) {
  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-muted-foreground">
        Top Locations by Sessions
      </h2>
      <ul className="list-none pl-0 space-y-1">
        {stats.topCountries.length > 0 ? (
          stats.topCountries.map((entry) => (
            <LocationRow
              key={entry.location}
              location={entry.location}
              count={entry.count}
            />
          ))
        ) : (
          <li className="text-sm text-muted-foreground font-mono">No location data yet</li>
        )}
      </ul>
    </div>
  );
}

export function RegionCount({ stats }: { stats: PlatformStats }) {
  return (
    <div className="flex items-center w-full md:w-fit justify-between md:justify-start mt-2">
      <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
        <span className="text-[10px]">▲</span>
      </span>
      <div className="text-left">
        <span className="inline-block my-0 font-medium text-[16px]">&nbsp;{stats.regions || 0}</span>
        <span className="font-medium text-[16px] text-muted-foreground tracking-tight">&nbsp;Active Regions</span>
      </div>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: PlatformStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="flex flex-col gap-3">
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          infoContent="The number of currently active user sessions across all platforms and devices."
          className="flex-1"
        />
        <StatCard
          title="AI Models"
          infoContent="AI models available in the Oxy ecosystem for intelligent task processing."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-2">
            <MetricRow label="Models" value={stats.aiModels} />
          </ul>
        </StatCard>
      </div>

      <div className="flex flex-col gap-3">
        <StatCard
          title="Messages"
          value={stats.totalMessages}
          infoContent="Total email messages processed by the Oxy platform, including sent, received, and synced messages."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-4">
            <MetricRow label="Notifications" value={stats.totalNotifications} />
            <MetricRow label="Files stored" value={stats.totalFiles} />
            <MetricRow label="Follows" value={stats.totalFollows} />
          </ul>
        </StatCard>
      </div>

      <div className="flex flex-col gap-3">
        <StatCard
          title="Platform Activity"
          infoContent="Transactions and developer integrations across the Oxy platform."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-2">
            <MetricRow label="Transactions" value={stats.totalTransactions} />
            <MetricRow label="Developer Apps" value={stats.totalDeveloperApps} />
          </ul>
        </StatCard>
        <StatCard
          title="File Storage"
          value={stats.totalFiles}
          infoContent="Total files uploaded and managed across the Oxy platform including avatars, attachments, and media."
          className="flex-1"
        >
          <p className="text-muted-foreground text-sm font-mono mt-1">Files stored</p>
        </StatCard>
      </div>
    </div>
  );
}
