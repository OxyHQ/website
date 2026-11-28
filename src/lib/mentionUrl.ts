/**
 * Mention's public origin.
 *
 * The product is moving from mention.earth to mention.org. Deploys set
 * `VITE_MENTION_URL`. The Mention landing calls to action are built from this
 * one value.
 */

const DEFAULT_MENTION_URL = 'https://mention.earth';

function configuredMentionUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const path = url.pathname.replace(/\/+$/, '');
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

/** A configured origin, or `https://mention.earth` when the value is empty or not http(s). */
export function resolveMentionUrl(value: unknown): string {
  return configuredMentionUrl(value) ?? DEFAULT_MENTION_URL;
}

/** Origin (and optional path) with no trailing slash. */
export const MENTION_URL = resolveMentionUrl(import.meta.env?.VITE_MENTION_URL);

function origin(base: string): string {
  return base.replace(/\/+$/, '');
}

/** Mention's home. The secondary landing action, "Explore the feed". */
export function mentionHomeUrl(base: string = MENTION_URL): string {
  return new URL('/', `${origin(base)}/`).toString();
}

/**
 * Mention signup. The landing calls to action use this, with the campaign
 * that attributes the visit to oxy.so.
 */
export function mentionSignupUrl(base: string = MENTION_URL): string {
  const url = new URL('/signup', `${origin(base)}/`);
  url.searchParams.set('utm_source', 'oxy.so');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', 'mention_landing');
  return url.toString();
}
