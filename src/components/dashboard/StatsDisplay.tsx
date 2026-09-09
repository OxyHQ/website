import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "../../lib/utils";
import type { PlatformActivityEvent, PlatformStats } from "../../api/hooks";
import { INFRA_NODES } from "../../data/dashboard/infra-nodes";

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

  // The per-pixel color is randomly assigned once and must stay stable across
  // re-renders. `Math.random()` is impure and can't run in the render body
  // (or a `useMemo`), so the grid — including its random colors — is built in
  // a lazy `useState` initializer that runs a single time on mount.
  const [pixels] = useState(() => {
    const total = gridSize * gridSize;
    const result: { id: number; row: number; col: number; color: string }[] = [];
    for (let n = 0; n < total; n++) {
      const row = Math.floor(n / gridSize);
      const col = n % gridSize;
      const color = Math.random() > 0.85 ? "var(--primary)" : "var(--border)";
      result.push({ id: n, row, col, color });
    }
    return result;
  });

  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  // React 19 callback ref — keyed on isActive / animationStepDuration / pixels.
  // Each transition tears down the prior shrink/hide timers and kicks off new
  // ones synchronously when the sentinel mounts. The transition is only
  // armed after the first activation (matches the original gating).
  const animationTriggerRef = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) return;
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
    },
    [isActive, animationStepDuration, pixels],
  );

  const delayPerPixel = useMemo(() => animationStepDuration / pixels.length, [animationStepDuration, pixels.length]);
  const orderMap = useMemo(() => {
    const map = new Map<number, number>();
    shuffledOrder.forEach((idx, order) => map.set(idx, order));
    return map;
  }, [shuffledOrder]);

  return (
    <div className={`w-full overflow-hidden max-w-full relative ${className || ""}`}>
      <span
        key={`${isActive ? "on" : "off"}-${pixels.length}`}
        ref={animationTriggerRef}
        aria-hidden
        hidden
      />
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
  value?: number | string;
  children?: React.ReactNode;
  infoContent?: string;
  href?: string;
  className?: string;
}) {
  const [showInfo, setShowInfo] = useState(false);

  const statsContent = (
    <div className="h-full min-h-[120px] w-full bg-primary/15 p-5 backdrop-blur-xl md:p-6">
      <div className="space-y-2">
        <h2 className="my-0 pr-8 font-sans text-base font-semibold tracking-tight text-muted-foreground">
          {title}
        </h2>
        {value !== undefined && (
          <div className="font-sans text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground md:text-4xl">
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const infoContentView = (
    <div className="flex h-full w-full flex-col gap-y-2 overflow-y-auto bg-primary/15 p-5 backdrop-blur-xl md:p-6">
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
    <div className={`group relative overflow-hidden rounded-[28px] shadow-sm ring-1 ring-border/30 ${className || ""}`}>
      <PixelGridTransition
        firstContent={statsContent}
        secondContent={infoContentView}
        isActive={showInfo}
        gridSize={30}
        animationStepDuration={0.3}
        className="h-full"
      />
      {infoContent && (
        <div className="absolute right-4 top-4 z-[20] isolate">
          <button
            aria-label={`Learn more about ${title}`}
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className={`m-0 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border/50 p-0 text-muted-foreground outline-none transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring ${showInfo ? "bg-accent" : "bg-surface/50"}`}
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
    <div className="flex flex-wrap items-center justify-between gap-x-3">
      <h3 className="m-0 font-sans text-sm font-medium text-muted-foreground">
        {label}
      </h3>
      <div className="font-sans text-sm font-medium tabular-nums text-foreground">
        {formatNumber(value)}
      </div>
    </div>
  );
}

function MetricTextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3">
      <h3 className="m-0 font-sans text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="font-sans text-sm font-medium tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function ratio(numerator: number, denominator: number, suffix = ""): string {
  if (denominator <= 0) return `0${suffix}`;
  return `${(numerator / denominator).toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1" role="img" aria-label={`${label}: ${boundedValue.toFixed(1)}%`}>
      <div className="h-2 overflow-hidden rounded-full bg-border/50">
        <div className="h-full rounded-full bg-primary" style={{ width: `${boundedValue}%` }} />
      </div>
    </div>
  );
}

function Donut({ value }: { value: number }) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className="grid size-20 shrink-0 place-items-center rounded-full"
      role="img"
      aria-label={`${boundedValue.toFixed(1)}% active users`}
      style={{ background: `conic-gradient(var(--primary) ${boundedValue}%, color-mix(in srgb, var(--border) 60%, transparent) 0)` }}
    >
      <div className="grid size-14 place-items-center rounded-full bg-card/90 text-xs tabular-nums text-foreground">
        {boundedValue.toFixed(1)}%
      </div>
    </div>
  );
}

function CountryBars({ countries }: { countries: PlatformStats["topCountries"] }) {
  const visibleCountries = countries.slice(0, 6);
  const maximum = Math.max(...visibleCountries.map((country) => country.count), 1);
  return (
    <div className="mt-2 flex h-10 items-end gap-1.5" aria-label="Activity distribution across leading countries">
      {visibleCountries.map((country) => (
        <div
          key={country.location}
          className="min-h-1 flex-1 rounded-t-sm bg-primary/70"
          style={{ height: `${Math.max(12, (country.count / maximum) * 100)}%` }}
          title={`${country.location}: ${formatNumber(country.count)}`}
        />
      ))}
    </div>
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

export function LiveActivity({ events }: { events: PlatformActivityEvent[] }) {
  const activityByRegion = new Map<string, number>();
  for (const event of events) {
    activityByRegion.set(event.region, (activityByRegion.get(event.region) ?? 0) + event.requests);
  }
  const regions = [...activityByRegion.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([region, count]) => ({
      location: INFRA_NODES.find((node) => node.region === region)?.label ?? region,
      count,
    }));

  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-muted-foreground">
        Live Processing Activity
      </h2>
      <ul className="list-none pl-0 space-y-1">
        {regions.length > 0 ? (
          regions.map((entry) => (
            <LocationRow
              key={entry.location}
              location={entry.location}
              count={entry.count}
            />
          ))
        ) : (
          <li className="text-sm text-muted-foreground font-mono">Waiting for an anonymous activity bucket…</li>
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
  const leadingCountry = stats.topCountries[0]?.location ?? "Awaiting data";
  const activeRate = stats.totalUsers > 0 ? (stats.activeSessions / stats.totalUsers) * 100 : 0;
  const communicationTotal = stats.totalMessages + stats.totalNotifications;
  const messageShare = communicationTotal > 0 ? (stats.totalMessages / communicationTotal) * 100 : 0;
  const contentTotal = stats.totalFiles + stats.totalMessages + stats.totalFollows;
  const fileShare = contentTotal > 0 ? (stats.totalFiles / contentTotal) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:auto-rows-[126px] lg:grid-cols-12">
        <StatCard title="Total Users" value={stats.totalUsers} infoContent="Registered users across the Oxy ecosystem." className="lg:col-span-3 lg:row-span-2">
          <div className="mt-5 flex items-center gap-4">
            <Donut value={activeRate} />
            <div className="min-w-0 flex-1 space-y-2">
              <MetricTextRow label="Active rate" value={ratio(stats.activeSessions * 100, stats.totalUsers, "%")} />
              <MetricTextRow label="Follows / 1K" value={ratio(stats.totalFollows * 1_000, stats.totalUsers)} />
            </div>
          </div>
        </StatCard>
        <StatCard title="Communication" value={stats.totalMessages} infoContent="Messages and notifications processed across Oxy communication products." className="lg:col-span-5">
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <MetricRow label="Notifications" value={stats.totalNotifications} />
            <MetricTextRow label="Messages / user" value={ratio(stats.totalMessages, stats.totalUsers)} />
          </div>
          <ProgressBar value={messageShare} label="Share of communication made up by messages" />
        </StatCard>
        <StatCard title="Active Sessions" value={stats.activeSessions} infoContent="User sessions currently active across Oxy products." className="lg:col-span-2">
          <MetricRow label="Active regions" value={stats.regions} />
        </StatCard>
        <StatCard title="AI Models" value={stats.aiModels} infoContent="AI models currently available through the platform." className="lg:col-span-2" />

        <StatCard title="File Storage" value={stats.totalFiles} infoContent="Files stored across avatars, attachments and product media." className="lg:col-span-5">
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <MetricTextRow label="Files / user" value={ratio(stats.totalFiles, stats.totalUsers)} />
            <MetricTextRow label="Content share" value={ratio(stats.totalFiles * 100, stats.totalFiles + stats.totalMessages + stats.totalFollows, "%")} />
          </div>
          <ProgressBar value={fileShare} label="File share of stored and social content" />
        </StatCard>
        <StatCard title="Community" value={stats.totalFollows} infoContent="Social graph connections created across the Oxy ecosystem." className="lg:col-span-2">
          <MetricTextRow label="Follows / user" value={ratio(stats.totalFollows, stats.totalUsers)} />
        </StatCard>
        <StatCard title="Transactions" value={stats.totalTransactions} infoContent="Recorded transactions across the developer platform." className="lg:col-span-2">
          <MetricTextRow label="Per app" value={ratio(stats.totalTransactions, stats.totalDeveloperApps)} />
        </StatCard>

        <StatCard title="Developer Apps" value={stats.totalDeveloperApps} infoContent="Active developer applications registered with Oxy." className="lg:col-span-3">
          <MetricTextRow label="Per 1K users" value={ratio(stats.totalDeveloperApps * 1_000, stats.totalUsers)} />
        </StatCard>
        <StatCard title="Active Regions" value={stats.regions} infoContent="Infrastructure regions currently reporting an online or degraded state." className="lg:col-span-3" />
        <StatCard title="Countries Tracked" value={stats.topCountries.length} infoContent="Countries present in the current privacy-preserving aggregate activity window." className="lg:col-span-3">
          <CountryBars countries={stats.topCountries} />
        </StatCard>
        <StatCard title="Leading Country" value={leadingCountry} infoContent="Top country in the current anonymous aggregate activity window." className="lg:col-span-3" />
      </div>
      <p className="m-0 text-right font-mono text-xs text-muted-foreground">
        Updated {new Date(stats.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
    </div>
  );
}
