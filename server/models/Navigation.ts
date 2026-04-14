import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface INavItem {
  title: string
  description: string
  href: string
  icon?: string
  image?: Types.ObjectId | null
  section?: string
  showGrid?: boolean
}

export interface ISidePanelLink {
  label: string
  href: string
}

export interface INavDropdown extends Document {
  label: string
  items: INavItem[]
  sidePanel?: { heading: string; links: ISidePanelLink[] }
  order: number
}

const NavItemSchema = new Schema<INavItem>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  href: { type: String, required: true },
  icon: String,
  image: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  section: String,
  showGrid: { type: Boolean, default: true },
}, { _id: false })

const SidePanelLinkSchema = new Schema<ISidePanelLink>({
  label: { type: String, required: true },
  href: { type: String, required: true },
}, { _id: false })

const NavigationSchema = new Schema<INavDropdown>({
  label: { type: String, required: true },
  items: [NavItemSchema],
  sidePanel: {
    heading: String,
    links: [SidePanelLinkSchema],
  },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export const Navigation = mongoose.model<INavDropdown>('Navigation', NavigationSchema)
