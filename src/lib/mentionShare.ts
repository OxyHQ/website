/**
 * Helpers for building Mention compose-intent deep links.
 *
 * Mention exposes a Twitter-style intent endpoint at
 * `https://mention.earth/compose` that pre-fills the composer with text, a
 * URL, hashtags, and an optional `via @handle` attribution. Full parameter
 * reference: `packages/frontend/docs/INTENT_URL.md` in the Mention repo.
 *
 * This module keeps the URL construction in one place so every "Share with
 * Mention" / "Discuss on Mention" surface stays consistent and properly
 * encoded.
 */

/** Base intent URL — all share buttons point at this single endpoint. */
const MENTION_COMPOSE_URL = 'https://mention.earth/compose'

export interface MentionShareParams {
  /** Pre-filled body text. */
  text?: string
  /** URL appended to the body. http/https only — Mention rejects anything else. */
  url?: string
  /** Hashtags (no leading `#` needed — Mention adds it). Empty entries dropped. */
  hashtags?: readonly string[]
  /** Handle for `via @handle` attribution. No leading `@` — Mention strips it. */
  via?: string
}

/**
 * Build a Mention compose-intent URL with the given pre-fill params.
 *
 * Each value is URL-encoded via the native `URLSearchParams` API. Empty /
 * whitespace-only values are dropped so the resulting URL stays clean
 * (`?text=` style noise never reaches the composer).
 */
export function buildMentionComposeUrl(params: MentionShareParams): string {
  const search = new URLSearchParams()

  const text = params.text?.trim()
  if (text) search.set('text', text)

  const url = params.url?.trim()
  if (url) search.set('url', url)

  if (params.hashtags && params.hashtags.length > 0) {
    const tags = params.hashtags
      .map((tag) => tag.trim().replace(/^#+/, ''))
      .filter((tag) => tag.length > 0)
    if (tags.length > 0) search.set('hashtags', tags.join(','))
  }

  const via = params.via?.trim().replace(/^@+/, '')
  if (via) search.set('via', via)

  const query = search.toString()
  return query ? `${MENTION_COMPOSE_URL}?${query}` : MENTION_COMPOSE_URL
}
