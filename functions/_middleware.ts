/// <reference types="@cloudflare/workers-types" />
import { brandForHost, buildSiteIdentity, resolveSeoOrDefault, type SeoData } from '../src/lib/seo';
import {
  faircoinApexHref,
  faircoinParticipationRoute,
} from '../src/lib/faircoin-participation-routes';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';
import { serializeStructuredData } from '../src/lib/structuredData';
import { hasPrerenderedNewsroomPost, matchNewsroomPostPath } from './newsroom-status';
import { isSpaFallbackPath, localizedFallbackDocument } from '../src/lib/spaFallback';

/**
 * Cloudflare Pages edge middleware: per-host SEO at request time.
 *
 * One static build is served on both oxy.so and fairco.in. Crawlers don't run
 * JS, so without this they'd read the prerendered Oxy `<head>` on fairco.in
 * (wrong title/description/OG when a FairCoin link is shared). This rewrites the
 * meta tags by Host before the bytes leave the edge.
 *
 * Oxy is the prerendered default, so Oxy requests pass straight through. Only
 * FairCoin hosts get rewritten, and only HTML responses. The metadata is
 * CMS-managed (`GET /api/seo?brand&path`, edge-cached); if that is unseeded or unreachable
 * we fall back to the brand bootstrap meta, so this can never make things worse.
 */

/** Cloudflare Pages runtime bindings this middleware reads. */
interface Env {
  /**
   * Website backend origin, mirroring the `VITE_API_URL` the SPA reads. Set it
   * as a Pages environment variable to point a preview deployment at a staging
   * backend; unset it falls back to production.
   */
  VITE_API_URL?: string;
}

const DEFAULT_API_BASE = 'https://website-api.oxy.so';

async function fetchSeoData(
  apiBase: string,
  pathname: string,
  brand: string,
): Promise<SeoData | null> {
  try {
    const url = new URL(`${apiBase}/api/seo`);
    url.searchParams.set('brand', brand);
    url.searchParams.set('path', pathname);
    const res = await fetch(url.toString(), {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit);
    if (!res.ok) return null;
    return (await res.json()) as SeoData;
  } catch (err) {
    console.error('[seo-middleware] /api/seo fetch failed:', err);
    return null;
  }
}

async function newsroomPostExists(
  apiBase: string,
  slug: string,
  locale?: string,
): Promise<boolean | null> {
  try {
    const url = new URL(`${apiBase}/api/newsroom/${encodeURIComponent(slug)}`);
    if (locale) url.searchParams.set('locale', locale);
    const res = await fetch(url.toString(), {
      cf: { cacheTtl: 60, cacheEverything: true },
    } as RequestInit);
    if (res.ok) return true;
    if (res.status === 404) return false;
    return null;
  } catch (err) {
    console.error('[newsroom-status] detail probe failed:', err);
    return null;
  }
}

function asNotFound(response: Response, html: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=60, must-revalidate');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(html, { status: 404, statusText: 'Not Found', headers });
}

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const faircoinHost = brandForHost(url.hostname) === 'faircoin';
  if (faircoinHost && url.pathname === '/sitemap.xml') {
    return next(new Request(new URL('/faircoin-sitemap.xml', url), request));
  }
  if (faircoinHost && url.pathname === '/robots.txt') {
    const response = await next();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('etag');
    return new Response(
      (await response.text()).replace(
        'https://oxy.so/sitemap.xml',
        'https://fairco.in/sitemap.xml',
      ),
      { status: response.status, headers },
    );
  }
  const participation = faircoinHost ? faircoinParticipationRoute(url.pathname) : null;
  if (participation && url.pathname !== participation.apex) {
    return Response.redirect(new URL(participation.apex + url.search, url), 308);
  }
  // The approved apex routes reuse their real static document, including its
  // translated prose. Never send these public explanations through app-shell.
  const landingLocale = SUPPORTED_LOCALES.find((locale) => url.pathname === `/${locale}/`);
  const landingDocument =
    faircoinHost && (url.pathname === '/' || landingLocale)
      ? `${landingLocale ? `/${landingLocale}` : ''}/faircoin/`
      : null;
  let response = landingDocument
    ? await next(new Request(new URL(landingDocument, url), request))
    : participation && url.pathname === participation.apex
      ? await next(new Request(new URL(participation.document, url), request))
      : await next();
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;

  // `_redirects` ends in `/*  /404.html  404`, so an unknown path arrives here
  // as a 404. Some of those paths are real surfaces with no build-time document:
  // a signed-in dashboard, a profile, a Newsroom post published after the
  // deploy. Serving them from `_redirects` instead is what broke production once
  // already — a `200` rewrite rule is matched BEFORE the static asset, so a
  // `/newsroom/*` rule shadowed every prerendered Newsroom document. Upgrading
  // the 404 here cannot: by the time this runs, Cloudflare has already looked
  // for a document and not found one.
  let needsShell = response.status === 404 && isSpaFallbackPath(url.pathname);
  if (response.status === 404 && !needsShell) {
    const fallbackDocument = localizedFallbackDocument(participation?.document ?? url.pathname);
    if (fallbackDocument) {
      const document = await next(new Request(new URL(fallbackDocument, url), request));
      needsShell =
        document.status === 200 &&
        (document.headers.get('content-type') ?? '').includes('text/html');
    }
  }
  if (needsShell) {
    const shell = await next(new Request(new URL('/app-shell', url).toString(), request));
    if (shell.status === 200) {
      const headers = new Headers(shell.headers);
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      response = new Response(shell.body, { status: 200, statusText: 'OK', headers });
    }
  }

  // A Newsroom detail URL that reached the shell above has no document. That is
  // normal for a post published since the deploy, so ask the API which it is and
  // convert only an API-confirmed missing slug to a real 404. A backend failure
  // stays 200 rather than de-indexing a live article during an outage.
  const newsroomPath = matchNewsroomPostPath(url.pathname);
  if (newsroomPath && response.status === 200) {
    const html = await response.clone().text();
    if (!hasPrerenderedNewsroomPost(html)) {
      const exists = await newsroomPostExists(
        env.VITE_API_URL || DEFAULT_API_BASE,
        newsroomPath.slug,
        newsroomPath.locale,
      );
      if (exists === false) return asNotFound(response, html);
    }
  }

  // Oxy is the prerendered default — only FairCoin needs host-specific meta.
  if (brandForHost(url.hostname) !== 'faircoin') return response;

  try {
    const seoData = await fetchSeoData(
      env.VITE_API_URL || DEFAULT_API_BASE,
      url.pathname,
      'faircoin',
    );
    const meta = resolveSeoOrDefault(seoData, url.pathname, url.hostname);
    const participationTitle = (value: string) => value.replace(/ \| Oxy$/, ' | FairCoin');
    const setContent = (value: string) => ({
      element(el: Element) {
        el.setAttribute('content', value);
      },
    });
    let titleText = '';
    response = new HTMLRewriter()
      .on('title', {
        element(el) {
          if (!participation) el.setInnerContent(meta.title);
        },
        text(chunk) {
          if (participation) {
            titleText += chunk.text;
            chunk.replace(chunk.lastInTextNode ? participationTitle(titleText) : '');
            if (chunk.lastInTextNode) titleText = '';
          }
        },
      })
      .on('meta[name="description"]', participation ? {} : setContent(meta.description))
      .on(
        'meta[property="og:title"]',
        participation
          ? {
              element(el) {
                el.setAttribute('content', participationTitle(el.getAttribute('content') ?? ''));
              },
            }
          : setContent(meta.title),
      )
      .on('meta[property="og:description"]', participation ? {} : setContent(meta.description))
      .on('meta[property="og:url"]', setContent(meta.canonical))
      .on('meta[property="og:image"]', setContent(meta.ogImage))
      .on('meta[property="og:image:alt"]', setContent(meta.title))
      .on('meta[property="og:site_name"]', setContent(meta.siteName))
      .on(
        'meta[name="twitter:title"]',
        participation
          ? {
              element(el) {
                el.setAttribute('content', participationTitle(el.getAttribute('content') ?? ''));
              },
            }
          : setContent(meta.title),
      )
      .on('meta[name="twitter:description"]', participation ? {} : setContent(meta.description))
      .on('meta[name="twitter:image"]', setContent(meta.ogImage))
      .on('meta[name="twitter:image:alt"]', setContent(meta.title))
      .on('meta[name="twitter:site"], meta[property="og:locale:alternate"]', {
        element(el) {
          el.remove();
        },
      })
      .on('link[hreflang]', {
        element(el) {
          const href = participation && faircoinApexHref(el.getAttribute('href') ?? '');
          if (href) el.setAttribute('href', `https://fairco.in${href}`);
          else el.remove();
        },
      })
      .on('[data-faircoin-participation] a[href]', {
        element(el) {
          const href = faircoinApexHref(el.getAttribute('href') ?? '');
          if (href) el.setAttribute('href', href);
        },
      })
      .on('script#site-identity', {
        element(el) {
          el.setInnerContent(serializeStructuredData(buildSiteIdentity(url.hostname)), {
            html: true,
          });
        },
      })
      .on('link[rel="canonical"]', {
        element(el) {
          el.setAttribute('href', meta.canonical);
        },
      })
      // The prerendered home is Oxy's: its hero sits inside #root until the
      // bundle replaces it, and index.html preloads that image for every host.
      // On a FairCoin host both are someone else's page, so they never leave
      // the edge — a client-side hide would still download and flash them.
      .on('div.home-prerender-visual', {
        element(el) {
          el.remove();
        },
      })
      .on('link[rel="preload"][as="image"]', {
        element(el) {
          el.remove();
        },
      })
      .transform(response);
    return response;
  } catch (err) {
    // Never let a rewrite error break delivery — serve the original document.
    console.error('[seo-middleware] rewrite failed:', err);
    return response;
  }
};

export { onRequest };
