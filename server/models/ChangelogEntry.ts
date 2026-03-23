import mongoose, { Schema, type Document } from 'mongoose'

export interface IChangelogEntry extends Document {
  title: string
  content: string
  tags: string[]
  date: Date
  items?: string[]
  media?: string
  githubReleaseId?: number
  repoOwner?: string
  repoName?: string
  repoDisplayName?: string
  htmlUrl?: string
  tagName?: string
}

const ChangelogEntrySchema = new Schema<IChangelogEntry>({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tags: [String],
  date: { type: Date, required: true },
  items: [String],
  media: String,
  githubReleaseId: { type: Number, unique: true, sparse: true },
  repoOwner: String,
  repoName: String,
  repoDisplayName: String,
  htmlUrl: String,
  tagName: String,
}, { timestamps: true })

ChangelogEntrySchema.index({ repoOwner: 1, repoName: 1, date: -1 })

export const ChangelogEntry = mongoose.model<IChangelogEntry>('ChangelogEntry', ChangelogEntrySchema)
