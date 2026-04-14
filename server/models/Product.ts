import mongoose, { Schema, type Document, type Types } from 'mongoose'

export type ProductLifecycle = 'live' | 'in-development'

export interface IProduct extends Document {
  /** Stable URL-safe id used as primary lookup key. */
  productId: string
  name: string
  tagline: string
  description: string
  /** Canonical destination URL — the actual running app / external URL. */
  href: string
  /** Optional local landing page on oxy.so (e.g. "/inbox", "/astro"). When set, /products card and navbar link here first. */
  landingUrl?: string
  /** Optional URL to probe for /status health checks. Defaults to `href`. */
  healthUrl?: string
  external: boolean
  cta: string
  /** Hex brand color for the card accent strip + icon mark */
  brand: string
  brandForeground?: string
  /** Single-letter fallback when no logo is set. */
  mark: string
  /** Media ref for the app icon / logo. Takes precedence over `mark`. */
  logo?: Types.ObjectId | null
  /** Category ObjectId ref used by /products, /status, and the Ecosystem navbar dropdown. */
  category?: Types.ObjectId | null
  /** Legacy string slug kept for seed compatibility and as a fallback when category ref is unset. */
  section: string
  /** Lifecycle bucket on /products — live vs in-development. */
  lifecycle: ProductLifecycle
  /** Show on the /products page. */
  showOnProducts: boolean
  /** Probe on /status. */
  showOnStatus: boolean
  /** Show in the ecosystem navbar dropdown. */
  showInNav: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  href: { type: String, required: true },
  landingUrl: { type: String },
  healthUrl: { type: String },
  external: { type: Boolean, default: false },
  cta: { type: String, default: 'Learn more' },
  brand: { type: String, required: true },
  brandForeground: { type: String },
  mark: { type: String, required: true },
  logo: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  section: { type: String, default: 'apps' },
  lifecycle: { type: String, enum: ['live', 'in-development'], default: 'live' },
  showOnProducts: { type: Boolean, default: true },
  showOnStatus: { type: Boolean, default: true },
  showInNav: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

ProductSchema.index({ lifecycle: 1, section: 1, order: 1 })
ProductSchema.index({ showOnStatus: 1 })
ProductSchema.index({ showInNav: 1 })

export const Product = mongoose.model<IProduct>('Product', ProductSchema)
