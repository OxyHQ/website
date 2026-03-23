import mongoose, { Schema, type Document } from 'mongoose'

export interface IMcpToken extends Document {
  name: string
  tokenHash: string
  createdBy: string
  lastUsedAt?: Date
  expiresAt?: Date
  revoked: boolean
  createdAt: Date
  updatedAt: Date
}

const mcpTokenSchema = new Schema<IMcpToken>(
  {
    name: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    createdBy: { type: String, required: true },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const McpToken = mongoose.model<IMcpToken>('McpToken', mcpTokenSchema)
