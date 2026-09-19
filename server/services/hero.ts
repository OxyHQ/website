import { heroContents, media } from '../db/schema/index.js'
import { db } from '../db/postgres.js'
import { populateOne } from '../db/refs.js'
import {
  DEFAULT_HERO_BG_MP4,
  DEFAULT_HERO_BG_WEBM,
  DEFAULT_HERO_POSTER,
  DEFAULT_HERO_TITLE,
} from '../constants/hero.js'

/* ──────────────────────────────────────────────
 * The homepage hero singleton, read by the REST route and the MCP tools.
 *
 * A read never writes. When the table is empty the shipped defaults are
 * returned as a value with `_id: null` — the row itself is created by the
 * first update (`upsertSingleton`) or by the seed, never as a side effect of
 * somebody looking.
 * ──────────────────────────────────────────── */

/** The three media fields, which may hold a Media `_id` or a static URL. */
export const HERO_MEDIA_FIELDS = ['backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster'] as const

/** A media field value that is a Media `_id` rather than a static URL. */
export function isMediaId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)
}

export function defaultHero(): Record<string, unknown> {
  return {
    _id: null,
    title: DEFAULT_HERO_TITLE,
    backgroundVideoWebm: DEFAULT_HERO_BG_WEBM,
    backgroundVideoMp4: DEFAULT_HERO_BG_MP4,
    backgroundPoster: DEFAULT_HERO_POSTER,
    createdAt: null,
    updatedAt: null,
  }
}

/** Resolves the media fields that hold ids, leaving static URLs untouched. */
export async function withHeroMedia(hero: Record<string, unknown>): Promise<Record<string, unknown>> {
  const populated = { ...hero }
  for (const field of HERO_MEDIA_FIELDS) {
    const value = populated[field]
    if (!isMediaId(value)) continue
    const resolved = await populateOne({ ref: value }, { ref: media })
    populated[field] = resolved?.ref ?? value
  }
  return populated
}

/** The stored hero, or the shipped defaults when there is none yet. */
export async function readHero(): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(heroContents).limit(1)
  return row ?? defaultHero()
}
