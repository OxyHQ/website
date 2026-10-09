import {
  createMercariaClient,
  MercariaNotFoundError,
  MercariaResponseError,
  type MercariaClient,
  type MercariaCollection,
  type MercariaPage,
  type MercariaProduct,
  type MercariaProductSummary,
} from '@mercaria.co/sdk'
import { OXY_STORE_ID, OXY_STORE_OWNER_ACCOUNT_ID } from '../data/store-config'
import type { StoreProduct } from '../data/store'

/** Public store identity, never a merchant credential or a mutable handle. */
export const mercariaStoreId = import.meta.env?.DEV && import.meta.env?.VITE_STORE_PREVIEW === 'true' ? null : OXY_STORE_ID
export const mercaria = createMercariaClient()

export function belongsToStore(product: MercariaProductSummary, storeId: string) {
  return product.seller.kind === 'store' && product.seller.store.id === storeId
}

/** Fetch every page without silently truncating a shop or looping on a broken cursor. */
async function collect<T>(read: (cursor?: string) => Promise<MercariaPage<T>>) {
  const items: T[] = []
  const seen = new Set<string>()
  let cursor: string | undefined
  do {
    const page = await read(cursor)
    items.push(...page.items)
    if (page.nextCursor === null) return items
    if (seen.has(page.nextCursor)) throw new MercariaResponseError('Repeated store cursor')
    seen.add(page.nextCursor)
    cursor = page.nextCursor
  } while (cursor)
  return items
}

export async function readMercariaCatalog(client: MercariaClient, storeId: string, signal?: AbortSignal) {
  const store = await client.stores.get(storeId, { signal })
  if (store.ref.id !== storeId || store.oxyAccountId !== OXY_STORE_OWNER_ACCOUNT_ID) throw new MercariaResponseError('Unexpected store owner')
  const [products, collections] = await Promise.all([
    collect(cursor => client.stores.products(store.ref, { cursor, limit: 50, signal })),
    collect(cursor => client.stores.collections(store.ref, { cursor, limit: 50, signal })),
  ])
  if (products.some(product => !belongsToStore(product, storeId)) || collections.some(collection => collection.store.id !== storeId)) {
    throw new MercariaResponseError('Store response contains another seller')
  }
  return { store, products: products.map(toStoreProduct), collections }
}

export async function readMercariaCollection(client: MercariaClient, storeId: string, collection: MercariaCollection, signal?: AbortSignal) {
  if (collection.store.id !== storeId) throw new MercariaNotFoundError('Collection does not belong to this store')
  const products = await collect(cursor => client.collections.products(collection.ref, { cursor, limit: 50, signal }))
  if (products.some(product => !belongsToStore(product, storeId))) throw new MercariaResponseError('Collection contains another seller')
  return products.map(toStoreProduct)
}

export async function readMercariaProduct(client: MercariaClient, storeId: string, id: string, signal?: AbortSignal) {
  const [store, product] = await Promise.all([client.stores.get(storeId, { signal }), client.products.get(id, { signal })])
  if (store.ref.id !== storeId || store.oxyAccountId !== OXY_STORE_OWNER_ACCOUNT_ID) throw new MercariaResponseError('Unexpected store owner')
  if (!belongsToStore(product, storeId)) throw new MercariaNotFoundError('Product does not belong to this store')
  return toStoreProduct(product)
}

/** Intl knows fiat exponents; FAIR's published currency uses eight decimal places. */
export function currencyDecimals(currency: string) {
  return currency === 'FAIR' ? 8 : new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits!
}

export function formatStorePrice(amount: number, currency: string, locale: string) {
  if (currency === 'FAIR') return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(amount)} FAIR`
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function toStoreProduct(product: MercariaProductSummary | MercariaProduct): StoreProduct {
  const detail = 'purchaseOptions' in product ? product : undefined
  return {
    id: product.ref.id,
    name: product.title,
    // Live collections come from Mercaria, never inferred from names or mock categories.
    category: 'all',
    price: product.price.amount / 10 ** currencyDecimals(product.price.currency),
    currency: product.price.currency,
    image: product.primaryImage?.url || '/logo-mark.svg',
    units: 1,
    mercaria: {
      availability: product.availability,
      description: detail?.description,
      images: detail?.images,
      options: detail?.purchaseOptions,
      url: product.url,
    },
  }
}
