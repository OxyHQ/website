import mongoose, { Schema, type Document } from 'mongoose'

/**
 * Per-route SEO, the single source of truth for page metadata. One document per
 * (brand, path). `path: '*'` is the brand-level default used when a route has no
 * specific entry. Consumed by the client `<SEO>` component, the prerender, and
 * the edge middleware (so oxy.so and fairco.in each get their own meta without
 * any hardcoded strings).
 */
export type SeoBrand = 'oxy' | 'faircoin'

export interface ISeo extends Document {
  brand: SeoBrand
  /** Canonical path (e.g. `/pricing`), or `*` for the brand default. */
  path: string
  title: string
  description: string
  /** Root-relative (`/og-faircoin.png`) or absolute URL. Empty = brand default. */
  ogImage: string
}

const SeoSchema = new Schema<ISeo>(
  {
    brand: { type: String, enum: ['oxy', 'faircoin'], required: true, index: true },
    path: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    ogImage: { type: String, default: '' },
  },
  { timestamps: true },
)

SeoSchema.index({ brand: 1, path: 1 }, { unique: true })

export const Seo = mongoose.model<ISeo>('Seo', SeoSchema)
