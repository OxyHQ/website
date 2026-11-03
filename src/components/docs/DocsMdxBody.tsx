import { Suspense, createElement, useEffect } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { mdxLazyComponents } from '../../content/docs-loader';
import { mdxComponents } from '../docs-platform/mdxComponentMap';

/** A location hash as the id it names, or null for none or a malformed escape. */
function fragmentOf(hash: string): string | null {
  try {
    return decodeURIComponent(hash.slice(1)) || null;
  } catch {
    return null;
  }
}

/**
 * Scroll to the heading a deep link names (`…/peable/errors/#resource_missing`)
 * once the page's MDX has rendered.
 *
 * The browser scrolls to a fragment while it parses the PRERENDERED prose, and
 * that prose takes its heading ids from the newsroom slugger, which turns `_`
 * into `-`; the MDX that replaces it is slugged by `rehype-slug`, which keeps
 * it. So a link to any heading with an underscore — every error code an API
 * error's `doc_url` names — landed at the top of the page. Rendered inside the
 * Suspense boundary after the content, so its effect runs once the headings
 * exist; keyed by the page, so it runs again on every page navigated to.
 */
function ScrollToHash() {
  useEffect(() => {
    const id = fragmentOf(window.location.hash);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return null;
}

export function DocsMdxBody({ file }: { file: string }) {
  const lazyComponent = mdxLazyComponents.get(file);

  if (!lazyComponent) {
    return (
      <div className="not-prose rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted-foreground">
          Page content unavailable. The synced docs may be out of date. Run{' '}
          <code>bun scripts/sync-docs.ts</code> from the website root.
        </p>
      </div>
    );
  }
  // `createElement` keeps the lazy component out of the JSX namespace, which
  // satisfies `react-hooks/static-components`. The components themselves are
  // built at module init in `docs-loader.ts` so identities stay stable across
  // renders.
  return (
    <div className="docs-prose-body min-w-0 [&>h1:first-child]:hidden">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          {createElement(lazyComponent)}
          <ScrollToHash key={file} />
        </Suspense>
      </MDXProvider>
    </div>
  );
}
