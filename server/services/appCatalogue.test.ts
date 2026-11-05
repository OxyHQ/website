import { describe, expect, test } from 'bun:test';
import type { StoreListingSummary } from '@oxy.so/core';
import { AppCatalogue, type AppCatalogueSource, indexListings } from './appCatalogue.js';
import {
  applyAppListing,
  type AppListingIndex,
  EMPTY_APP_LISTINGS,
  reportUnlistedProducts,
  resetUnlistedReports,
} from './appListing.js';

/* The website's names, taglines and icons for an app come from the Oxy app
   store. These pin how a product row is merged with its listing, and what
   happens when the store has no listing or cannot be reached. */

function summary(slug: string, overrides: Partial<StoreListingSummary> = {}): StoreListingSummary {
  return {
    slug,
    name: `${slug} from store`,
    tagline: `${slug} tagline from store`,
    icon: `file-${slug}`,
    category: null,
    rating: { average: null, count: 0 },
    ...overrides,
  };
}

const iconUrl = (fileId: string) => `https://cloud.test/${fileId}`;

const row = {
  productId: 'mention',
  name: 'Mention (CMS)',
  tagline: 'CMS tagline',
  section: 'apps',
};

describe('applyAppListing', () => {
  test('a listed app takes its name, tagline and icon from the store', () => {
    const index = indexListings([summary('mention')], iconUrl);
    const merged = applyAppListing(row, index);
    expect(merged.name).toBe('mention from store');
    expect(merged.tagline).toBe('mention tagline from store');
    expect(merged.appListed).toBe(true);
    expect(merged.appIconUrl).toBe('https://cloud.test/file-mention');
    expect(merged.section).toBe('apps');
  });

  test('a listing without an icon or tagline falls back to the row for the tagline only', () => {
    const index = indexListings([summary('mention', { icon: null, tagline: null })], iconUrl);
    const merged = applyAppListing(row, index);
    expect(merged.tagline).toBe('CMS tagline');
    expect(merged.appIconUrl).toBeNull();
    expect(merged.appListed).toBe(true);
  });

  test('an app the store does not list keeps rendering: row name, no icon, marked unlisted', () => {
    const merged = applyAppListing(row, EMPTY_APP_LISTINGS);
    expect(merged.name).toBe('Mention (CMS)');
    expect(merged.appIconUrl).toBeNull();
    expect(merged.appListed).toBe(false);
  });

  test('a store listing keyed by another slug does not leak onto the row', () => {
    const index = indexListings([summary('inbox')], iconUrl);
    expect(applyAppListing({ ...row, productId: 'i' }, index).appListed).toBe(false);
  });
});

describe('reportUnlistedProducts', () => {
  test('names each unlisted product once, and says nothing for listed ones', () => {
    resetUnlistedReports();
    const lines: string[] = [];
    const log = (message: string) => lines.push(message);
    const index = indexListings([summary('mention')], iconUrl);
    reportUnlistedProducts(['mention', 'i'], index, log);
    reportUnlistedProducts(['i'], index, log);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('"i"');
  });
});

describe('AppCatalogue', () => {
  function source(listings: () => Promise<StoreListingSummary[]>): AppCatalogueSource {
    return { fetchListings: listings, iconUrl };
  }

  test('a first load that outlives the wait answers empty, then the store fills the index', async () => {
    let release!: (value: StoreListingSummary[]) => void;
    const catalogue = new AppCatalogue({
      source: source(() => new Promise((resolve) => (release = resolve))),
      firstLoadWaitMs: 5,
    });
    const early = await catalogue.get();
    expect(early.size).toBe(0);
    release([summary('mention')]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const later = await catalogue.get();
    expect(later.has('mention')).toBe(true);
  });

  test('a stale index is served at once while the refresh runs', async () => {
    let clock = 0;
    let calls = 0;
    const catalogue = new AppCatalogue({
      source: source(async () => {
        calls += 1;
        return calls === 1 ? [summary('mention')] : [summary('allo')];
      }),
      freshMs: 100,
      now: () => clock,
      firstLoadWaitMs: 1000,
    });
    expect((await catalogue.get()).has('mention')).toBe(true);
    clock = 500;
    const stale = await catalogue.get();
    expect(stale.has('mention')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect((await catalogue.get()).has('allo')).toBe(true);
    expect(calls).toBe(2);
  });

  test('a failed refresh keeps the last good index and does not reject', async () => {
    let clock = 0;
    let fail = false;
    const logged: unknown[] = [];
    const catalogue = new AppCatalogue({
      source: source(async () => {
        if (fail) throw new Error('oxy-api down');
        return [summary('mention')];
      }),
      freshMs: 100,
      now: () => clock,
      log: (_message, error) => logged.push(error),
      firstLoadWaitMs: 1000,
    });
    expect((await catalogue.get()).has('mention')).toBe(true);
    fail = true;
    clock = 500;
    expect((await catalogue.get()).has('mention')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect((await catalogue.get()).has('mention')).toBe(true);
    expect(logged).toHaveLength(1);
  });

  test('with no index and a failing store, the page still answers with no listings', async () => {
    const catalogue = new AppCatalogue({
      source: source(async () => {
        throw new Error('oxy-api down');
      }),
      log: () => undefined,
      firstLoadWaitMs: 1000,
    });
    const index: AppListingIndex = await catalogue.get();
    expect(index.size).toBe(0);
    expect(applyAppListing(row, index).appListed).toBe(false);
  });
});
