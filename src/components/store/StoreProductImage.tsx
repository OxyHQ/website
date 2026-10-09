import type { StoreProduct } from '../../data/store'

export default function StoreProductImage({ product, eager = false, className = '' }: {
  product: StoreProduct
  eager?: boolean
  className?: string
}) {
  return <img src={product.image} alt={product.name} width={1024} height={1280} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`size-full object-cover ${className}`} />
}
