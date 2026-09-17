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

/** `featured: false` ("only posts that are not featured") has no public equivalent. */
function refuseNotFeatured(input: Record<string, unknown>): void {
  if (input.featured === false) {
    throw new PublicReadRefused('Filtering to entries that are not featured is only available to website admins.')
  }
}

/** Public lists hold active rows only; asking for inactive ones must not look like "there are none". */
function refuseInactive(input: Record<string, unknown>): void {
  if (input.active === false) {
    throw new PublicReadRefused('Inactive entries are only visible to website admins.')
  }
}

const featuredQuery = (input: Record<string, unknown>) => (input.featured === true ? 'true' : undefined)

export const MCP_TOOL_ACCESS: Readonly<Record<string, McpToolAccess>> = {
  describe_access: { kind: 'public' },
  get_mcp_status: { kind: 'public' },
  debug_upload_test: write,

  list_pages: adminRead,
  get_page: publicRead((input) => withQuery(`/pages/${segment(input.slug)}`, { locale: input.locale })),
  upsert_page: write,

  get_navigation: publicRead((input) => withQuery('/navigation', { locale: input.locale })),
  get_footer: publicRead(() => '/footer'),
  get_hero: publicRead((input) => withQuery('/hero', { locale: input.locale })),
  update_hero: write,

  list_posts: publicRead((input) => {
    refuseDrafts(input)
    refuseNotFeatured(input)
    return withQuery('/newsroom', {
      category: input.category,
      tag: input.tag,
      featured: featuredQuery(input),
      search: input.search,
      product: input.product,
      author: input.author,
      view: input.view,
      locale: input.locale,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_post: publicRead((input) => withQuery(`/newsroom/${segment(input.slug)}`, { locale: input.locale })),
  get_post_with_media: publicRead((input) => withQuery(`/newsroom/${segment(input.slug)}`, { locale: input.locale })),
  search_posts: publicRead((input) => withQuery('/newsroom', {
    search: input.query,
    view: input.view,
    locale: input.locale,
    limit: input.limit,
    page: input.page,
  })),
  create_post: write,
  update_post: write,
  delete_post: write,

  get_pricing: publicRead((input) => withQuery('/pricing', { locale: input.locale })),
  replace_pricing: write,
  update_pricing_plan: write,
  get_testimonials: publicRead((input) => withQuery('/testimonials', { locale: input.locale })),
  replace_testimonials: write,

  list_changelog: publicRead((input) => {
    refuseFilters(input, ['search'])
    return withQuery('/changelog', { repo: input.repo, locale: input.locale, limit: input.limit, page: input.page })
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

  list_team_members: publicRead((input) => {
    refuseInactive(input)
    return withQuery('/team', { locale: input.locale })
  }),
  get_team_member: publicRead((input) => withQuery(`/team/${segment(input.slug)}`, { locale: input.locale })),
  create_team_member: write,
  update_team_member: write,
  delete_team_member: write,

  list_media: adminRead,
  get_media: publicRead((input) => `/media/${segment(input.id)}`),
  update_media: write,
  delete_media: write,

  get_settings: publicRead((input) => withQuery('/settings', { locale: input.locale })),
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

  list_categories: publicRead((input) => withQuery('/categories', { scope: input.scope, locale: input.locale })),
  get_category: publicRead((input) => withQuery(`/categories/${segment(input.slug)}`, { locale: input.locale })),
  create_category: write,
  update_category: write,
  delete_category: write,

  list_products: publicRead((input) => {
    refuseFilters(input, ['category'])
    return withQuery('/products', {
      lifecycle: input.lifecycle,
      section: input.section,
      surface: input.surface,
      locale: input.locale,
    })
  }),
  get_product: publicRead((input) => withQuery(`/products/${segment(input.productId)}`, { locale: input.locale })),
  create_product: write,
  update_product: write,
  delete_product: write,

  list_courses: publicRead((input) => {
    refuseDrafts(input)
    refuseNotFeatured(input)
    refuseFilters(input, ['level'])
    return withQuery('/courses', {
      category: input.category,
      tag: input.tag,
      featured: featuredQuery(input),
      locale: input.locale,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_course: publicRead((input) => withQuery(`/courses/${segment(input.slug)}`, { locale: input.locale })),
  create_course: write,
  update_course: write,
  delete_course: write,

  list_resources: publicRead((input) => {
    refuseDrafts(input)
    refuseNotFeatured(input)
    return withQuery('/resources', {
      category: input.category,
      tag: input.tag,
      type: input.type,
      featured: featuredQuery(input),
      locale: input.locale,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_resource: publicRead((input) => withQuery(`/resources/${segment(input.slug)}`, { locale: input.locale })),
  create_resource: write,
  update_resource: write,
  delete_resource: write,

  list_help_articles: publicRead((input) => {
    refuseDrafts(input)
    refuseNotFeatured(input)
    return withQuery('/help', {
      category: input.category,
      tag: input.tag,
      featured: featuredQuery(input),
      locale: input.locale,
      limit: input.limit,
      page: input.page,
    })
  }),
  get_help_article: publicRead((input) => withQuery(`/help/${segment(input.slug)}`, { locale: input.locale })),
  create_help_article: write,
  update_help_article: write,
  delete_help_article: write,

  list_referrals: adminRead,
  get_referral: adminRead,
  create_referral: write,
  update_referral: write,
  delete_referral: write,
}

// ── Effects ────────────────────────────────────────────────────────────────

/**
 * What the catalog promises about a write, declared per tool rather than
 * derived from its name.
 *
 * `idempotency` is Oxy's contract field, and there it means "accepts an
 * idempotency key" — the contract refuses an effectful tool without one. Every
 * write here accepts `idempotencyKey` (server/mcp/idempotency.ts), so every
 * write is `'supported'`. Whether a repeat WITHOUT a key is harmless is a
 * separate fact, recorded as `repeatSafe`: setting fields on a record found by
 * its key is; a create, an upload or a wholesale replace is not.
 *
 * `rollback: 'manual'` means a real procedure undoes the change, named in
 * `undo` (the delete tool for a create). Anything that overwrites or removes
 * data is `'none'` — there is no history to restore from — which is what makes
 * MCP mark it destructive.
 */
export interface McpToolEffects {
  idempotency: 'none' | 'supported'
  /** A repeat of the identical call, without a key, creates or changes nothing more. */
  repeatSafe: boolean
  rollback: 'none' | 'manual'
  /** For `rollback: 'manual'`: the tool that undoes this one. */
  undo?: string
}

const READ_EFFECTS: McpToolEffects = { idempotency: 'none', repeatSafe: true, rollback: 'none' }
const naturallyIdempotent: McpToolEffects = { idempotency: 'supported', repeatSafe: true, rollback: 'none' }
const irreversible: McpToolEffects = { idempotency: 'supported', repeatSafe: false, rollback: 'none' }
const undoneBy = (undo: string): McpToolEffects => ({ idempotency: 'supported', repeatSafe: false, rollback: 'manual', undo })

export const MCP_WRITE_EFFECTS: Readonly<Record<string, McpToolEffects>> = {
  debug_upload_test: irreversible,

  upsert_page: naturallyIdempotent,
  update_hero: naturallyIdempotent,

  create_post: undoneBy('delete_post'),
  update_post: naturallyIdempotent,
  delete_post: naturallyIdempotent,

  replace_pricing: irreversible,
  update_pricing_plan: naturallyIdempotent,
  replace_testimonials: irreversible,

  create_changelog_entry: undoneBy('delete_changelog_entry'),
  update_changelog_entry: naturallyIdempotent,
  delete_changelog_entry: naturallyIdempotent,

  add_tracked_repo: undoneBy('remove_tracked_repo'),
  update_tracked_repo: naturallyIdempotent,
  remove_tracked_repo: naturallyIdempotent,
  sync_repo: irreversible,
  sync_all_repos: irreversible,

  create_team_member: undoneBy('delete_team_member'),
  update_team_member: naturallyIdempotent,
  delete_team_member: naturallyIdempotent,

  update_media: naturallyIdempotent,
  delete_media: naturallyIdempotent,

  update_settings: naturallyIdempotent,

  create_locale: undoneBy('delete_locale'),
  update_locale: naturallyIdempotent,
  delete_locale: naturallyIdempotent,

  upsert_translation: naturallyIdempotent,
  delete_translation: naturallyIdempotent,

  upload_image: undoneBy('delete_media'),
  upload_and_set_post_cover: irreversible,
  upload_and_set_team_avatar: irreversible,
  bulk_upload_post_covers: irreversible,

  create_category: undoneBy('delete_category'),
  update_category: naturallyIdempotent,
  delete_category: naturallyIdempotent,

  create_product: undoneBy('delete_product'),
  update_product: naturallyIdempotent,
  delete_product: naturallyIdempotent,

  create_course: undoneBy('delete_course'),
  update_course: naturallyIdempotent,
  delete_course: naturallyIdempotent,

  create_resource: undoneBy('delete_resource'),
  update_resource: naturallyIdempotent,
  delete_resource: naturallyIdempotent,

  create_help_article: undoneBy('delete_help_article'),
  update_help_article: naturallyIdempotent,
  delete_help_article: naturallyIdempotent,

  create_referral: undoneBy('delete_referral'),
  update_referral: naturallyIdempotent,
  delete_referral: naturallyIdempotent,
}

/** The effects a tool declares; a write without a declaration fails the boot. */
export function effectsFor(toolName: string): McpToolEffects {
  const access = MCP_TOOL_ACCESS[toolName]
  if (access?.kind !== 'write') return READ_EFFECTS
  const effects = MCP_WRITE_EFFECTS[toolName]
  if (!effects) throw new Error(`MCP write tool ${toolName} declares no effects in mcpAccess.ts`)
  return effects
}
