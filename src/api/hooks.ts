import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'

// Static data imports — used as placeholderData so the site works without backend
import { platformDropdown, resourcesDropdown, footerColumns as staticFooterColumns, testimonials as staticTestimonials, pricingTiers as staticPricingTiers } from '../data/content'

const staticNavigation = [platformDropdown, resourcesDropdown]
const staticFooter = { columns: staticFooterColumns, socialLinks: [], copyright: 'Made with love by Oxy.' }

// ── Pages ──
export function usePage(slug: string) {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: () => apiFetch(`/pages/${slug}`),
  })
}

export function useUpdatePage(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiFetch(`/pages/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['page', slug] }),
  })
}

// ── Navigation ──
export function useNavigation() {
  return useQuery({
    queryKey: ['navigation'],
    queryFn: () => apiFetch<any[]>('/navigation'),
    placeholderData: staticNavigation,
  })
}

// ── Footer ──
export function useFooter() {
  return useQuery({
    queryKey: ['footer'],
    queryFn: () => apiFetch<{ columns: any[]; socialLinks: any[]; copyright: string }>('/footer'),
    placeholderData: staticFooter,
  })
}

// ── Newsroom ──
export function useNewsroomPosts(params?: { category?: string; featured?: boolean; limit?: number; page?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.featured) searchParams.set('featured', 'true')
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.page) searchParams.set('page', String(params.page))
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ['newsroom', params],
    queryFn: () => apiFetch<{ posts: any[]; total: number; page: number; pages: number }>(`/newsroom${qs ? `?${qs}` : ''}`),
  })
}

export function useNewsroomPost(slug: string) {
  return useQuery({
    queryKey: ['newsroom', slug],
    queryFn: () => apiFetch(`/newsroom/${slug}`),
    enabled: !!slug,
  })
}

export function useCreateNewsroomPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiFetch('/newsroom', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsroom'] }),
  })
}

// ── Pricing ──
export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: () => apiFetch<any[]>('/pricing'),
    placeholderData: staticPricingTiers,
  })
}

// ── Testimonials ──
export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: () => apiFetch<any[]>('/testimonials'),
    placeholderData: staticTestimonials,
  })
}

// ── Changelog ──
interface ChangelogResponse {
  entries: Array<{
    _id: string
    title: string
    content: string
    tags: string[]
    date: string
    tagName?: string
    repoOwner?: string
    repoName?: string
    repoDisplayName?: string
    htmlUrl?: string
  }>
  total: number
  page: number
  pages: number
  repos: Array<{ owner: string; repo: string; displayName: string }>
}

export function useChangelog(params?: { repo?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.repo) searchParams.set('repo', params.repo)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ['changelog', params],
    queryFn: () => apiFetch<ChangelogResponse>(`/changelog${qs ? `?${qs}` : ''}`),
  })
}

export function useTrackedRepos() {
  return useQuery({
    queryKey: ['changelog-repos'],
    queryFn: () => apiFetch<Array<{ _id: string; owner: string; repo: string; displayName: string; lastSyncAt: string | null; active: boolean }>>('/changelog/repos'),
  })
}

// ── Jobs ──
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiFetch<any[]>('/jobs'),
  })
}

// ── Site Settings ──
export function useSiteSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch('/settings'),
  })
}

// ── MCP Tokens ──
export function useMcpTokens(enabled = true) {
  return useQuery({
    queryKey: ['mcp-tokens'],
    queryFn: () => apiFetch<any[]>('/mcp-tokens'),
    enabled,
    retry: false,
  })
}

export function useCreateMcpToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; expiresAt?: string }) =>
      apiFetch('/mcp-tokens', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-tokens'] }),
  })
}

export function useRevokeMcpToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/mcp-tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-tokens'] }),
  })
}
