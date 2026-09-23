import { formatNumber } from "../../lib/utils";
import type { PlatformActivityEvent, PlatformStats } from "../../api/hooks";
import { INFRA_NODES } from "../../data/dashboard/infra-nodes";
import { useTranslation } from "../../lib/i18n";

export function TotalRequests({ stats }: { stats: PlatformStats }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-muted-foreground">
        {t('dashboard.totalUsers')}
      </h2>
      <div className="text-4xl md:text-5xl tracking-normal font-mono tabular-nums">
        {formatNumber(stats.totalUsers)}
      </div>
    </div>
  );
}

export function LiveOrigins({ events }: { events: PlatformActivityEvent[] }) {
  const { t, locale } = useTranslation();
  const latestClientsByOrigin = new Map<string, { country: string; clients: number }>();
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event.sourceCountry || !event.sourceRegion || latestClientsByOrigin.has(event.sourceRegion)) continue;
    latestClientsByOrigin.set(event.sourceRegion, {
      country: event.sourceCountry,
      clients: event.activeClients ?? 0,
    });
  }
  const connectionsByCountry = new Map<string, number>();
  for (const { country, clients } of latestClientsByOrigin.values()) {
    connectionsByCountry.set(country, (connectionsByCountry.get(country) ?? 0) + clients);
  }
  const countries = [...connectionsByCountry.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const displayNames = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames([locale], { type: 'region' })
    : null;

  return (
    <div className="hidden text-right min-[961px]:block">
      <h2 className="mb-2 font-mono text-sm font-medium uppercase tracking-tight text-muted-foreground">{t('dashboard.networkOrigins')}</h2>
      {countries.length > 0 ? countries.map(([country, connections]) => (
        <div key={country} className="flex justify-end gap-4 font-mono text-sm">
          <span className="text-primary">{displayNames?.of(country) ?? country}</span>
          <span className="w-[7ch] tabular-nums text-foreground">{formatNumber(connections)}</span>
        </div>
      )) : <p className="font-mono text-xs text-muted-foreground">{t('dashboard.waitingOrigins')}</p>}
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
  const { t } = useTranslation();
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
        {t('dashboard.infrastructureActivity')}
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
          <li className="text-sm text-muted-foreground font-mono">{t('dashboard.waitingActivity')}</li>
        )}
      </ul>
    </div>
  );
}

export function RegionCount({ stats }: { stats: PlatformStats }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center w-full md:w-fit justify-between md:justify-start mt-2">
      <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
        <span className="text-[10px]">▲</span>
      </span>
      <div className="text-left">
        <span className="inline-block my-0 font-medium text-[16px]">&nbsp;{stats.regions || 0}</span>
        <span className="font-medium text-[16px] text-muted-foreground tracking-tight">&nbsp;{t('dashboard.activeRegions')}</span>
      </div>
    </div>
  );
}
