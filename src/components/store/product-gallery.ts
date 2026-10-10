import type { StoreProduct } from '../../data/store';

/** A one-photo catalogue still has the labelled detail view used by the store design. */
export function productGallery(product: StoreProduct) {
  const photos = product.mercaria?.images?.length
    ? product.mercaria.images.map((image) => ({
        src: image.url,
        alt: image.alt || product.name,
        detail: false,
      }))
    : [{ src: product.image, alt: product.name, detail: false }];

  return photos.length === 1 ? [...photos, { ...photos[0], detail: true }] : photos;
}
