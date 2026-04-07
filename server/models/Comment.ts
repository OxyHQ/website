import mongoose, { Schema, type Document } from 'mongoose'

export interface IComment extends Document {
  targetType: 'newsroom' | 'changelog' | 'feature_request'
  targetId: string
  parentId: mongoose.Types.ObjectId | null
  userId: string
  username: string
  body: string
  status: 'visible' | 'hidden' | 'deleted'
  editedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>({
  targetType: { type: String, enum: ['newsroom', 'changelog', 'feature_request'], required: true },
  targetId: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, default: null },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  body: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['visible', 'hidden', 'deleted'], default: 'visible' },
  editedAt: { type: Date, default: null },
}, { timestamps: true })

CommentSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: 1 })
CommentSchema.index({ parentId: 1 })
CommentSchema.index({ userId: 1 })

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)
