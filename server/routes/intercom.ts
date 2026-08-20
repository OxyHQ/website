import { createHmac } from 'node:crypto'
import { timingSafeEqual } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { and, count, eq, gte } from 'drizzle-orm'
import { z } from 'zod'
import { oxy, requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'
import { db } from '../db/postgres.js'
import { featureProposals } from '../db/schema/index.js'
import { getStatusSnapshot } from './status.js'
import { listFeatureRepos, findFeatureRepo, createFeatureIssue, GitHubApiError, clearFeatureIssueCache } from '../services/featureBoard.js'
import { buildProposalIssueBody, sanitizeProposalBody, sanitizeProposalTitle, BODY_MIN_LENGTH, BODY_MAX_LENGTH, TITLE_MIN_LENGTH, TITLE_MAX_LENGTH } from '../utils/proposalText.js'
import { validate } from '../utils/validate.js'

const router = Router()

const INTERCOM_ISSUER = 'oxy-website'
const INTERCOM_AUDIENCE = 'intercom-data-connector'

interface IntercomClaims {
  user_id: string
  email?: string
  name?: string
  iat: number
  exp: number
  iss: string
  aud: string
}

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

function decodeJsonPart<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

function verifyIntercomToken(token: string, secret: string): IntercomClaims | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const header = decodeJsonPart<{ alg?: string; typ?: string }>(parts[0])
  const payload = decodeJsonPart<Partial<IntercomClaims>>(parts[1])
  if (header?.alg !== 'HS256' || header.typ !== 'JWT' || !payload) return null
  if (payload.iss !== INTERCOM_ISSUER || payload.aud !== INTERCOM_AUDIENCE) return null
  if (typeof payload.user_id !== 'string' || payload.user_id.length === 0 || payload.user_id.length > 200) return null
  if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now || payload.iat > now + 60 || payload.exp - payload.iat > 10 * 60) return null

  const expected = createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest()
  const actual = Buffer.from(parts[2], 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  return payload as IntercomClaims
}

function readBearerToken(req: Request): string | null {
  const header = req.header('authorization')
  if (!header) return null
  const match = /^Bearer\s+([^\s]+)$/i.exec(header)
  return match?.[1] ?? null
}

function requireConnectorClaims(req: Request, res: Response): IntercomClaims | null {
  const secret = config.intercomMessengerSecret
  const token = readBearerToken(req)
  const claims = secret && token ? verifyIntercomToken(token, secret) : null
  if (claims) return claims
  res.status(401).json({ error: 'Valid Intercom customer authentication is required' })
  return null
}

function connectorError(res: Response, error: unknown, fallback: string) {
  if (error instanceof GitHubApiError && error.status === 503) {
    res.status(503).json({ error: 'This action is temporarily unavailable' })
    return
  }
  console.error(`[intercom] ${fallback}:`, error instanceof Error ? error.message : error)
  res.status(502).json({ error: fallback })
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
    iss: INTERCOM_ISSUER,
    aud: INTERCOM_AUDIENCE,
  }

  if (user.email?.trim()) payload.email = user.email.trim()
  const name = getDisplayName(user)
  if (name) payload.name = name

  res.setHeader('Cache-Control', 'no-store')
  res.json({ token: signJwt(payload, secret) })
})

const serviceStatusQuerySchema = z.object({
  service_id: z.string().min(1).max(120).optional(),
}).passthrough()

const featureProposalSchema = z.object({
  confirmed: z.literal(true),
  app: z.string().min(3).max(120),
  title: z.string().min(1).max(TITLE_MAX_LENGTH * 2),
  body: z.string().min(1).max(BODY_MAX_LENGTH * 2),
}).passthrough()

/**
 * Fin connector: return the minimum account context needed for support.
 * The user id comes from the verified JWT, never from connector input.
 */
router.get('/connectors/account-context', async (req, res) => {
  const claims = requireConnectorClaims(req, res)
  if (!claims) return

  try {
    const user = await oxy.getUserById(claims.user_id)
    const displayName = typeof user.name?.displayName === 'string' ? user.name.displayName : user.username
    res.set('Cache-Control', 'no-store').json({
      user: {
        id: user.id,
        username: user.username,
        name: displayName,
        email: user.email ?? null,
        createdAt: user.createdAt ?? null,
      },
      account: {
        kind: user.kind ?? null,
        type: user.type ?? null,
      },
      privacy: {
        isPrivateAccount: user.privacySettings?.isPrivateAccount ?? null,
        showActivity: user.privacySettings?.showActivity ?? null,
      },
    })
  } catch (error) {
    connectorError(res, error, 'Unable to load account context')
  }
})

/** Fin connector: answer current Oxy service health questions. */
router.get('/connectors/service-status', async (req, res) => {
  const claims = requireConnectorClaims(req, res)
  if (!claims) return
  void claims

  try {
    const query = validate(serviceStatusQuerySchema, req.query)
    const snapshot = await getStatusSnapshot()
    if (!query.service_id) return res.json(snapshot)

    const service = snapshot.services.find((item) => item.id.toLowerCase() === query.service_id?.toLowerCase())
    if (!service) return res.status(404).json({ error: 'Service not found in the public status board' })
    res.json({ generatedAt: snapshot.generatedAt, overall: snapshot.overall, service })
  } catch (error) {
    connectorError(res, error, 'Unable to load service status')
  }
})

/** Fin connector: list the currently enabled Feature Board destinations. */
router.get('/connectors/feature-apps', async (req, res) => {
  const claims = requireConnectorClaims(req, res)
  if (!claims) return
  void claims

  try {
    const repos = await listFeatureRepos()
    res.json({
      apps: repos.map((repo) => ({ ...repo, acceptsProposals: repo.acceptsProposals })),
    })
  } catch (error) {
    connectorError(res, error, 'Unable to load feature board apps')
  }
})

/**
 * Fin connector: create a Feature Board proposal only after Fin collected an
 * explicit confirmation. It shares the board's allow-list, sanitizers and
 * durable per-user quota with the website form.
 */
router.post('/connectors/feature-proposal', async (req, res) => {
  const claims = requireConnectorClaims(req, res)
  if (!claims) return

  const input = validate(featureProposalSchema, req.body)
  const title = sanitizeProposalTitle(input.title)
  const body = sanitizeProposalBody(input.body)
  if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
    return res.status(400).json({ error: `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters` })
  }
  if (body.length < BODY_MIN_LENGTH || body.length > BODY_MAX_LENGTH) {
    return res.status(400).json({ error: `Description must be between ${BODY_MIN_LENGTH} and ${BODY_MAX_LENGTH} characters` })
  }

  const [owner, repo] = input.app.split('/')
  if (!owner || !repo) return res.status(400).json({ error: 'Choose a valid Feature Board app' })

  try {
    const target = await findFeatureRepo(owner, repo)
    if (!target) return res.status(404).json({ error: 'That app is not on the Feature Board' })
    if (!target.acceptsProposals) return res.status(409).json({ error: `${target.displayName} is not accepting proposals` })

    const windowStart = new Date(Date.now() - config.featureBoard.proposalWindowHours * 60 * 60 * 1000)
    const [existing] = await db
      .select({ issueNumber: featureProposals.issueNumber, issueUrl: featureProposals.issueUrl })
      .from(featureProposals)
      .where(and(
        eq(featureProposals.userId, claims.user_id),
        eq(featureProposals.title, title),
        gte(featureProposals.createdAt, windowStart),
      ))
      .limit(1)
    if (existing) {
      return res.json({
        ok: true,
        duplicate: true,
        issueNumber: existing.issueNumber,
        issueUrl: existing.issueUrl,
        app: { key: target.key, displayName: target.displayName },
      })
    }

    const [usage] = await db
      .select({ value: count() })
      .from(featureProposals)
      .where(and(eq(featureProposals.userId, claims.user_id), gte(featureProposals.createdAt, windowStart)))
    if (Number(usage?.value ?? 0) >= config.featureBoard.proposalsPerWindow) {
      return res.status(429).json({ error: 'Feature proposal limit reached for this account' })
    }

    const username = claims.name?.trim() || claims.user_id
    const created = await createFeatureIssue(target, {
      title,
      body: buildProposalIssueBody(body, {
        username,
        userId: claims.user_id,
        boardUrl: `${config.siteUrl}/features`,
      }),
    })

    await db.insert(featureProposals).values({
      userId: claims.user_id,
      username,
      owner: target.owner,
      repo: target.repo,
      issueNumber: created.number,
      issueUrl: created.htmlUrl,
      title,
    })
    clearFeatureIssueCache()

    res.status(201).json({
      ok: true,
      issueNumber: created.number,
      issueUrl: created.htmlUrl,
      app: { key: target.key, displayName: target.displayName },
    })
  } catch (error) {
    connectorError(res, error, 'The feature proposal could not be created')
  }
})

export default router
