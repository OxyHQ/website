import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useCurrentLocale } from '../contexts/LocaleContext'

// Static data imports — used as placeholderData so the site works without backend
import { platformDropdown, resourcesDropdown, ecosystemDropdown, footerColumns as staticFooterColumns, testimonials as staticTestimonials, type Testimonial, type FooterColumn, type NavDropdown, type NavDropdownItem, type NavDropdownSection, type NavSidePanel } from '../data/content'
import { pricingPlans as staticPricingPlans, type PricingPlan } from '../data/pricing'
import { allPlaceholderPosts, type NewsroomPost } from '../data/newsroom'
import { type DescriptionBlock } from '../data/careers'

const staticNavigation = [platformDropdown, ecosystemDropdown, resourcesDropdown]
const staticFooter = { columns: staticFooterColumns, socialLinks: [], copyright: 'Made with love by Oxy.' }
const staticNewsroom = { posts: allPlaceholderPosts, total: allPlaceholderPosts.length, page: 1, pages: 1 }


// ── Pages ──
export function usePage(slug: string) {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['page', slug, locale],
    queryFn: () => apiFetch(`/pages/${slug}`, { locale }),
    retry: false,
  })
}

export function useUpdatePage(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch(`/pages/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['page', slug] }),
  })
}

export function usePromptPhrases(slug: string, enabled = true) {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['promptPhrases', slug, locale],
    queryFn: () => apiFetch<string[]>(`/pages/${slug}/prompt-phrases`, { locale }),
    placeholderData: [],
    enabled,
    retry: false,
    staleTime: Infinity,
  })
}

// ── Navigation ──

interface RawNavDropdown {
  _id?: string
  label: string
  order?: number
  sections?: NavDropdownSection[]
  items?: Array<NavDropdownItem & { section?: string }>
  sidePanel?: NavSidePanel
}

export type NavigationItem = NavDropdown & { _id?: string; order?: number }

// The DB stores items flat with a `section` string per item; the NavDropdown
// type expects grouped `sections[]`. Normalize API responses to that shape.
// _id and order are passed through for the admin editor.
function normalizeNavItem(dd: RawNavDropdown): NavigationItem {
  if (Array.isArray(dd.sections)) {
    return { _id: dd._id, order: dd.order, label: dd.label, sections: dd.sections, sidePanel: dd.sidePanel }
  }
  const sectionOrder: string[] = []
  const sectionMap: Record<string, NavDropdownItem[]> = {}
  for (const item of (dd.items ?? [])) {
    const heading: string = item.section ?? ''
    if (!sectionMap[heading]) {
      sectionMap[heading] = []
      sectionOrder.push(heading)
    }
    const { section: _s, ...rest } = item
    sectionMap[heading].push(rest)
  }
  return {
    _id: dd._id,
    order: dd.order,
    label: dd.label,
    sections: sectionOrder.map((h) => ({ heading: h, items: sectionMap[h] })),
    sidePanel: dd.sidePanel,
  }
}

export function useNavigation() {
  const locale = useCurrentLocale()
  return useQuery<NavigationItem[]>({
    queryKey: ['navigation', locale],
    queryFn: async () => {
      const raw = await apiFetch<RawNavDropdown[]>('/navigation', { locale })
      return raw.map(normalizeNavItem)
    },
    initialData: staticNavigation,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

// ── Footer ──
export function useFooter() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['footer', locale],
    queryFn: () => apiFetch<{ _id?: string; columns: FooterColumn[]; socialLinks: unknown[]; copyright: string }>('/footer', { locale }),
    initialData: staticFooter,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

// ── Newsroom ──
export function useNewsroomPosts(params?: { category?: string; featured?: boolean; limit?: number; page?: number }) {
  const locale = useCurrentLocale()
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.featured) searchParams.set('featured', 'true')
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.page) searchParams.set('page', String(params.page))
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ['newsroom', params, locale],
    queryFn: () => apiFetch<{ posts: NewsroomPost[]; total: number; page: number; pages: number }>(`/newsroom${qs ? `?${qs}` : ''}`, { locale }),
    initialData: staticNewsroom,
    placeholderData: keepPreviousData,
  })
}

export function useNewsroomPost(slug: string) {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['newsroom', slug, locale],
    queryFn: () => apiFetch<NewsroomPost>(`/newsroom/${slug}`, { locale }),
    enabled: !!slug,
  })
}

export function useCreateNewsroomPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewsroomPost) =>
      apiFetch<NewsroomPost>('/newsroom', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsroom'] }),
  })
}

// ── Pricing ──
export function usePricing() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['pricing', locale],
    queryFn: () => apiFetch<PricingPlan[]>('/pricing', { locale }),
    initialData: staticPricingPlans,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
  })
}

// ── Testimonials ──
export function useTestimonials() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['testimonials', locale],
    queryFn: () => apiFetch<Testimonial[]>('/testimonials', { locale }),
    initialData: staticTestimonials,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

// ── Changelog ──
export interface ChangelogEntry {
  _id?: string
  title: string
  content: string
  tags: string[]
  date: string
  items?: string[]
  media?: string
  tagName?: string
  repoOwner?: string
  repoName?: string
  repoDisplayName?: string
  htmlUrl?: string
}

interface ChangelogResponse {
  entries: ChangelogEntry[]
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
export interface Job {
  _id?: string
  slug: string
  title: string
  department: string
  subtitle?: string
  location: string
  type?: string
  engagement?: string
  compensation?: string
  description?: DescriptionBlock[]
  active?: boolean
  order?: number
  createdAt?: string
}

export function useJobs() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['jobs', locale],
    queryFn: () => apiFetch<Job[]>('/jobs', { locale }),
    initialData: [],
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useJob(slug: string) {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['job', slug, locale],
    queryFn: () => apiFetch<Job>(`/jobs/${slug}`, { locale }),
    enabled: !!slug,
  })
}

// ── Site Settings ──
export interface SiteSettings {
  _id?: string
  siteTitle: string
  siteDescription: string
  ogImage: string
  banner: { text: string; href: string; visible: boolean }
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'Oxy',
  siteDescription: 'The everything app for work',
  ogImage: '',
  banner: { text: 'Alia. Think better, together.', href: '/ai', visible: true },
}

export function useSiteSettings() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['settings', locale],
    queryFn: () => apiFetch<SiteSettings>('/settings', { locale }),
    initialData: DEFAULT_SITE_SETTINGS,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
  })
}

// ── MCP Tokens ──
export interface McpToken {
  _id: string
  name: string
  createdBy: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revoked: boolean
}

export function useMcpTokens(enabled = true) {
  return useQuery({
    queryKey: ['mcp-tokens'],
    queryFn: () => apiFetch<McpToken[]>('/mcp-tokens'),
    enabled,
    retry: false,
  })
}

export function useCreateMcpToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; expiresAt?: string }) =>
      apiFetch<{ token: string }>('/mcp-tokens', { method: 'POST', body: JSON.stringify(data) }),
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
