import mongoose, { Schema, Types, type Document } from 'mongoose'

export interface IBanner {
  text: string
  href: string
  visible: boolean
}

export interface ISiteSettings extends Document {
  siteTitle: string
  siteDescription: string
  ogImage: Types.ObjectId | null
  banner?: IBanner
}

const BannerSchema = new Schema<IBanner>({
  text: { type: String, required: true },
  href: { type: String, default: '#' },
  visible: { type: Boolean, default: false },
}, { _id: false })

const SiteSettingsSchema = new Schema<ISiteSettings>({
  siteTitle: { type: String, default: 'Oxy' },
  siteDescription: { type: String, default: '' },
  ogImage: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  banner: BannerSchema,
}, { timestamps: true })

export const SiteSettings = mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)
