import { OXY_STORE_ID, OXY_STORE_OWNER_ACCOUNT_ID } from '../src/data/store-config'

export const storeFixture = {
  ref: { kind: 'store', id: OXY_STORE_ID }, oxyAccountId: OXY_STORE_OWNER_ACCOUNT_ID,
  handle: 'the-oxy-store', name: 'The Oxy Store', description: null, logoUrl: null,
  coverImageUrl: null, brandColor: '#000000', rating: null, reviewCount: 0,
  url: 'https://mercaria.co/stores/the-oxy-store',
}
export const collectionFixture = {
  ref: { kind: 'collection', id: 'wear' }, store: storeFixture.ref, title: 'Wear',
  description: null, image: null, url: 'https://mercaria.co/stores/the-oxy-store?collection=wear',
}
export function productFixture(id = 'tee', imageOrigin = 'https://oxy.so') {
  return {
    ref: { kind: 'product', id }, title: `Oxy ${id}`, primaryImage: { url: `${imageOrigin}/images/store/tee.webp`, alt: 'Oxy logo tee' },
    price: { amount: 2999, currency: 'EUR' }, compareAtPrice: null, priceRange: null,
    availability: 'in_stock', condition: { key: 'used_good', group: 'used' },
    seller: { kind: 'store', store: storeFixture.ref, handle: storeFixture.handle, name: storeFixture.name, logoUrl: null },
    url: `https://mercaria.co/products/${id}`, description: 'A tee with the official Oxy logo.',
    images: [{ url: `${imageOrigin}/images/store/tee.webp`, alt: 'Front' }, { url: `${imageOrigin}/images/store/tote.webp`, alt: 'Second photo' }],
    purchaseOptions: [
      { ref: { kind: 'variant', productId: id, variantId: 'small' }, title: 'Small', price: { amount: 2999, currency: 'EUR' }, compareAtPrice: null, availability: 'in_stock' },
      { ref: { kind: 'variant', productId: id, variantId: 'large' }, title: 'Large', price: { amount: 3550, currency: 'EUR' }, compareAtPrice: null, availability: 'out_of_stock' },
    ],
    updatedAt: '2026-10-09T00:00:00.000Z', viewer: null,
  }
}
