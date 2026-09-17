/**
 * Who may call each MCP tool, and what a non-admin sees when they may.
 *
 * Anyone with an Oxy account can connect. A website admin (`OXY_ADMIN_USER_IDS`)
 * gets every tool as it always behaved. Everyone else gets reads only, and a
 * read answers from the site's own public REST route, requested with no
 * credentials — so a non-admin can never see more through MCP than an anonymous
 * visitor sees on the site. That is the whole guarantee, so a read with no
 * public route is admin-only rather than filtered here by hand.
 */

export type McpToolAccess =
  /** Writes, and anything with a side effect. Admins only. */
  | { kind: 'write' }
  /** Reads with no public equivalent. Admins only. */
  | { kind: 'admin-read' }
  /** Reads that expose no site data at all; the same handler for everyone. */
  | { kind: 'public' }
  /** Admins get the tool's own handler; everyone else gets this public route. */
  | { kind: 'public-read'; publicPath: (input: Record<string, unknown>) => string }

/** Raised when a non-admin asks for something only an admin could see. */
export class PublicReadRefused extends Error {}

const write = { kind: 'write' } as const
const adminRead = { kind: 'admin-read' } as const

function segment(value: unknown): string {
  return encodeURIComponent(String(value))
}

function withQuery(path: string, query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

/** Public routes list published rows only; asking for drafts must not look like "there are none". */
function refuseDrafts(input: Record<string, unknown>): void {
  if (input.status !== undefined && input.status !== 'published') {
    throw new PublicReadRefused('Unpublished content is only visible to website admins.')
  }
}

/** A filter the public route does not implement would otherwise be silently dropped, widening the result. */
function refuseFilters(input: Record<string, unknown>, names: readonly string[]): void {
  const used = names.filter((name) => input[name] !== undefined)
  if (used.length > 0) {
    throw new PublicReadRefused(`Filtering by ${used.join(', ')} is only available to website admins.`)
  }
}

function publicRead(publicPath: (input: Record<string, unknown>) => string): McpToolAccess {
  return { kind: 'public-read', publicPath }
}

export const MCP_TOOL_ACCESS: Readonly<Record<string, McpToolAccess>> = {
  debug_upload_test: write,

  list_pages: adminRead,
  get_page: publicRead((input) => `/pages/${segment(input.slug)}`),
  upsert_page: write,

  get_navigation: publicRead(() => '/navigation'),
  get_footer: publicRead(() => '/footer'),
  get_hero: publicRead(() => '/hero'),
  update_hero: write,

  list_posts: publicRead((input) => {
    refuseDrafts(input)
    return withQuery('/newsroom', {
      category: input.category,
      tag: input.tag,
      featured: input.featured === true ? 'true' : undefined,
      search: input.search,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_post: publicRead((input) => `/newsroom/${segment(input.slug)}`),
  get_post_with_media: publicRead((input) => `/newsroom/${segment(input.slug)}`),
  search_posts: publicRead((input) => withQuery('/newsroom', { search: input.query, limit: input.limit ?? 10 })),
  create_post: write,
  update_post: write,
  delete_post: write,

  get_pricing: publicRead(() => '/pricing'),
  replace_pricing: write,
  get_testimonials: publicRead(() => '/testimonials'),
  replace_testimonials: write,

  list_changelog: publicRead((input) => {
    refuseFilters(input, ['search'])
    return withQuery('/changelog', { repo: input.repo, limit: input.limit, page: input.page })
  }),
  create_changelog_entry: write,
  update_changelog_entry: write,
  delete_changelog_entry: write,

  list_tracked_repos: adminRead,
  add_tracked_repo: write,
  update_tracked_repo: write,
  remove_tracked_repo: write,
  sync_repo: write,
  sync_all_repos: write,

  list_jobs: publicRead(() => '/jobs'),
  get_job: publicRead((input) => `/jobs/${segment(input.slug)}`),
  create_job: write,
  update_job: write,
  delete_job: write,

  list_team_members: publicRead(() => '/team'),
  get_team_member: publicRead((input) => `/team/${segment(input.slug)}`),
  create_team_member: write,
  update_team_member: write,
  delete_team_member: write,

  list_media: adminRead,
  get_media: publicRead((input) => `/media/${segment(input.id)}`),
  update_media: write,
  delete_media: write,

  get_settings: publicRead(() => '/settings'),
  update_settings: write,

  list_locales: publicRead(() => '/locales'),
  create_locale: write,
  update_locale: write,
  delete_locale: write,

  list_translation_collections: { kind: 'public' },
  get_translations: adminRead,
  get_translation: adminRead,
  upsert_translation: write,
  delete_translation: write,

  upload_image: write,
  upload_and_set_post_cover: write,
  upload_and_set_team_avatar: write,
  bulk_upload_post_covers: write,

  list_categories: publicRead((input) => withQuery('/categories', { scope: input.scope })),
  get_category: publicRead((input) => `/categories/${segment(input.slug)}`),
  create_category: write,
  update_category: write,
  delete_category: write,

  list_products: publicRead((input) => withQuery('/products', {
    lifecycle: input.lifecycle,
    section: input.section,
    surface: input.surface,
  })),
  get_product: publicRead((input) => `/products/${segment(input.productId)}`),
  create_product: write,
  update_product: write,
  delete_product: write,

  list_courses: publicRead((input) => {
    refuseDrafts(input)
    refuseFilters(input, ['level'])
    return withQuery('/courses', {
      category: input.category,
      tag: input.tag,
      featured: input.featured === true ? 'true' : undefined,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_course: publicRead((input) => `/courses/${segment(input.slug)}`),
  create_course: write,
  update_course: write,
  delete_course: write,

  list_resources: publicRead((input) => {
    refuseDrafts(input)
    return withQuery('/resources', {
      category: input.category,
      tag: input.tag,
      type: input.type,
      featured: input.featured === true ? 'true' : undefined,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_resource: publicRead((input) => `/resources/${segment(input.slug)}`),
  create_resource: write,
  update_resource: write,
  delete_resource: write,

  list_help_articles: publicRead((input) => {
    refuseDrafts(input)
    return withQuery('/help', {
      category: input.category,
      tag: input.tag,
      featured: input.featured === true ? 'true' : undefined,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_help_article: publicRead((input) => `/help/${segment(input.slug)}`),
  create_help_article: write,
  update_help_article: write,
  delete_help_article: write,

  list_referrals: adminRead,
  get_referral: adminRead,
  create_referral: write,
  update_referral: write,
  delete_referral: write,
}

/** Rollback metadata for the catalog: a delete or wholesale replace cannot be undone from here. */
export function isIrreversible(toolName: string): boolean {
  return /^(delete|remove|replace)_/.test(toolName)
}
