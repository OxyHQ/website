import mongoose, { Schema, type Document } from 'mongoose'

export interface IVote extends Document {
  featureRequestId: string
  userId: string
  createdAt: Date
}

const VoteSchema = new Schema<IVote>({
  featureRequestId: { type: String, required: true },
  userId: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

VoteSchema.index({ featureRequestId: 1, userId: 1 }, { unique: true })
VoteSchema.index({ userId: 1 })

export const Vote = mongoose.model<IVote>('Vote', VoteSchema)
