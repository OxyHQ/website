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
export function useChangelog() {
  return useQuery({
    queryKey: ['changelog'],
    queryFn: () => apiFetch<any[]>('/changelog'),
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
export function useMcpTokens() {
  return useQuery({
    queryKey: ['mcp-tokens'],
    queryFn: () => apiFetch<any[]>('/mcp-tokens'),
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
