import mongoose, { Schema, type Document } from 'mongoose'

export interface IChangelogEntry extends Document {
  title: string
  content: string
  tags: string[]
  date: Date
  items?: string[]
  media?: string
}

const ChangelogEntrySchema = new Schema<IChangelogEntry>({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tags: [String],
  date: { type: Date, required: true },
  items: [String],
  media: String,
}, { timestamps: true })

export const ChangelogEntry = mongoose.model<IChangelogEntry>('ChangelogEntry', ChangelogEntrySchema)
