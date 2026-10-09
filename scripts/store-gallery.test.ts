import { expect, test } from 'bun:test'
import { productGallery } from '../src/components/store/product-gallery'
import { STORE_PRODUCTS } from '../src/data/store'

test('a single Mercaria photograph includes the labelled detail crop', () => {
  const product = STORE_PRODUCTS[0]
  const photos = productGallery({ ...product, mercaria: { availability: 'out_of_stock', url: 'https://mercaria.co/products/test', images: [{ url: product.image, alt: 'Front of Oxy tee' }] } })
  expect(photos).toEqual([
    { src: product.image, alt: 'Front of Oxy tee', detail: false },
    { src: product.image, alt: 'Front of Oxy tee', detail: true },
  ])
})

test('multiple Mercaria photographs preserve their order without extra crops', () => {
  const images = [{ url: '/front.webp', alt: 'Front' }, { url: '/back.webp', alt: 'Back' }, { url: '/label.webp', alt: 'Label' }]
  const photos = productGallery({ ...STORE_PRODUCTS[0], mercaria: { availability: 'out_of_stock', url: 'https://mercaria.co/products/test', images } })
  expect(photos.map(photo => photo.src)).toEqual(images.map(image => image.url))
  expect(photos.every(photo => !photo.detail)).toBe(true)
})

test('empty galleries and development mocks retain their primary image and detail', () => {
  expect(productGallery(STORE_PRODUCTS[0]).map(photo => photo.detail)).toEqual([false, true])
  expect(productGallery({ ...STORE_PRODUCTS[0], mercaria: { availability: 'out_of_stock', url: 'https://mercaria.co/products/test', images: [] } })).toHaveLength(2)
})
