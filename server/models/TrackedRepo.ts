import mongoose, { Document, Schema } from 'mongoose'

interface ITrackedRepo extends Document {
  owner: string
  repo: string
  displayName: string
  defaultTags: Array<{ label: string; color: string }>
  lastSyncAt: Date | null
  lastSyncError: string | null
  active: boolean
}

const TrackedRepoSchema = new Schema<ITrackedRepo>(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    displayName: { type: String, required: true },
    defaultTags: [{ label: String, color: String }],
    lastSyncAt: { type: Date, default: null },
    lastSyncError: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

TrackedRepoSchema.index({ owner: 1, repo: 1 }, { unique: true })

export default mongoose.model<ITrackedRepo>('TrackedRepo', TrackedRepoSchema)
