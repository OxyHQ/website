import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useCurrentLocale } from '../contexts/LocaleContext'

import { type Testimonial, type FooterColumn, type NavDropdown, type NavDropdownItem, type NavDropdownSection, type NavSidePanel } from '../data/content'
import { type PricingPlan } from '../data/pricing'
import { type NewsroomPost } from '../data/newsroom'
import { type DescriptionBlock } from '../data/careers'


// ── Pages ──
export interface PageSection {
  type: string
  heading?: string
  subheading?: string
  content?: string
  items?: Array<{ key: string; value: string }>
  order: number
}

export interface PageData {
  _id: string
  slug: string
  title: string
  description: string
  sections: PageSection[]
  promptPhrases: string[]
}

export function usePage(slug: string) {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['page', slug, locale],
    queryFn: () => apiFetch<PageData>(`/pages/${slug}`, { locale }),
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

export function useSiteSettings() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['settings', locale],
    queryFn: () => apiFetch<SiteSettings>('/settings', { locale }),
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

// ── Comments ──
export interface CommentData {
  _id: string
  targetType: string
  targetId: string
  parentId: string | null
  userId: string
  username: string
  body: string
  status: string
  editedAt: string | null
  createdAt: string
  updatedAt: string
}

export function useComments(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => apiFetch<CommentData[]>(`/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`),
    staleTime: 30_000,
    enabled: !!targetId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { targetType: string; targetId: string; body: string; parentId?: string }) =>
      apiFetch<CommentData>('/comments', { method: 'POST', body: JSON.stringify(params) }),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['comments', params.targetType, params.targetId] })
    },
  })
}

export function useEditComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; body: string; targetType: string; targetId: string }) =>
      apiFetch<CommentData>(`/comments/${params.id}`, { method: 'PUT', body: JSON.stringify({ body: params.body }) }),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['comments', params.targetType, params.targetId] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; targetType: string; targetId: string }) =>
      apiFetch<{ success: boolean }>(`/comments/${params.id}`, { method: 'DELETE' }),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['comments', params.targetType, params.targetId] })
    },
  })
}

export function useModerateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; status: string; targetType: string; targetId: string }) =>
      apiFetch<CommentData>(`/comments/${params.id}/moderate`, { method: 'PUT', body: JSON.stringify({ status: params.status }) }),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['comments', params.targetType, params.targetId] })
    },
  })
}

// ── Likes ──
interface LikeData {
  count: number
  liked: boolean
}

export function useLikes(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ['likes', targetType, targetId],
    queryFn: () => apiFetch<LikeData>(`/likes?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`),
    staleTime: 30_000,
    enabled: !!targetId,
  })
}

// ── User Profiles ──
export interface UserProfileData {
  user: {
    _id: string
    username: string
    name: { first?: string; last?: string }
    avatar?: string
    color?: string
    bio?: string
  }
  bio: string
  showActivity: boolean
  badges: Array<{ badgeId: string; awardedAt: string }>
  stats: { comments: number; likes: number; votes: number } | null
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => apiFetch<UserProfileData>(`/profiles/${username}`),
    enabled: !!username,
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { bio?: string; showActivity?: boolean }) =>
      apiFetch('/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

interface ActivityResponse {
  items: Array<{ type: string; data: unknown; createdAt: string }>
  total: number
}

export function useUserActivity(username: string, params?: { page?: number; type?: string }) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.type) qs.set('type', params.type)
  const query = qs.toString()
  return useQuery({
    queryKey: ['profile-activity', username, params],
    queryFn: () => apiFetch<ActivityResponse>(`/profiles/${username}/activity${query ? `?${query}` : ''}`),
    enabled: !!username,
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { targetType: string; targetId: string }) =>
      apiFetch<LikeData>('/likes/toggle', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onMutate: async (params) => {
      const key = ['likes', params.targetType, params.targetId]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<LikeData>(key)
      if (previous) {
        queryClient.setQueryData<LikeData>(key, {
          count: previous.liked ? previous.count - 1 : previous.count + 1,
          liked: !previous.liked,
        })
      }
      return { previous, key }
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: (_data, _err, params) => {
      queryClient.invalidateQueries({ queryKey: ['likes', params.targetType, params.targetId] })
    },
  })
}

// ── Feature Requests (GitHub-backed) ──
export interface FeatureRequestData {
  id: number
  number: number
  title: string
  description: string
  htmlUrl: string
  state: string
  status: string
  category: string
  labels: Array<{ name: string; color: string }>
  author: string
  authorAvatar: string
  githubReactions: number
  localVotes: number
  totalVotes: number
  commentCount: number
  repo: string
  owner: string
  repoName: string
  userVoted: boolean
  createdAt: string
  updatedAt: string
}

interface FeatureListResponse {
  items: FeatureRequestData[]
  total: number
  page: number
  pages: number
}

export function useFeatureRequests(params?: { status?: string; category?: string; sort?: string; page?: number }) {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.category) qs.set('category', params.category)
  if (params?.sort) qs.set('sort', params.sort)
  if (params?.page) qs.set('page', String(params.page))
  const query = qs.toString()
  return useQuery({
    queryKey: ['features', params],
    queryFn: () => apiFetch<FeatureListResponse>(`/features${query ? `?${query}` : ''}`),
    staleTime: 60_000,
  })
}

export function useFeatureDetail(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['feature', owner, repo, number],
    queryFn: () => apiFetch<FeatureRequestData>(`/features/${owner}/${repo}/${number}`),
    enabled: !!owner && !!repo && number > 0,
  })
}

export function useToggleFeatureVote(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ localVotes: number; userVoted: boolean }>(`/features/${owner}/${repo}/${number}/vote`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] })
      queryClient.invalidateQueries({ queryKey: ['feature', owner, repo, number] })
    },
  })
}
