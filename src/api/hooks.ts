import { useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useCurrentLocale } from '../contexts/LocaleContext'
import {
  subscribeFairCoinStats,
  getFairCoinStatsSnapshot,
  getFairCoinStatsServerSnapshot,
  type FairCoinStats,
} from './faircoinStore'
import {
  subscribePlatformStats,
  getPlatformStatsSnapshot,
  getPlatformStatsServerSnapshot,
  type PlatformStats,
  type ActivityEvent,
} from './platformStatsStore'

import { type Testimonial, type FooterColumn, type NavDropdown, type NavDropdownItem, type NavDropdownSection, type NavSidePanel } from '../data/content'
import { type PricingPlan } from '../data/pricing'
import { type NewsroomPost } from '../data/newsroom'
import { type DescriptionBlock } from '../data/careers'

/**
 * Resolve a populated Media field to a URL string.
 * Handles: null → '', string → string, { url } object → url, { thumbnails } → best thumbnail.
 */
function resolveMediaUrl(field: unknown, preferThumbnail?: 'sm' | 'md' | 'lg'): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field !== null) {
    const media = field as { url?: string; thumbnails?: { sm?: string; md?: string; lg?: string } }
    if (preferThumbnail && media.thumbnails?.[preferThumbnail]) return media.thumbnails[preferThumbnail]!
    return media.url || ''
  }
  return ''
}

/** Resolve all media fields on a newsroom post to URL strings */
function normalizePostMedia(post: NewsroomPost): NewsroomPost {
  return {
    ...post,
    coverImage: resolveMediaUrl(post.coverImage, 'lg'),
    ogImage: resolveMediaUrl(post.ogImage),
  }
}

/** Resolve media field on a changelog entry */
function normalizeEntryMedia<T extends { media?: unknown }>(entry: T): T {
  return { ...entry, media: resolveMediaUrl(entry.media, 'lg') as any }
}


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

// ── Hero ──
import type { CarouselSlot } from '../data/heroCarousel'

/** Populated Media ref from the server, or a plain URL string, or null. */
export type HeroMediaRef =
  | string
  | null
  | {
      _id?: string
      url?: string
      thumbnails?: { sm?: string; md?: string; lg?: string }
    }

export interface HeroContent {
  _id?: string
  title: string
  eyebrow: string
  backgroundVideoWebm: HeroMediaRef
  backgroundVideoMp4: HeroMediaRef
  backgroundPoster: HeroMediaRef
  carouselSlots: CarouselSlot[]
}

export function useHero() {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['hero', locale],
    queryFn: () => apiFetch<HeroContent>('/hero', { locale }),
    staleTime: 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}

// ── Categories ──
export type CategoryScope = 'apps' | 'nav' | 'generic'

export interface CategoryRecord {
  _id?: string
  slug: string
  label: string
  description?: string
  scope: CategoryScope
  order: number
}

export function useCategories(scope?: CategoryScope) {
  const qs = scope ? `?scope=${scope}` : ''
  return useQuery<CategoryRecord[]>({
    queryKey: ['categories', scope ?? 'all'],
    queryFn: () => apiFetch<CategoryRecord[]>(`/categories${qs}`),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

// ── Products ──
export type ProductLifecycle = 'live' | 'in-development'

export interface ProductLogoRef {
  _id?: string
  url?: string
  thumbnails?: { sm?: string; md?: string; lg?: string }
}

export interface ProductRecord {
  _id?: string
  productId: string
  name: string
  tagline: string
  description: string
  href: string
  landingUrl?: string
  healthUrl?: string
  external: boolean
  cta: string
  brand: string
  brandForeground?: string
  mark: string
  logo?: string | ProductLogoRef | null
  section: string
  lifecycle: ProductLifecycle
  showOnProducts: boolean
  showOnStatus: boolean
  showInNav: boolean
  order: number
}

export interface UseProductsOptions {
  surface?: 'products' | 'status' | 'nav'
  lifecycle?: ProductLifecycle
  section?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  const locale = useCurrentLocale()
  const qs = new URLSearchParams()
  if (options.surface) qs.set('surface', options.surface)
  if (options.lifecycle) qs.set('lifecycle', options.lifecycle)
  if (options.section) qs.set('section', options.section)
  const query = qs.toString()
  return useQuery<ProductRecord[]>({
    queryKey: ['products', options.surface ?? 'all', options.lifecycle ?? 'any', options.section ?? 'any', locale],
    queryFn: () => apiFetch<ProductRecord[]>(`/products${query ? `?${query}` : ''}`, { locale }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function resolveProductLogoUrl(product: ProductRecord): string {
  const logo = product.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  return logo.thumbnails?.md || logo.thumbnails?.lg || logo.url || ''
}

// ── Service status ──
export type ServiceStatusValue = 'operational' | 'degraded' | 'down' | 'unknown'

export interface ServiceStatusEntry {
  id: string
  name: string
  description: string
  section: string
  url: string
  landingUrl: string | null
  brand: string
  brandForeground?: string
  mark: string
  logoUrl: string | null
  status: ServiceStatusValue
  latencyMs: number | null
  httpStatus: number | null
  lastChecked: string
}

export interface ServiceStatusPayload {
  generatedAt: string
  overall: ServiceStatusValue
  services: ServiceStatusEntry[]
}

export function useServiceStatus() {
  return useQuery<ServiceStatusPayload>({
    queryKey: ['status'],
    queryFn: () => apiFetch<ServiceStatusPayload>('/status'),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  })
}

export function useUpdateHero() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<{
      title: string
      eyebrow: string
      backgroundVideoWebm: string | null
      backgroundVideoMp4: string | null
      backgroundPoster: string | null
      carouselSlots: CarouselSlot[]
    }>) => apiFetch<HeroContent>('/hero', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero'] }),
  })
}

// ── Newsroom ──
export function useNewsroomPosts(params?: { category?: string; tag?: string; featured?: boolean; limit?: number; page?: number; author?: string }) {
  const locale = useCurrentLocale()
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.tag) searchParams.set('tag', params.tag)
  if (params?.featured) searchParams.set('featured', 'true')
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.author) searchParams.set('author', params.author)
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ['newsroom', params, locale],
    queryFn: () => apiFetch<{ posts: NewsroomPost[]; total: number; page: number; pages: number }>(`/newsroom${qs ? `?${qs}` : ''}`, { locale }),
    select: (data) => ({ ...data, posts: data.posts.map(normalizePostMedia) }),
    placeholderData: keepPreviousData,
  })
}

export function useNewsroomPost(slug: string) {
  const locale = useCurrentLocale()
  return useQuery({
    queryKey: ['newsroom', slug, locale],
    queryFn: () => apiFetch<NewsroomPost>(`/newsroom/${slug}`, { locale }),
    select: normalizePostMedia,
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
    select: (data) => ({ ...data, entries: data.entries.map(normalizeEntryMedia) }),
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

// ── Team ──
export function useTeamMembers() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => apiFetch<{ _id: string; name: string; slug: string; role: string; department: string; bio: string; avatar: string; socials?: { linkedin?: string; twitter?: string; github?: string; website?: string } }[]>('/team'),
    select: (data) => data.map(m => ({ ...m, avatar: resolveMediaUrl(m.avatar, 'md') })),
    staleTime: 5 * 60_000,
  })
}

export function useTeamMember(slug: string) {
  return useQuery({
    queryKey: ['team', slug],
    queryFn: () => apiFetch<{ _id: string; name: string; slug: string; role: string; department: string; bio: string; avatar: string; socials?: { linkedin?: string; twitter?: string; github?: string; website?: string } }>(`/team/${slug}`),
    select: (data) => ({ ...data, avatar: resolveMediaUrl(data.avatar, 'md') }),
    enabled: !!slug,
  })
}

// ── Media ──
export interface MediaItem {
  _id: string
  url: string
  thumbnails: { sm: string; md: string; lg: string }
  filename: string
  key: string
  mimeType: string
  size: number
  width?: number
  height?: number
  alt: string
  tags: string[]
  folder: string
  createdAt: string
}

export function useMedia(params?: { search?: string; type?: string; tag?: string; folder?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.type) searchParams.set('type', params.type)
  if (params?.tag) searchParams.set('tag', params.tag)
  if (params?.folder) searchParams.set('folder', params.folder)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  const qs = searchParams.toString()
  return useQuery<{ items: MediaItem[]; total: number; page: number; pages: number }>({
    queryKey: ['media', qs],
    queryFn: () => apiFetch(`/media?${qs}`),
    staleTime: 60_000,
    retry: false,
  })
}

export function useMediaItem(id: string) {
  return useQuery<MediaItem>({
    queryKey: ['media', id],
    queryFn: () => apiFetch(`/media/${id}`),
    enabled: !!id,
    retry: false,
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
    select: (data) => ({ ...data, ogImage: resolveMediaUrl(data.ogImage) }),
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
// Types are owned by ./platformStatsStore and re-exported here so existing
// callers can keep importing from this module alongside the hook.
export type { PlatformStats, ActivityEvent }

export function usePlatformStats() {
  return useSyncExternalStore(
    subscribePlatformStats,
    getPlatformStatsSnapshot,
    getPlatformStatsServerSnapshot,
  )
}

// ── Infrastructure Status ──
export interface InfraStatusNode {
  region: string
  status: 'online' | 'degraded' | 'offline'
  droplets: number
  apps: number
  dbs: number
}

export function useInfraStatus() {
  return useQuery<{ nodes: InfraStatusNode[] }>({
    queryKey: ['infra-status'],
    queryFn: () => apiFetch('/infra-status'),
    refetchInterval: 60_000,
    staleTime: 55_000,
  })
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
  }
  bio: string
  showActivity: boolean
  badges: Array<{ badgeId: string; awardedAt: string }>
  stats: { comments: number; likes: number; votes: number; articles: number; followers: number; following: number } | null
}

export function useUserById(userId: string) {
  return useQuery({
    queryKey: ['user-by-id', userId],
    queryFn: () => apiFetch<{ _id: string; username: string; name: { first?: string; last?: string }; avatar?: string; color?: string }>(`/profiles/id/${userId}`),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => apiFetch<UserProfileData>(`/profiles/${username}`),
    enabled: !!username,
    staleTime: 5 * 60_000,
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
    staleTime: 5 * 60_000,
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

export interface FeatureListResponse {
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

// ── FairCoin live stats ──
export type { FairCoinStats }

export function useFairCoinStats(): FairCoinStats | null {
  return useSyncExternalStore(
    subscribeFairCoinStats,
    getFairCoinStatsSnapshot,
    getFairCoinStatsServerSnapshot,
  )
}
