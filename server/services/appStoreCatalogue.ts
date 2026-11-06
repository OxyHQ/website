import type { StoreListingSummary } from '@oxy.so/core';
import { oxyService } from './oxyService.js';
import { oxyFileUrl } from './oxyFiles.js';
import { AppCatalogue } from './appCatalogue.js';

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** Every published listing, following the store's pagination. */
export async function fetchStoreListings(): Promise<StoreListingSummary[]> {
  const listings: StoreListingSummary[] = [];
  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const res = await oxyService.store.apps({ limit: PAGE_SIZE, offset });
    listings.push(...res.items);
    if (!res.hasMore || res.items.length === 0) break;
    offset += res.items.length;
  }
  return listings;
}

/** The process's catalogue, read from `oxy.store` through the website's Oxy client. */
export const appCatalogue = new AppCatalogue({
  source: {
    fetchListings: fetchStoreListings,
    iconUrl: (fileId) => oxyFileUrl(fileId),
  },
});
