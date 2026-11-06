/**
 * The app store's listing for each app, joined onto the CMS `products` rows.
 *
 * The name, tagline and icon of an app belong to the Oxy app store (Atlas,
 * read through `oxy.store`). A `products` row keeps only the app's id — its
 * `productId`, which is the listing's slug — and its presentation fields. This
 * module is the pure merge: no I/O, so the rules are testable on their own.
 */

/** What the website shows for one app, from its store listing. */
export interface AppListing {
  slug: string;
  name: string;
  tagline: string | null;
  /** The icon's public URL, or `null` when the listing has no icon. */
  iconUrl: string | null;
}

/** Listings keyed by slug (the CMS `productId`). */
export type AppListingIndex = ReadonlyMap<string, AppListing>;

export const EMPTY_APP_LISTINGS: AppListingIndex = new Map();

/** The fields the store owns, added to every product the API returns. */
export interface AppListingFields {
  /** `false` when the store has no published listing for this app. */
  appListed: boolean;
  /** The store's icon, or `null`. A `null` renders as a neutral placeholder. */
  appIconUrl: string | null;
}

interface ProductFields {
  productId: string;
  name: string;
  tagline: string;
}

/**
 * Overlay the store's name, tagline and icon onto a product.
 *
 * An app the store does not list keeps the row's own name so the page still
 * reads, has no icon, and is marked `appListed: false` so it can be reported.
 * A listing without a tagline keeps the row's tagline.
 */
export function applyAppListing<T extends ProductFields>(
  row: T,
  index: AppListingIndex,
): T & AppListingFields {
  const listing = index.get(row.productId);
  if (!listing) return { ...row, appListed: false, appIconUrl: null };
  return {
    ...row,
    name: listing.name,
    tagline: listing.tagline ?? row.tagline,
    appListed: true,
    appIconUrl: listing.iconUrl,
  };
}

const reportedUnlisted = new Set<string>();

/**
 * Log, once per process, each product the store does not list. A product with
 * no listing renders with a placeholder, which looks like a bug on the page, so
 * the operator needs a line that names it.
 */
export function reportUnlistedProducts(
  productIds: readonly string[],
  index: AppListingIndex,
  log: (message: string) => void = console.warn,
): void {
  for (const productId of productIds) {
    if (index.has(productId) || reportedUnlisted.has(productId)) continue;
    reportedUnlisted.add(productId);
    log(`[appListing] no Oxy store listing for product "${productId}"; rendering placeholder`);
  }
}

/** Test seam: forget which products were already reported. */
export function resetUnlistedReports(): void {
  reportedUnlisted.clear();
}
