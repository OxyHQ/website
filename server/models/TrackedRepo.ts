import mongoose, { Document, Schema } from 'mongoose'

/**
 * A GitHub repository the website knows about.
 *
 * One row feeds two independent surfaces, each with its own switch:
 *
 * - `active` gates the changelog release sync (`services/githubSync.ts`). It is
 *   the older of the two flags and means "sync this repo's releases", nothing
 *   more.
 * - `featureBoard` gates the public feature board: whether this repo's
 *   `feature-request` issues are listed at /features, whether votes may be cast
 *   on them, and whether its priority labels are reconciled. It doubles as the
 *   owner allow-list, which is why adding an org to the board is a data change
 *   and never a code change.
 * - `acceptsProposals` additionally lets signed-in visitors open an issue here
 *   from the website. Separate from `featureBoard` because listing a repo needs
 *   only read access, while writing to it needs the token to have `issues:
 *   write` there and the maintainers to want unsolicited issues at all.
 */
export interface ITrackedRepo extends Document {
  owner: string
  repo: string
  displayName: string
  defaultTags: Array<{ label: string; color: string }>
  lastSyncAt: Date | null
  lastSyncError: string | null
  active: boolean
  featureBoard: boolean
  acceptsProposals: boolean
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
    // Both default to false so a repo added for changelog sync never joins the
    // public board, or starts accepting public issues, by accident.
    featureBoard: { type: Boolean, default: false },
    acceptsProposals: { type: Boolean, default: false },
  },
  { timestamps: true }
)

TrackedRepoSchema.index({ owner: 1, repo: 1 }, { unique: true })

export default mongoose.model<ITrackedRepo>('TrackedRepo', TrackedRepoSchema)
