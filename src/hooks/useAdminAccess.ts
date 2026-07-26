import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@oxyhq/services'
import { apiFetch } from '../api/client'

/** Server's answer to "who am I, and am I an admin?" — see server/routes/adminAccess.ts. */
export interface AdminAccess {
  authenticated: boolean
  isAdmin: boolean
  userId: string | null
  username: string | null
}

/**
 * Admin authorization, decided by the server.
 *
 * The client deliberately holds no allowlist. It used to compare `user.username`
 * against a hardcoded `ADMIN_USERNAMES`, while the API compared the Oxy user id
 * against `OXY_ADMIN_USER_IDS` — two allowlists on two identity fields, which
 * drifted and locked real admins out.
 *
 * `user?.id` is part of the query key on purpose. The SDK's auth cold boot on
 * this origin can resolve well after the first render, so the first request may
 * legitimately go out unauthenticated. Keying on the id means the answer is
 * re-fetched the moment the session lands, instead of a pre-session "no" being
 * cached as final — which is exactly how `/admin` ended up stuck on a 404.
 */
export function useAdminAccess() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['admin-access', user?.id ?? null],
    queryFn: () => apiFetch<AdminAccess>('/admin/me'),
    staleTime: 5 * 60_000,
    // The session may still be settling; a transient failure shouldn't read as
    // "not an admin".
    retry: 2,
  })

  return {
    /** True only once the server has confirmed it. Never optimistic. */
    isAdmin: query.data?.isAdmin ?? false,
    /** False while pending — used to tell "sign in" apart from "no access". */
    isAuthenticated: query.data?.authenticated ?? false,
    userId: query.data?.userId ?? null,
    username: query.data?.username ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
