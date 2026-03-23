import mongoose, { Schema, type Document } from 'mongoose'

export interface IFooterLink {
  label: string
  href: string
  isNew?: boolean
  isExternal?: boolean
}

export interface IFooterColumn {
  title: string
  links: IFooterLink[]
}

export interface ISocialLink {
  label: string
  icon: string
  href: string
}

export interface IFooter extends Document {
  columns: IFooterColumn[]
  socialLinks: ISocialLink[]
  copyright: string
}

const FooterLinkSchema = new Schema<IFooterLink>({
  label: { type: String, required: true },
  href: { type: String, required: true },
  isNew: Boolean,
  isExternal: Boolean,
}, { _id: false })

const FooterColumnSchema = new Schema<IFooterColumn>({
  title: { type: String, required: true },
  links: [FooterLinkSchema],
}, { _id: false })

const SocialLinkSchema = new Schema<ISocialLink>({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  href: { type: String, required: true },
}, { _id: false })

const FooterSchema = new Schema<IFooter>({
  columns: [FooterColumnSchema],
  socialLinks: [SocialLinkSchema],
  copyright: { type: String, default: '' },
}, { timestamps: true })

export const Footer = mongoose.model<IFooter>('Footer', FooterSchema)
