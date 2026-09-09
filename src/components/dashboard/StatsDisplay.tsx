import { useState } from "react";
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
  className,
}: {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  isActive: boolean;
  gridSize?: number;
  animationStepDuration?: number;
  className?: string;
}) {
  return (
    <div className={`relative h-full w-full max-w-full overflow-hidden ${className || ""}`}>
      {isActive ? secondContent : firstContent}
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
    <div className="h-full min-h-[120px] w-full bg-card p-5 md:p-7">
      <div className="space-y-2">
        <h2 className="my-0 pr-10 font-sans text-lg font-semibold tracking-tight text-muted-foreground">
          {title}
        </h2>
        {value !== undefined && (
          <div className="font-sans text-4xl font-semibold leading-none tracking-tight tabular-nums text-foreground md:text-5xl">
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const infoContentView = (
    <div className="flex h-full w-full flex-col gap-y-2 overflow-y-auto bg-card p-5 md:p-7">
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
    <div className={`group relative overflow-hidden rounded-[36px] shadow-sm ring-1 ring-border/30 ${className || ""}`}>
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
      className="grid size-28 shrink-0 place-items-center rounded-full"
      role="img"
      aria-label={`${boundedValue.toFixed(1)}% active users`}
      style={{ background: `conic-gradient(var(--primary) ${boundedValue}%, color-mix(in srgb, var(--border) 60%, transparent) 0)` }}
    >
      <div className="grid size-20 place-items-center rounded-full bg-card/90 text-sm font-semibold tabular-nums text-foreground">
        {boundedValue.toFixed(1)}%
      </div>
    </div>
  );
}

function CountryBars({ countries }: { countries: PlatformStats["topCountries"] }) {
  const visibleCountries = countries.slice(0, 6);
  const maximum = Math.max(...visibleCountries.map((country) => country.count), 1);
  return (
    <div className="mt-4 flex h-16 items-end gap-2" aria-label="Activity distribution across leading countries">
      {visibleCountries.map((country) => (
        <div
          key={country.location}
          className="min-h-1 flex-1 rounded-t-md bg-primary/70"
          style={{ height: `${Math.max(12, (country.count / maximum) * 100)}%` }}
          title={`${country.location}: ${formatNumber(country.count)}`}
        />
      ))}
    </div>
  );
}

function ActivityChart({ events }: { events: PlatformActivityEvent[] }) {
  const values = events.slice(-16).map((event) => event.requests);
  if (values.length < 2) {
    return <div className="mt-8 text-sm font-medium text-muted-foreground">Waiting for live activity…</div>;
  }
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 44 - (value / maximum) * 40;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,48 ${points} 100,48`;
  return (
    <svg className="mt-3 h-20 w-full overflow-visible" viewBox="0 0 100 48" preserveAspectRatio="none" role="img" aria-label="Recent anonymous request activity">
      <defs>
        <linearGradient id="activity-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#activity-area)" />
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

export function StatsGrid({ stats, events }: { stats: PlatformStats; events: PlatformActivityEvent[] }) {
  const leadingCountry = stats.topCountries[0]?.location ?? "Awaiting data";
  const activeRate = stats.totalUsers > 0 ? (stats.activeSessions / stats.totalUsers) * 100 : 0;
  const communicationTotal = stats.totalMessages + stats.totalNotifications;
  const messageShare = communicationTotal > 0 ? (stats.totalMessages / communicationTotal) * 100 : 0;
  const contentTotal = stats.totalFiles + stats.totalMessages + stats.totalFollows;
  const fileShare = contentTotal > 0 ? (stats.totalFiles / contentTotal) * 100 : 0;
  const recentRequests = events.reduce((total, event) => total + event.requests, 0);
  return (
    <div className="mx-auto max-w-[1000px] space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-[4fr_4fr_6fr]">
        <StatCard title="Total Users" value={stats.totalUsers} infoContent="Registered users across the Oxy ecosystem.">
          <div className="mt-4 space-y-3">
            <MetricTextRow label="Active now" value={formatNumber(stats.activeSessions)} />
            <ProgressBar value={activeRate} label="Active users as a share of registered users" />
            <MetricTextRow label="Community connections" value={formatNumber(stats.totalFollows)} />
          </div>
        </StatCard>
        <StatCard title="Content Value" value={contentTotal} infoContent="Files, messages and community connections represented in the platform totals.">
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span>Files {fileShare.toFixed(1)}%</span>
              <span>Social {(100 - fileShare).toFixed(1)}%</span>
            </div>
            <ProgressBar value={fileShare} label="Files compared with messages and community connections" />
            <MetricTextRow label="Files / user" value={ratio(stats.totalFiles, stats.totalUsers)} />
          </div>
        </StatCard>
        <StatCard title="Live Request Activity" value={recentRequests} infoContent="Anonymous request buckets received over the live socket connection.">
          <ActivityChart events={events} />
        </StatCard>

        <StatCard title="Developer Platform" value={stats.totalDeveloperApps} infoContent="Developer applications, transactions and AI models currently available.">
          <div className="mt-4 space-y-3">
            <MetricRow label="Transactions" value={stats.totalTransactions} />
            <MetricRow label="AI models" value={stats.aiModels} />
            <MetricTextRow label="Apps / 1K users" value={ratio(stats.totalDeveloperApps * 1_000, stats.totalUsers)} />
          </div>
        </StatCard>
        <StatCard title="Communication Mix" infoContent="Messages and notifications processed across Oxy communication products.">
          <div className="mt-4 flex items-center gap-5">
            <Donut value={messageShare} />
            <div className="min-w-0 flex-1 space-y-3">
              <MetricRow label="Messages" value={stats.totalMessages} />
              <MetricRow label="Notifications" value={stats.totalNotifications} />
            </div>
          </div>
        </StatCard>
        <StatCard title="Geographic Activity" value={stats.topCountries.length} infoContent="Privacy-preserving aggregate activity across countries and infrastructure regions.">
          <div className="grid grid-cols-[1fr_auto] gap-5">
            <CountryBars countries={stats.topCountries} />
            <div className="mt-4 space-y-3 text-right">
              <MetricTextRow label="Leader" value={leadingCountry} />
              <MetricRow label="Regions" value={stats.regions} />
            </div>
          </div>
        </StatCard>
      </div>
      <p className="m-0 text-right font-mono text-xs text-muted-foreground">
        Updated {new Date(stats.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
    </div>
  );
}
