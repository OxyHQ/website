import type { StoreListingSummary } from '@oxy.so/core';
import { type AppListing, type AppListingIndex, EMPTY_APP_LISTINGS } from './appListing.js';

/**
 * The app store's listings, kept in memory for the website.
 *
 * Every product card and the status header read names and icons from here, so
 * a request must not wait on oxy-api. Reads are stale-while-revalidate: a fresh
 * index is served as-is, a stale one is served at once while a refresh runs,
 * and a failed refresh keeps the last good index. Only the very first load can
 * wait, and only for `firstLoadWaitMs`; past that the request answers with no
 * listings (placeholders) and the load finishes in the background.
 */

const FRESH_MS = 5 * 60_000;
const FIRST_LOAD_WAIT_MS = 1_500;

export interface AppCatalogueSource {
  fetchListings(): Promise<StoreListingSummary[]>;
  iconUrl(fileId: string): string;
}

export interface AppCatalogueOptions {
  source: AppCatalogueSource;
  freshMs?: number;
  firstLoadWaitMs?: number;
  now?: () => number;
  log?: (message: string, error?: unknown) => void;
}

export function indexListings(
  listings: readonly StoreListingSummary[],
  iconUrl: (fileId: string) => string,
): AppListingIndex {
  const index = new Map<string, AppListing>();
  for (const listing of listings) {
    index.set(listing.slug, {
      slug: listing.slug,
      name: listing.name,
      tagline: listing.tagline,
      iconUrl: listing.icon ? iconUrl(listing.icon) : null,
    });
  }
  return index;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class AppCatalogue {
  private index: AppListingIndex | null = null;
  private refreshedAt = 0;
  private inFlight: Promise<AppListingIndex> | null = null;
  private readonly freshMs: number;
  private readonly firstLoadWaitMs: number;
  private readonly now: () => number;
  private readonly log: (message: string, error?: unknown) => void;

  constructor(private readonly options: AppCatalogueOptions) {
    this.freshMs = options.freshMs ?? FRESH_MS;
    this.firstLoadWaitMs = options.firstLoadWaitMs ?? FIRST_LOAD_WAIT_MS;
    this.now = options.now ?? Date.now;
    this.log = options.log ?? ((message, error) => console.warn(message, error ?? ''));
  }

  /** The current listings. Never rejects: a failure reads as the last good index. */
  async get(): Promise<AppListingIndex> {
    const stale = this.index === null || this.now() - this.refreshedAt >= this.freshMs;
    if (stale) void this.refresh();
    if (this.index) return this.index;
    return withTimeout(this.refresh(), this.firstLoadWaitMs, EMPTY_APP_LISTINGS);
  }

  private refresh(): Promise<AppListingIndex> {
    if (!this.inFlight) {
      this.inFlight = this.load().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async load(): Promise<AppListingIndex> {
    try {
      const listings = await this.options.source.fetchListings();
      this.index = indexListings(listings, (fileId) => this.options.source.iconUrl(fileId));
    } catch (error) {
      this.log('[appCatalogue] Oxy app store unavailable; keeping the last listings', error);
    }
    // Failures wait a full fresh interval before retrying, so an outage costs
    // one call per interval rather than one per request.
    this.refreshedAt = this.now();
    return this.index ?? EMPTY_APP_LISTINGS;
  }
}
