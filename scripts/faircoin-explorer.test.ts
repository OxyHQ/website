import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import {
  explorerPriceSchema,
  fetchExplorerPrice,
  fetchExplorerStats,
} from '../src/api/faircoin-explorer';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
function reply(body: unknown, status = 200) {
  return spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  );
}
describe('public FairCoin Explorer market data', () => {
  test('preserves a zero quote and a zero 24-hour change', async () => {
    reply({ price: 0, change24h: 0 });
    expect(await fetchExplorerPrice()).toMatchObject({ price: 0, change24h: 0 });
  });
  test('keeps unavailable data null rather than manufacturing a price', async () => {
    reply({ price: null, source: null });
    expect(await fetchExplorerPrice()).toMatchObject({
      price: null,
      change24h: null,
      updatedAt: null,
    });
  });
  test('accepts negative changes but rejects negative or malformed prices', () => {
    expect(explorerPriceSchema.parse({ price: 0.49, change24h: -1.5 }).change24h).toBe(-1.5);
    for (const price of [-1, '0.49', Infinity, NaN, undefined]) {
      expect(explorerPriceSchema.safeParse({ price }).success).toBe(false);
    }
    expect(explorerPriceSchema.safeParse({ price: 1, updatedAt: 'not a date' }).success).toBe(
      false,
    );
  });
  test('rejects HTTP failure so a cached good quote can be retained', async () => {
    reply({ price: 0 }, 503);
    await expect(fetchExplorerPrice()).rejects.toThrow('503');
  });
  test('forwards cancellation to the market request', async () => {
    const request = reply({ price: 1 });
    const controller = new AbortController();
    await fetchExplorerPrice(controller.signal);
    const signal = request.mock.calls[0]?.[1]?.signal;
    controller.abort();
    expect(signal?.aborted).toBe(true);
  });
  test('uses mainnet and normalizes the explorer block time', async () => {
    const request = reply({
      stats: { blockHeight: 206160, circulatingSupply: 7061600, avgBlockTime: 120, phase: 'PoS' },
    });
    expect(await fetchExplorerStats()).toMatchObject({
      blockHeight: 206160,
      circulatingSupply: 7061600,
      avgBlockTimeSeconds: 120,
      phase: 'PoS',
    });
    expect(String(request.mock.calls[0]?.[0])).toEndWith('/api/stats?network=mainnet');
  });
  test('rejects partial snapshots instead of displaying zero supply or block', async () => {
    for (const body of [
      {},
      { stats: {} },
      { stats: { blockHeight: 100 } },
      { stats: { blockHeight: 0, circulatingSupply: 1 } },
    ]) {
      reply(body);
      await expect(fetchExplorerStats()).rejects.toThrow('incomplete network snapshot');
      globalThis.fetch = originalFetch;
    }
  });
});
