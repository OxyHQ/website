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

/**
 * Repoint a link that already aims at this package's docs tree but names a
 * version this site does not serve.
 *
 * The Bloom repo writes `[Label](/developers/docs/bloom/main/label)` — `main`
 * is its own branch, while the synced tree here is `1.0.0`. Forty-four of those
 * links shipped, and the `/developers/docs/*` rewrite in `_redirects` hid every
 * one behind a 200 until it was removed.
 *
 * Conservative by construction: the segment is only dropped when what remains
 * is a real page of this package. A link to a slug that genuinely does not
 * exist is left alone to be reported, not silently pointed somewhere plausible.
 */
export function rewriteStaleDocsVersionLinks(
  source: string,
  slugs: ReadonlySet<string>,
  shortName: string,
  baseUrl: string,
): string {
  const pattern = new RegExp(
    `(\\]\\()\\/developers\\/docs\\/${shortName}\\/([^)\\s#]+)(#[^)\\s]*)?\\)`,
    'g',
  );
  const withinPackage = source.replace(
    pattern,
    (match, open: string, rest: string, anchor: string | undefined) => {
      const target = rest.replace(/\/+$/, '');
      if (slugs.has(target)) return `${open}${baseUrl}/${target}${anchor ?? ''})`;
      const withoutFirstSegment = target.split('/').slice(1).join('/');
      if (!withoutFirstSegment || !slugs.has(withoutFirstSegment)) return match;
      return `${open}${baseUrl}/${withoutFirstSegment}${anchor ?? ''})`;
    },
  );

  // A link that drops the package segment entirely: Allo's docs write
  // `](/developers/docs/matrix/data-model)` for a page this build serves at
  // `/developers/docs/allo/matrix/data-model`. Only rewritten when the whole
  // remainder is a page of THIS package, so a genuine cross-package link is
  // never captured by it.
  return withinPackage.replace(
    /(\]\()\/developers\/docs\/([^)\s#]+)(#[^)\s]*)?\)/g,
    (match, open: string, rest: string, anchor: string | undefined) => {
      const target = rest.replace(/\/+$/, '');
      if (!slugs.has(target)) return match;
      return `${open}${baseUrl}/${target}${anchor ?? ''})`;
    },
  );
}

/**
 * Resolve branch-named links to another synced package's documentation root.
 *
 * A package-local pass cannot resolve these: while syncing OxyFont, for
 * example, Bloom's published version is not part of OxyFont's page index. Run
 * this after the complete package index exists, using that index as the only
 * authority for valid cross-package targets.
 */
export function rewriteCrossPackageDocRootLinks(
  source: string,
  canonicalRoots: ReadonlyMap<string, string>,
): string {
  return source.replace(
    /(\]\()\/developers\/docs\/([a-z0-9-]+)\/(?:main|master)\/?(#[^)\s]*)?\)/g,
    (match, open: string, shortName: string, anchor: string | undefined) => {
      const root = canonicalRoots.get(shortName)
      return root === undefined ? match : `${open}${root}/${anchor ?? ''})`
    },
  )
}
