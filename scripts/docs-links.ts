/**
 * Point a source repo's own root-relative links at this site's docs tree.
 *
 * Upstream repos author their docs against their own doc site, where
 * `[Architecture](/architecture)` resolves to a sibling page. Copied here
 * verbatim, that is an absolute URL on oxy.so — eight of them 404'd in
 * production, and Search Console counted every one. `/docs/...` was already
 * rewritten; this covers the bare-slug form, which only becomes resolvable once
 * the version's full page list is known, so it runs as a second pass.
 *
 * Only a target that matches a real sibling slug is touched. Anything else is
 * left alone: a link to `/pricing` from a synced page means this site's pricing
 * page, and guessing otherwise would break a working link to fix a broken one.
 */
export function rewriteSiblingDocLinks(
  source: string,
  slugs: ReadonlySet<string>,
  baseUrl: string,
): string {
  return source.replace(
    /(\]\()\/([A-Za-z0-9][A-Za-z0-9._/-]*?)(#[^)\s]*)?\)/g,
    (match, open: string, target: string, anchor: string | undefined) => {
      const slug = target.replace(/\/+$/, '')
      if (!slugs.has(slug)) return match
      return `${open}${baseUrl}/${slug}${anchor ?? ''})`
    },
  );
}
