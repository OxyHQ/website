/**
 * Shared shape + filter for newsroom (blog) posts pulled from `/api/newsroom`,
 * narrowed to the fields the docs search engine and the build-time search
 * indexer need. Keeping it in one place stops the type and the
 * published/safe-slug rule from drifting between `site-search.ts` and
 * `scripts/build-docs-search-index.ts`.
 */
export interface NewsroomPost {
  slug: string
  title: string
  description?: string
  resume?: string
  status?: string
}

/**
 * Slugs become file paths *and* URLs, so only accept safe characters — defends
 * against a malformed or hostile slug (path traversal, stray HTML in a URL).
 */
export const SAFE_NEWSROOM_SLUG = /^[a-z0-9-]+$/i

/** A post is worth indexing when it's published and has a safe slug. */
export function isIndexablePost(post: NewsroomPost): boolean {
  return SAFE_NEWSROOM_SLUG.test(post.slug ?? '') && (post.status ?? 'published') === 'published'
}
