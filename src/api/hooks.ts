import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useCurrentLocale } from '../contexts/LocaleContext'

// Static data imports — used as placeholderData so the site works without backend
import { platformDropdown, resourcesDropdown, footerColumns as staticFooterColumns, testimonials as staticTestimonials } from '../data/content'
import { pricingPlans as staticPricingPlans } from '../data/pricing'
import { allPlaceholderPosts } from '../data/newsroom'

const staticNavigation = [platformDropdown, resourcesDropdown]
const staticFooter = { columns: staticFooterColumns, socialLinks: [], copyright: 'Made with love by Oxy.' }
const staticNewsroom = { posts: allPlaceholderPosts, total: allPlaceholderPosts.length, page: 1, pages: 1 }

// Helper: safely get locale (returns undefined outside LocaleProvider)
function useSafeLocale(): string | undefined {
  try {
    return useCurrentLocale()
  } catch {
    return undefined
  }
}

// ── Pages ──
export function usePage(slug: string) {
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['page', slug, locale],
    queryFn: () => apiFetch(`/pages/${slug}`, { locale }),
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
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['navigation', locale],
    queryFn: () => apiFetch<any[]>('/navigation', { locale }),
    placeholderData: staticNavigation,
  })
}

// ── Footer ──
export function useFooter() {
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['footer', locale],
    queryFn: () => apiFetch<{ columns: any[]; socialLinks: any[]; copyright: string }>('/footer', { locale }),
    placeholderData: staticFooter,
  })
}

// ── Newsroom ──
export function useNewsroomPosts(params?: { category?: string; featured?: boolean; limit?: number; page?: number }) {
  const locale = useSafeLocale()
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.featured) searchParams.set('featured', 'true')
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.page) searchParams.set('page', String(params.page))
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ['newsroom', params, locale],
    queryFn: () => apiFetch<{ posts: any[]; total: number; page: number; pages: number }>(`/newsroom${qs ? `?${qs}` : ''}`, { locale }),
    placeholderData: staticNewsroom,
  })
}

interface NewsroomPost {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  oxyUserId: string
  tags: string[]
  category: string
  featured: boolean
  status: string
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export function useNewsroomPost(slug: string) {
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['newsroom', slug, locale],
    queryFn: () => apiFetch<NewsroomPost>(`/newsroom/${slug}`, { locale }),
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
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['pricing', locale],
    queryFn: () => apiFetch<any[]>('/pricing', { locale }),
    placeholderData: staticPricingPlans,
  })
}

// ── Testimonials ──
export function useTestimonials() {
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['testimonials', locale],
    queryFn: () => apiFetch<any[]>('/testimonials', { locale }),
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
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['jobs', locale],
    queryFn: () => apiFetch<any[]>('/jobs', { locale }),
  })
}

export function useJob(slug: string) {
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['job', slug, locale],
    queryFn: () => apiFetch<any>(`/jobs/${slug}`, { locale }),
    enabled: !!slug,
  })
}

// ── Site Settings ──
export function useSiteSettings() {
  const locale = useSafeLocale()
  return useQuery({
    queryKey: ['settings', locale],
    queryFn: () => apiFetch('/settings', { locale }),
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

// ── Platform Stats (Dashboard) ──
export interface PlatformStats {
  totalUsers: number
  activeSessions: number
  totalMessages: number
  totalNotifications: number
  totalFiles: number
  totalTransactions: number
  totalDeveloperApps: number
  totalFollows: number
  aiModels: number
  topCountries: Array<{ location: string; count: number }>
  regions: number
  timestamp: string
}

const DEFAULT_PLATFORM_STATS: PlatformStats = {
  totalUsers: 0,
  activeSessions: 0,
  totalMessages: 0,
  totalNotifications: 0,
  totalFiles: 0,
  totalTransactions: 0,
  totalDeveloperApps: 0,
  totalFollows: 0,
  aiModels: 4,
  topCountries: [],
  regions: 0,
  timestamp: new Date().toISOString(),
}

const OXY_API = 'https://api.oxy.so'

export function usePlatformStats() {
  const [data, setData] = useState<PlatformStats>(DEFAULT_PLATFORM_STATS)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let es: EventSource | null = null
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null

    try {
      es = new EventSource(`${OXY_API}/platform-stats/stream`)

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as PlatformStats
          setData(parsed)
          setIsConnected(true)
        } catch { /* ignore parse errors */ }
      }

      es.onerror = () => {
        setIsConnected(false)
        // If SSE fails, fall back to a single REST fetch
        if (es) {
          es.close()
          es = null
        }
        fallbackTimeout = setTimeout(async () => {
          try {
            const resp = await fetch(`${OXY_API}/platform-stats`)
            if (resp.ok) setData(await resp.json())
          } catch { /* ignore */ }
        }, 1000)
      }
    } catch {
      // EventSource not supported — REST fallback
      fetch(`${OXY_API}/platform-stats`)
        .then((r) => r.json())
        .then(setData)
        .catch(() => {})
    }

    return () => {
      if (es) es.close()
      if (fallbackTimeout) clearTimeout(fallbackTimeout)
    }
  }, [])

  return { data, isConnected }
}
