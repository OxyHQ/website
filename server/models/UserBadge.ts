import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserBadge extends Document {
  userId: string
  username: string
  badgeId: string
  awardedAt: Date
  awardedBy: string | null
  metadata: Record<string, unknown>
}

const UserBadgeSchema = new Schema<IUserBadge>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  badgeId: { type: String, required: true },
  awardedAt: { type: Date, default: Date.now },
  awardedBy: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
})

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true })
UserBadgeSchema.index({ userId: 1 })

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema)
