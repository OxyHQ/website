import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { authenticatedApiCall } from '@oxyhq/core'
import { useOxy } from '@oxyhq/services'

export const appDataQueryKeys = {
  all: ['appData'] as const,
  namespaces: () => [...appDataQueryKeys.all, 'namespace'] as const,
  namespace: (namespace: string) => [...appDataQueryKeys.namespaces(), namespace] as const,
  values: () => [...appDataQueryKeys.all, 'value'] as const,
  value: (namespace: string, key: string) =>
    [...appDataQueryKeys.values(), namespace, key] as const,
} as const

function isMissingAppDataEndpointError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const candidate = error as {
    status?: number
    statusCode?: number
    response?: { status?: number }
    code?: string
    message?: string
  }
  const status =
    candidate.status ?? candidate.statusCode ?? candidate.response?.status

  if (status === 404) return true

  if (candidate.code === 'NETWORK_ERROR') return true
  const message = typeof candidate.message === 'string' ? candidate.message : ''
  if (message.includes('Network Error') || message.includes('Failed to fetch')) {
    return true
  }
  return false
}

interface AppDataQueryOptions {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export const useAppData = <T = unknown>(
  namespace: string,
  key: string,
  options?: AppDataQueryOptions,
): UseQueryResult<T | null, Error> => {
  const { oxyServices, activeSessionId, isAuthenticated } = useOxy()

  return useQuery<T | null, Error>({
    queryKey: appDataQueryKeys.value(namespace, key),
    queryFn: async () => {
      try {
        return await authenticatedApiCall(oxyServices, activeSessionId, () =>
          oxyServices.getAppData<T>(namespace, key),
        )
      } catch (error) {
        if (isMissingAppDataEndpointError(error)) {
          return null
        }
        throw error
      }
    },
    enabled: (options?.enabled !== false) && isAuthenticated,
    staleTime: options?.staleTime ?? 60 * 1000,
    gcTime: options?.gcTime ?? 30 * 60 * 1000,
  })
}

export const useAppDataNamespace = <T = unknown>(
  namespace: string,
  options?: AppDataQueryOptions,
): UseQueryResult<Record<string, T>, Error> => {
  const { oxyServices, activeSessionId, isAuthenticated } = useOxy()

  return useQuery<Record<string, T>, Error>({
    queryKey: appDataQueryKeys.namespace(namespace),
    queryFn: async () => {
      try {
        return await authenticatedApiCall(oxyServices, activeSessionId, () =>
          oxyServices.listAppData<T>(namespace),
        )
      } catch (error) {
        if (isMissingAppDataEndpointError(error)) {
          return {}
        }
        throw error
      }
    },
    enabled: (options?.enabled !== false) && isAuthenticated,
    staleTime: options?.staleTime ?? 60 * 1000,
    gcTime: options?.gcTime ?? 30 * 60 * 1000,
  })
}

interface SetAppDataVariables<T> {
  namespace: string
  key: string
  value: T
}

interface SetAppDataContext<T> {
  previousValue: T | null | undefined
  previousNamespace: Record<string, T> | undefined
}

export const useSetAppData = <T = unknown>() => {
  const { oxyServices, activeSessionId } = useOxy()
  const queryClient = useQueryClient()

  return useMutation<T, Error, SetAppDataVariables<T>, SetAppDataContext<T>>({
    mutationKey: ['appData', 'set'],
    mutationFn: async ({ namespace, key, value }) => {
      return authenticatedApiCall(oxyServices, activeSessionId, () =>
        oxyServices.setAppData<T>(namespace, key, value),
      )
    },
    onMutate: async ({ namespace, key, value }) => {
      const valueKey = appDataQueryKeys.value(namespace, key)
      const namespaceKey = appDataQueryKeys.namespace(namespace)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: valueKey }),
        queryClient.cancelQueries({ queryKey: namespaceKey }),
      ])

      const previousValue = queryClient.getQueryData<T | null>(valueKey)
      const previousNamespace = queryClient.getQueryData<Record<string, T>>(namespaceKey)

      queryClient.setQueryData<T | null>(valueKey, value)
      if (previousNamespace) {
        queryClient.setQueryData<Record<string, T>>(namespaceKey, {
          ...previousNamespace,
          [key]: value,
        })
      }

      return { previousValue, previousNamespace }
    },
    onError: (_error, { namespace, key }, context) => {
      if (!context) return
      const valueKey = appDataQueryKeys.value(namespace, key)
      const namespaceKey = appDataQueryKeys.namespace(namespace)

      queryClient.setQueryData(valueKey, context.previousValue ?? null)
      if (context.previousNamespace !== undefined) {
        queryClient.setQueryData(namespaceKey, context.previousNamespace)
      }
    },
    onSuccess: (data, { namespace, key }) => {
      const valueKey = appDataQueryKeys.value(namespace, key)
      const namespaceKey = appDataQueryKeys.namespace(namespace)

      queryClient.setQueryData(valueKey, data)
      const existingNamespace = queryClient.getQueryData<Record<string, T>>(namespaceKey)
      if (existingNamespace) {
        queryClient.setQueryData<Record<string, T>>(namespaceKey, {
          ...existingNamespace,
          [key]: data,
        })
      }
    },
  })
}
