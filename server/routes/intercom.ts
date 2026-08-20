import { createHmac } from 'node:crypto'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'

const router = Router()

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const unsignedToken = `${header}.${encodedPayload}`
  const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url')
  return `${unsignedToken}.${signature}`
}

function getDisplayName(user: NonNullable<Express.Request['user']>): string | undefined {
  const name = user.name
  if (typeof name === 'string' && name.trim()) return name.trim()
  if (name && typeof name === 'object' && 'displayName' in name) {
    const displayName = (name as { displayName?: unknown }).displayName
    if (typeof displayName === 'string' && displayName.trim()) return displayName.trim()
  }
  return user.username?.trim() || undefined
}

router.get('/user-jwt', requireAuth, (req, res) => {
  const secret = config.intercomMessengerSecret
  if (!secret) {
    res.status(503).json({ error: 'Intercom user authentication is not configured' })
    return
  }

  const user = req.user
  const userId = user?.id?.trim() || user?._id?.trim()
  if (!userId) {
    res.status(401).json({ error: 'Authenticated user has no stable id' })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const payload: Record<string, unknown> = {
    user_id: userId,
    iat: now,
    exp: now + 10 * 60,
  }

  if (user.email?.trim()) payload.email = user.email.trim()
  const name = getDisplayName(user)
  if (name) payload.name = name

  res.setHeader('Cache-Control', 'no-store')
  res.json({ token: signJwt(payload, secret) })
})

export default router
