import { describe, expect, test } from 'bun:test'
import { createMercariaClient, MercariaResponseError } from '@mercaria.co/sdk'
import { formatStorePrice, readMercariaCatalog, readMercariaProduct, readMercariaCollection, toStoreProduct } from '../src/lib/mercaria-store'
import { OXY_STORE_ID } from '../src/data/store-config'
import { storeFixture, collectionFixture, productFixture } from './mercaria-store.fixtures'

function client(handler: (url: URL) => unknown | Response) {
  return createMercariaClient({ fetch: async input => {
    const body = handler(new URL(input))
    return body instanceof Response ? body : Response.json(body)
  } })
}
const product = productFixture()

describe('Mercaria storefront boundary', () => {
  test('reads every page through the published SDK, preserving native price and identity', async () => {
    const paths: string[] = []
    const sdk = client(url => {
      paths.push(url.pathname)
      if (url.pathname.endsWith('/collections')) return { items: [collectionFixture], nextCursor: null }
      if (url.pathname.endsWith('/products')) return url.searchParams.has('cursor')
        ? { items: [productFixture('tote')], nextCursor: null }
        : { items: [product], nextCursor: 'next' }
      return storeFixture
    })
    const result = await readMercariaCatalog(sdk, OXY_STORE_ID)
    expect(result.products.map(item => item.id)).toEqual(['tee', 'tote'])
    expect(result.products[0].price).toBe(29.99)
    expect(result.collections[0].title).toBe('Wear')
    expect(paths.every(path => path.startsWith('/public/v1/'))).toBe(true)
  })
  test('empty store stays empty; failures are never replaced with mock products', async () => {
    const empty = client(url => url.pathname.endsWith(OXY_STORE_ID) ? storeFixture : { items: [], nextCursor: null })
    expect((await readMercariaCatalog(empty, OXY_STORE_ID)).products).toEqual([])
    await expect(readMercariaCatalog(client(() => new Response('', { status: 503 })), OXY_STORE_ID)).rejects.toThrow()
  })
  test('refuses another owning account and another seller, including direct product URLs', async () => {
    await expect(readMercariaCatalog(client(() => ({ ...storeFixture, oxyAccountId: 'someone-else' })), OXY_STORE_ID)).rejects.toThrow('owner')
    const foreign = { ...product, seller: { ...product.seller, store: { kind: 'store', id: 'foreign' } } }
    await expect(readMercariaProduct(client(url => url.pathname.endsWith(OXY_STORE_ID) ? storeFixture : foreign), OXY_STORE_ID, 'tee')).rejects.toThrow('belong')
    await expect(readMercariaCatalog(client(url => url.pathname.endsWith(OXY_STORE_ID) ? storeFixture : url.pathname.endsWith('/collections') ? { items: [], nextCursor: null } : { items: [foreign], nextCursor: null }), OXY_STORE_ID)).rejects.toThrow('seller')
  })
  test('rejects malformed API data and repeated cursor cycles', async () => {
    await expect(readMercariaProduct(client(url => url.pathname.endsWith(OXY_STORE_ID) ? storeFixture : { ...product, price: { amount: 'free', currency: 'EUR' } }), OXY_STORE_ID, 'tee')).rejects.toBeInstanceOf(MercariaResponseError)
    await expect(readMercariaCatalog(client(url => url.pathname.endsWith(OXY_STORE_ID) ? storeFixture : { items: [], nextCursor: url.searchParams.get('cursor') === 'a' ? 'b' : 'a' }), OXY_STORE_ID)).rejects.toThrow('cursor')
  })
  test('collection reads remain scoped and abort signals propagate', async () => {
    const sdk = client(() => ({ items: [product], nextCursor: null }))
    const catalog = await readMercariaCatalog(client(url => url.pathname.endsWith(OXY_STORE_ID) ? storeFixture : url.pathname.endsWith('/collections') ? { items: [collectionFixture], nextCursor: null } : { items: [], nextCursor: null }), OXY_STORE_ID)
    expect((await readMercariaCollection(sdk, OXY_STORE_ID, catalog.collections[0]))[0].id).toBe('tee')
    const controller = new AbortController(); controller.abort()
    await expect(readMercariaProduct(sdk, OXY_STORE_ID, 'tee', controller.signal)).rejects.toThrow('aborted')
  })
  test('formats zero, two and eight decimal currencies without rounding cents away', async () => {
    const get = async (currency: string, amount: number) => toStoreProduct(await client(() => ({ ...product, price: { currency, amount } })).products.get('tee'))
    expect((await get('JPY', 3200)).price).toBe(3200)
    expect((await get('EUR', 2999)).price).toBe(29.99)
    expect((await get('FAIR', 123456789)).price).toBe(1.23456789)
    expect(formatStorePrice(29.99, 'EUR', 'en')).toContain('29.99')
    expect(formatStorePrice(1.23456789, 'FAIR', 'en')).toBe('1.23456789 FAIR')
  })
})
