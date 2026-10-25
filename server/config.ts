// `.env` is loaded by Bun itself (the server and every script run on Bun)
// before any module runs; a variable the shell already set wins.

function parseCsvEnv(value: string | undefined): string[] {
  return (
    value
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function parsePositiveIntEnv(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  /**
   * Postgres connection string. Read here only so a missing value is reported
   * with the rest of the configuration; `db/postgres.ts` is what opens the pool.
   */
  databaseUrl: process.env.DATABASE_URL || '',
  oxyApiBase: process.env.OXY_API_BASE || 'https://api.oxy.so',
  /**
   * Clarity Jobs, the only source of the careers page. Oxy's openings are
   * authored in Mention and indexed by Clarity; this site stores none of them.
   */
  clarity: {
    apiUrl: process.env.CLARITY_API_URL || 'https://api.clarity.surf',
    /** The employer name Clarity's `employers` filter matches exactly. */
    careersEmployer: process.env.CAREERS_EMPLOYER?.trim() || 'Oxy',
    /**
     * Where Oxy publishes its openings. Both filters apply together, so a
     * listing elsewhere that merely calls its employer "Oxy" never lands on
     * oxy.so.
     */
    careersSourceDomains: parseCsvEnv(process.env.CAREERS_SOURCE_DOMAINS ?? 'mention.earth'),
  },
  mcp: {
    /**
     * The MCP endpoint's canonical URL. Oxy binds every access token to it, so
     * it must match the host clients connect to exactly.
     */
    resource:
      process.env.MCP_RESOURCE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://website-api.oxy.so/mcp'
        : `http://localhost:${process.env.PORT || '4000'}/mcp`),
    /** Browser origins allowed to call the endpoint, on top of Claude's. */
    allowedOrigins: parseCsvEnv(process.env.MCP_ALLOWED_ORIGINS),
    /**
     * Cost units one account may spend per minute across every task (a read
     * costs 1, a write 5, an upload, bulk upload or sync 25). Counted in
     * Postgres, so the limit holds however many tasks serve the endpoint.
     */
    rateLimitPerMinute: parsePositiveIntEnv(process.env.MCP_RATE_LIMIT_PER_MINUTE, 600),
  },
  // Server-only secret used to sign Intercom Messenger JWTs for authenticated
  // Oxy users. It is optional so visitors keep working before the workspace
  // security setting and production secret are enabled.
  intercomMessengerSecret: process.env.INTERCOM_MESSENGER_SECRET || '',
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
    priorityReconcileMinutes: parsePositiveIntEnv(
      process.env.FEATURE_PRIORITY_RECONCILE_MINUTES,
      60,
    ),
    // Compute and report the label changes without sending them to GitHub.
    priorityDryRun: process.env.FEATURE_PRIORITY_DRY_RUN === 'true',
  },
  statusHistory: {
    // How often the background job snapshots the live /status probe cache into
    // daily uptime rollups, and how long those rollups are kept.
    snapshotIntervalMinutes: parsePositiveIntEnv(process.env.STATUS_HISTORY_INTERVAL_MINUTES, 5),
    retentionDays: parsePositiveIntEnv(process.env.STATUS_HISTORY_RETENTION_DAYS, 90),
  },
  /**
   * Oxy Files (ADR 0043): every image and video the site stores is a file the
   * Oxy Website application owns. `services/oxyService.ts` authenticates the
   * workload through Oxy's shared AWS provider; own calls need no OAuth scopes.
   * File ownership and reference authorization remain enforced.
   * `docs/OXY-FILES.md` is the procedure.
   */
  oxyFiles: {
    /** Where Oxy serves public files: `<cloudUrl>/<fileId>[?variant=…]`. */
    cloudUrl: process.env.OXY_CLOUD_URL || 'https://cloud.oxy.so',
    /**
     * The signing secret of this application's file-events endpoint, shown once
     * when the endpoint is set in the console. Without it every event but the
     * endpoint's verification challenge is answered 503, so Oxy retries it.
     */
    webhookSecret: process.env.OXY_FILES_WEBHOOK_SECRET?.trim() || '',
    /** How often a task reconciles the site's references with Oxy (one task runs it at a time). */
    reconcileIntervalHours: parsePositiveIntEnv(process.env.OXY_FILES_RECONCILE_HOURS, 24),
  },
  /**
   * The storage the site wrote to before Oxy Files: objects under
   * `public/oxy-website/`, served from `cdnBaseUrl/oxy-website/…`. Read by the
   * migration and by deletes of rows not yet migrated, and written only for an
   * SVG an Oxy API without ADR 0043 stage 4c refuses (`services/oxyFiles.ts`).
   * Retired by `docs/OXY-FILES.md`.
   *
   * Their own Cloudflare R2 bucket, `oxy-website-legacy-media` (OxyHQ/oxy ADR
   * 0047), through a token scoped to that one bucket: R2_BUCKET, R2_ENDPOINT,
   * R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY. Never through AWS_ENDPOINT_URL /
   * AWS_ACCESS_KEY_ID: the CloudWatch and activity clients read those too.
   */
  s3: storageConfig(),
};

function storageConfig() {
  const bucket = process.env.R2_BUCKET?.trim() ?? '';
  const endpoint = process.env.R2_ENDPOINT?.trim() ?? '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? '';
  const missing = Object.entries({
    R2_BUCKET: bucket,
    R2_ENDPOINT: endpoint,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
  })
    .filter(([, value]) => value === '')
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`The legacy media store needs ${missing.join(', ')}`);
  }
  return {
    endpoint,
    // R2 has one region; `auto` is what its S3 API expects.
    region: 'auto',
    bucket,
    credentials: { accessKeyId, secretAccessKey },
    // Objects are under this prefix; the CDN prepends it when serving.
    keyPrefix: 'public/',
    cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cloud.oxy.so',
  };
}
