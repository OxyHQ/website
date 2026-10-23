import { useQuery } from '@tanstack/react-query';
import {
  FAIRCOIN_EXPLORER_URL,
  fetchExplorerPrice,
  fetchExplorerStats,
} from '../../../api/faircoin-explorer';
import { fc } from '../../../lib/faircoin-links';
import { Link } from '../../../lib/navigation';

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 6,
});

/** Public explorer data; never replace an unavailable quote with zero. */
export default function ExplorerStats({
  ctaHref = fc('/wallet/'),
  ctaLabel = 'Get started',
}: {
  ctaHref?: string;
  ctaLabel?: string;
} = {}) {
  const price = useQuery({
    queryKey: ['faircoin-explorer-price'],
    queryFn: ({ signal }) => fetchExplorerPrice(signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const network = useQuery({
    queryKey: ['faircoin-network-stats'],
    queryFn: fetchExplorerStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const quote = price.data;
  const stats = network.data;
  const change = quote?.price != null ? quote.change24h : null;
  const tiles = [
    {
      label: 'FAIR price · USD',
      value: quote?.price != null ? usd.format(quote.price) : price.isPending ? '…' : 'Unavailable',
      detail:
        price.isError && quote?.price != null
          ? 'Last available quote'
          : change != null
            ? `${change > 0 ? '+' : ''}${change.toFixed(2)}% · 24h`
            : 'WFAIR market price',
      href: FAIRCOIN_EXPLORER_URL,
      title: undefined,
    },
    {
      label: 'FAIR in circulation',
      value: stats
        ? compact.format(stats.circulatingSupply)
        : network.isPending
          ? '…'
          : 'Unavailable',
      detail: network.isError && stats ? 'Last available snapshot' : 'Native FairCoin supply',
      href: `${FAIRCOIN_EXPLORER_URL}/stats`,
      title: stats ? `${integer.format(stats.circulatingSupply)} FAIR` : undefined,
    },
    {
      label: 'Latest block',
      value: stats ? integer.format(stats.blockHeight) : network.isPending ? '…' : 'Unavailable',
      detail: network.isError && stats ? 'Last available snapshot' : 'FairCoin mainnet',
      href: `${FAIRCOIN_EXPLORER_URL}/stats`,
      title: undefined,
    },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {tiles.map((tile) => (
          <a
            key={tile.label}
            href={tile.href}
            title={tile.title}
            className="flex aspect-square flex-col justify-between rounded-[16%] border border-border p-[9%] [container-type:inline-size] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <div>
              <p className="break-words text-[clamp(22px,17cqw,48px)] leading-tight tracking-[-.04em] tabular-nums">
                {tile.value}
              </p>
              <p className="mt-3 text-[clamp(10px,5cqw,14px)] leading-snug text-muted-foreground">
                {tile.detail}
              </p>
            </div>
            <p className="mt-4 text-[clamp(14px,6cqw,18px)] leading-snug tracking-[-.025em]">
              {tile.label}
            </p>
          </a>
        ))}
        <Link
          to={ctaHref}
          className="faircoin-editorial-green flex aspect-square flex-col justify-between rounded-[16%] bg-ring p-[9%] text-primary-foreground [container-type:inline-size] transition-transform hover:scale-[.98] motion-reduce:transform-none"
        >
          <span className="text-[clamp(22px,17cqw,40px)] leading-tight tracking-[-.03em]">
            {ctaLabel}
          </span>
          <span aria-hidden="true" className="text-6xl leading-none">
            →
          </span>
        </Link>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        <a href={FAIRCOIN_EXPLORER_URL} className="underline underline-offset-4">
          FairCoin Explorer
        </a>
        {' · Market price from WFAIR on Base.'}
        {quote?.updatedAt && quote.price != null && (
          <>
            {' '}
            {price.isError ? 'Last quote' : 'Quote updated'}{' '}
            <time dateTime={quote.updatedAt}>
              {new Date(quote.updatedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'short',
              })}
            </time>
            .
          </>
        )}
      </p>
    </>
  );
}
