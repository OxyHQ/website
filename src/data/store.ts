import type { MercariaImage, MercariaPurchaseOption, MercariaProductAvailability } from '@mercaria.co/sdk'

/** Fictional merchandise for the store preview. No inventory or checkout API. */
export type StoreCategory = 'wear' | 'carry' | 'desk' | 'drink'
export interface StoreProduct {
  id: string
  name: string
  category: StoreCategory | 'all'
  price: number
  image: string
  currency?: string
  mercaria?: { availability: MercariaProductAvailability; description?: string; images?: MercariaImage[]; options?: MercariaPurchaseOption[]; url: string }
  units: number
}
const goods = [
  { id: 'everyday-tee', name: 'Oxy Everyday Tee', category: 'wear', price: 35, image: 'tee' },
  { id: 'canvas-tote', name: 'Oxy Canvas Tote', category: 'carry', price: 28, image: 'tote' },
  { id: 'studio-mug', name: 'Oxy Studio Mug', category: 'drink', price: 22, image: 'mug' },
  { id: 'ideas-notebook', name: 'Oxy Ideas Notebook', category: 'desk', price: 18, image: 'notebook' },
  { id: 'everyday-bottle', name: 'Oxy Everyday Bottle', category: 'drink', price: 32, image: 'bottle' },
  { id: 'studio-cap', name: 'Oxy Studio Cap', category: 'wear', price: 25, image: 'cap' },
] as const
export const STORE_PRODUCTS: StoreProduct[] = [
  ...goods.map((product) => ({ ...product, image: `/images/store/${product.image}.webp`, units: 1 })),
  ...goods.map((product) => ({ ...product, id: `${product.id}-pair`, image: `/images/store/${product.image}.webp`, units: 2, price: product.price * 2 })),
]
