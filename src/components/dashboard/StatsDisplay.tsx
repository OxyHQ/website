import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "../../lib/utils";
import type { InfraStatusNode } from "../../api/hooks";

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

export function RegionCount({ nodes }: { nodes?: InfraStatusNode[] }) {
  const activeRegions = nodes?.filter((node) => node.status !== 'offline').length;
  return (
    <div className="flex items-center w-full md:w-fit justify-between md:justify-start mt-2">
      <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
        <span className="text-[10px]">▲</span>
      </span>
      <div className="text-left">
        <span className="inline-block my-0 font-medium text-[16px]">&nbsp;{activeRegions ?? '—'}</span>
        <span className="font-medium text-[16px] text-muted-foreground tracking-tight">&nbsp;Active Regions</span>
      </div>
    </div>
  );
}

export function StatsGrid({ nodes }: { nodes?: InfraStatusNode[] }) {
  const totals = nodes?.reduce(
    (result, node) => ({
      services: result.services + node.droplets + node.apps + node.dbs,
      compute: result.compute + node.droplets,
      apps: result.apps + node.apps,
      databases: result.databases + node.dbs,
    }),
    { services: 0, compute: 0, apps: 0, databases: 0 },
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="flex flex-col gap-3">
        <StatCard
          title="Active Regions"
          value={nodes?.filter((node) => node.status !== 'offline').length}
          infoContent="Oxy infrastructure regions currently reporting online or degraded service."
          className="flex-1"
        />
        <StatCard
          title="Services"
          infoContent="Total compute, application and database services running across Oxy regions."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-2">
            <MetricRow label="Total" value={totals?.services ?? 0} />
          </ul>
        </StatCard>
      </div>

      <div className="flex flex-col gap-3">
        <StatCard
          title="Compute"
          value={totals?.compute}
          infoContent="Compute instances serving the Oxy platform across all active regions."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-4">
            <MetricRow label="Regions" value={nodes?.length ?? 0} />
          </ul>
        </StatCard>
      </div>

      <div className="flex flex-col gap-3">
        <StatCard
          title="Managed Services"
          infoContent="Application and database services managed across the Oxy infrastructure."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-2">
            <MetricRow label="Applications" value={totals?.apps ?? 0} />
            <MetricRow label="Databases" value={totals?.databases ?? 0} />
          </ul>
        </StatCard>
        <StatCard
          title="System Health"
          value={nodes?.filter((node) => node.status === 'online').length}
          infoContent="Regions currently reporting healthy service."
          className="flex-1"
        >
          <p className="text-muted-foreground text-sm font-mono mt-1">Healthy regions</p>
        </StatCard>
      </div>
    </div>
  );
}
