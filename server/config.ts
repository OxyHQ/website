import dotenv from 'dotenv'
dotenv.config()

function parseCsvEnv(value: string | undefined): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
}

function parsePositiveIntEnv(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  /**
   * Postgres connection string. Read here only so a missing value is reported
   * with the rest of the configuration; `db/postgres.ts` is what opens the pool.
   */
  databaseUrl: process.env.DATABASE_URL || '',
  oxyApiBase: process.env.OXY_API_BASE || 'https://api.oxy.so',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Canonical public origin used to build absolute URLs (sitemap, feeds).
  siteUrl: process.env.SITE_URL || 'https://oxy.so',
  // The locale served at the bare path; every other locale lives under
  // `/<code>/…`. Mirrors the SPA's static DEFAULT_LOCALE (src/lib/i18n/types.ts)
  // and must stay in sync with it — this is deliberately NOT the CMS-configured
  // default, which an editor can change without the route shape following.
  defaultLocale: process.env.DEFAULT_LOCALE || 'en',
  adminUserIds: parseCsvEnv(process.env.OXY_ADMIN_USER_IDS),
  githubToken: process.env.GITHUB_TOKEN || '',
  doApiToken: process.env.DO_API_TOKEN || '',
  featureBoard: {
    // Token used to CREATE issues and to WRITE priority labels in the tracked
    // repos, so it needs `issues: write` on every org the board covers. Kept
    // separate from `githubToken` (read-only release sync) so the write scope
    // is not handed to code that only ever reads, and it is deliberately not
    // named `GITHUB_*`: GitHub reserves that prefix for Actions secrets, so a
    // `GITHUB_`-prefixed name could never be provisioned through the repo
    // secret to SSM sync that feeds this service.
    githubToken: process.env.FEATURE_BOARD_GITHUB_TOKEN || '',
    // Durable per-user proposal quota. Counted from the FeatureProposal
    // collection, so it holds across instances and across restarts, unlike the
    // in-process burst limiter that sits in front of it.
    proposalsPerWindow: parsePositiveIntEnv(process.env.FEATURE_PROPOSAL_LIMIT, 5),
    proposalWindowHours: parsePositiveIntEnv(process.env.FEATURE_PROPOSAL_WINDOW_HOURS, 24),
    // Burst guard, per authenticated user, in front of the durable quota.
    proposalBurstPerMinute: parsePositiveIntEnv(process.env.FEATURE_PROPOSAL_BURST_PER_MINUTE, 2),
    // Raw JSON tier table; parsed and validated by `resolvePriorityTiers`.
    priorityTiers: process.env.FEATURE_PRIORITY_TIERS || '',
    priorityReconcileMinutes: parsePositiveIntEnv(process.env.FEATURE_PRIORITY_RECONCILE_MINUTES, 60),
    // Compute and report the label changes without sending them to GitHub.
    priorityDryRun: process.env.FEATURE_PRIORITY_DRY_RUN === 'true',
  },
  s3: {
    // Leave endpoint unset for native AWS S3; set AWS_ENDPOINT_URL for an S3-compatible
    // provider (e.g. DigitalOcean Spaces).
    endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    region: process.env.AWS_REGION || 'us-west-2',
    bucket: process.env.AWS_S3_BUCKET || 'oxy-oxy-api-media-usw2-237343248947',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    // Objects are written under this prefix; CloudFront origin path "/public" strips it back
    // off when serving. Empty for DO Spaces, where the CDN serves the bucket root.
    keyPrefix: process.env.AWS_S3_KEY_PREFIX || 'public/',
    // Public base URL fronting the bucket (AWS CloudFront: cloud.oxy.so).
    cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cloud.oxy.so',
  },
}
