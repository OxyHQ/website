import { useQuery } from '@tanstack/react-query'
import { STORE_PRODUCTS } from '../../data/store'
import { mercaria, mercariaStoreId, readMercariaCatalog, readMercariaCollection, readMercariaProduct } from '../../lib/mercaria-store'

export function useStoreCatalog() {
  const query = useQuery({
    queryKey: ['mercaria', 'store', mercariaStoreId],
    queryFn: ({ signal }) => readMercariaCatalog(mercaria, mercariaStoreId!, signal),
    enabled: !!mercariaStoreId,
    staleTime: 30_000,
    retry: false,
  })
  return { ...query, products: mercariaStoreId ? query.data?.products ?? [] : STORE_PRODUCTS, live: !!mercariaStoreId }
}

export function useStoreProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['mercaria', 'store', mercariaStoreId, 'product', id],
    queryFn: ({ signal }) => readMercariaProduct(mercaria, mercariaStoreId!, id!, signal),
    enabled: !!mercariaStoreId && !!id,
    staleTime: 30_000,
    retry: false,
  })
}

export function useStoreCollection(id: string) {
  const catalog = useStoreCatalog()
  const collection = catalog.data?.collections.find(item => item.ref.id === id)
  return useQuery({
    queryKey: ['mercaria', 'store', mercariaStoreId, 'collection', id],
    queryFn: ({ signal }) => readMercariaCollection(mercaria, mercariaStoreId!, collection!, signal),
    enabled: !!mercariaStoreId && !!collection,
    staleTime: 30_000,
    retry: false,
  })
}
