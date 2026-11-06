import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { categories, incidents, products } from '../db/schema/index.js';
import { populate } from '../db/refs.js';
import { appCatalogue } from './appStoreCatalogue.js';
import { applyAppListing, type AppListingIndex, reportUnlistedProducts } from './appListing.js';
import {
  applyFunctionalSignals,
  authoritativeProbeUrl,
  probeEndpoint,
  readFunctionalSignals,
  type ProbeResult,
  type PublicServiceStatus,
} from './functionalStatus.js';

export type ServiceStatus = PublicServiceStatus;

export interface ServiceResult {
  id: string;
  name: string;
  description: string;
  section: string;
  url: string;
  landingUrl: string | null;
  brand: string;
  brandForeground?: string;
  mark: string;
  logoUrl: string | null;
  status: ServiceStatus;
  latencyMs: number | null;
  httpStatus: number | null;
  lastChecked: string;
}

// Internal variant: adds the row id so the per-locale response
// builder can look up a Translation override for name/description without
// re-probing or re-querying the product collection. The `productDocId` field
// is stripped before the payload is written to the wire.
export interface CachedServiceResult extends ServiceResult {
  productDocId: string;
}

export interface CachedStatusPayload {
  generatedAt: string;
  overall: ServiceStatus;
  services: CachedServiceResult[];
}

const CACHE_TTL_MS = 60_000;

/** A product row with its category already populated, which is what a probe reads. */
type ProductRow = typeof products.$inferSelect & { category: unknown };

/**
 * The heading a group of services is shown under.
 *
 * `section` holds a category SLUG — that is what /admin writes and what it
 * resolves against the category list — so rendering it raw put a lowercase
 * `apps` on the page. The category's own label is the human string; the slug
 * stands in only for a product that has no category.
 */
function resolveSectionLabel(product: ProductRow): string {
  const category = product.category as { label?: string } | null;
  return category?.label || product.section || 'Other';
}

let cached: CachedStatusPayload | null = null;
let cachedAt = 0;
let inFlight: Promise<CachedStatusPayload> | null = null;

async function probeService(
  product: ProductRow,
  listings: AppListingIndex,
): Promise<CachedServiceResult> {
  const target = authoritativeProbeUrl(product.productId);
  // The name, tagline and icon come from the app store listing, not the row.
  const listed = applyAppListing(product, listings);
  const base: Omit<CachedServiceResult, 'status' | 'latencyMs' | 'httpStatus' | 'lastChecked'> = {
    id: product.productId,
    productDocId: product._id,
    name: listed.name,
    description: listed.tagline || product.description || '',
    section: resolveSectionLabel(product),
    url: product.href,
    landingUrl: product.landingUrl || null,
    brand: product.brand,
    brandForeground: product.brandForeground,
    mark: product.mark,
    logoUrl: listed.appIconUrl,
  };
  const probe: ProbeResult =
    target === null
      ? { status: 'unknown', latencyMs: null, httpStatus: null }
      : await probeEndpoint(target);
  return { ...base, ...probe, lastChecked: new Date().toISOString() };
}

function worse(a: ServiceStatus, b: ServiceStatus): ServiceStatus {
  const rank: Record<ServiceStatus, number> = { operational: 0, unknown: 1, degraded: 2, down: 3 };
  return rank[b] > rank[a] ? b : a;
}

/**
 * An open major/critical incident can mean real user-facing trouble even when
 * every live probe reads clean (a partial/quality issue, not a hard outage) —
 * so the banner also reflects any unresolved incident, not just probe results.
 */
async function openIncidentSeverity(): Promise<ServiceStatus> {
  const rows = await db
    .select({ severity: incidents.severity })
    .from(incidents)
    .where(
      and(
        isNull(incidents.resolvedAt),
        or(eq(incidents.severity, 'major'), eq(incidents.severity, 'critical')),
      ),
    );
  if (rows.some((r) => r.severity === 'critical')) return 'down';
  if (rows.some((r) => r.severity === 'major')) return 'degraded';
  return 'operational';
}

async function computeOverall(services: CachedServiceResult[]): Promise<ServiceStatus> {
  const fromProbes: ServiceStatus =
    services.length === 0
      ? 'unknown'
      : services.some((s) => s.status === 'down')
        ? 'down'
        : services.some((s) => s.status === 'degraded')
          ? 'degraded'
          : services.every((s) => s.status === 'operational')
            ? 'operational'
            : 'unknown';
  const fromIncidents = await openIncidentSeverity();
  return worse(fromProbes, fromIncidents);
}

async function buildPayload(): Promise<CachedStatusPayload> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.showOnStatus, true))
    .orderBy(asc(products.section), asc(products.order), asc(products._id));
  const probed = (await populate(rows, { category: categories })) as unknown as ProductRow[];
  const listings = await appCatalogue.get();
  reportUnlistedProducts(
    probed.map((product) => product.productId),
    listings,
  );
  const services = applyFunctionalSignals(
    await Promise.all(probed.map((product) => probeService(product, listings))),
    await readFunctionalSignals(),
  );
  return {
    generatedAt: new Date().toISOString(),
    overall: await computeOverall(services),
    services,
  };
}

export async function getStatus(): Promise<CachedStatusPayload> {
  const fresh = cached && Date.now() - cachedAt < CACHE_TTL_MS;
  if (fresh && cached) return cached;
  if (inFlight) return inFlight;
  inFlight = buildPayload()
    .then((payload) => {
      cached = payload;
      cachedAt = Date.now();
      return payload;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
