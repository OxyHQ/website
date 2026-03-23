import mongoose, { Schema, type Document } from 'mongoose'

export interface ISection {
  type: string
  heading?: string
  subheading?: string
  content?: string
  items?: any[]
  order: number
}

export interface IPage extends Document {
  slug: string
  title: string
  description: string
  sections: ISection[]
}

const SectionSchema = new Schema<ISection>({
  type: { type: String, required: true },
  heading: String,
  subheading: String,
  content: String,
  items: [Schema.Types.Mixed],
  order: { type: Number, default: 0 },
}, { _id: false })

const PageSchema = new Schema<IPage>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  sections: [SectionSchema],
}, { timestamps: true })

export const Page = mongoose.model<IPage>('Page', PageSchema)
