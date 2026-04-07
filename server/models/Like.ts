import mongoose, { Schema, type Document } from 'mongoose'

export interface ILike extends Document {
  targetType: 'newsroom' | 'changelog'
  targetId: string
  userId: string
  username: string
  createdAt: Date
}

const LikeSchema = new Schema<ILike>({
  targetType: { type: String, enum: ['newsroom', 'changelog'], required: true },
  targetId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

LikeSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true })
LikeSchema.index({ targetType: 1, targetId: 1 })

export const Like = mongoose.model<ILike>('Like', LikeSchema)
