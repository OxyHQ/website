import mongoose, { Schema, type Document } from 'mongoose'

/**
 * One issue opened on GitHub through the website's proposal form.
 *
 * Two jobs. It is the audit trail for a public endpoint that writes to the
 * issue tracker (who asked for what, in which repo, and when), and it is the
 * durable half of the rate limit: the per-user quota is a count over this
 * collection, so it survives a restart and holds across every instance behind
 * the load balancer, which an in-process limiter cannot do.
 */
export interface IFeatureProposal extends Document {
  userId: string
  username: string
  owner: string
  repo: string
  issueNumber: number
  issueUrl: string
  title: string
  createdAt: Date
}

const FeatureProposalSchema = new Schema<IFeatureProposal>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  issueNumber: { type: Number, required: true },
  issueUrl: { type: String, required: true },
  title: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

// The quota query: proposals by one user since a cutoff.
FeatureProposalSchema.index({ userId: 1, createdAt: -1 })
// One row per issue, so a retry that raced a successful write cannot double up.
FeatureProposalSchema.index({ owner: 1, repo: 1, issueNumber: 1 }, { unique: true })

export const FeatureProposal = mongoose.model<IFeatureProposal>('FeatureProposal', FeatureProposalSchema)
