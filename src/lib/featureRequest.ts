/**
 * Shared between the SPA and the build.
 *
 * `scripts/prerender.ts` bakes the `<head>` for a feature request at build time
 * and `FeatureRequestPage` renders the same `<SEO>` at runtime. If those two
 * derived different text from the same issue, a crawler and a reader would see
 * different descriptions for one URL, so both call the functions here.
 */

/** Longest meta description emitted for a feature request, in characters. */
export const FEATURE_DESCRIPTION_MAX_LENGTH = 155

/** In-site path for one request. Mirrors the route registered in `App.tsx`. */
export function featureRequestPath(owner: string, repo: string, issueNumber: number | string): string {
  return `/features/${owner}/${repo}/${issueNumber}`
}

/**
 * A one-line summary of a request, for `<meta name="description">` and link
 * previews.
 *
 * The body is markdown, so the syntax is stripped rather than shown: a preview
 * card reading "## Problem **today**" tells a reader nothing. Code fences go
 * entirely, since a pasted stack trace is the least descriptive thing in the
 * issue. Falls back to the title for a request whose body is only an image, a
 * link, or nothing at all.
 */
export function featureRequestDescription(body: string, title: string): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>#|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length === 0) return title
  if (plain.length <= FEATURE_DESCRIPTION_MAX_LENGTH) return plain
  return `${plain.slice(0, FEATURE_DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`
}
