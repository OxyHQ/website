# MCP server

`website-api.oxy.so/mcp` exposes the site's content tools (newsroom, pages, jobs,
team, products, Academy, help, pricing, locales, media and the rest) to MCP
clients such as Claude. Code: `server/mcp.ts` (tools, catalog, transport) and
`server/mcpAccess.ts` (who may call what).

## Connecting

Add a custom connector with the URL `https://website-api.oxy.so/mcp` and let the
client sign in (in claude.ai: **Iniciar sesión / Sign in**, client registration
automatic). The client discovers Oxy from the 401 challenge and the metadata at
`/.well-known/oauth-protected-resource/mcp`, and the person approves the
connection on auth.oxy.so. There are no API tokens to create or paste.

## Who can do what

| Account | Tools |
| --- | --- |
| Listed in `OXY_ADMIN_USER_IDS` | every tool, as before |
| Any other Oxy account | reads only, answered from the public REST route |

A non-admin read is not a filtered copy of the admin query: the tool requests the
site's own `/api/...` route with no credentials, so it returns exactly what an
anonymous visitor receives. A read with no public route (`list_media`,
`list_pages`, translations, referrals, tracked repos) is admin-only, and a filter
the public route does not implement (drafts, changelog search, course level) is
refused rather than silently dropped.

The acting account is the connection's active account — the one Oxy reports on
introspection — so a connection that holds several accounts is judged on the one
it is acting as.

## How it is wired

- **Stateless transport.** Every request carries its token and is checked live
  against Oxy (`/auth/mcp/oauth/introspect`), so any ECS task can answer any
  request. The previous in-memory sessions broke whenever a follow-up request
  landed on the other task.
- **Catalog registration.** Oxy only issues tokens for a resource some catalog
  declares. In production the API registers `WEBSITE_MCP_CATALOG` at boot
  (`server/services/mcpCatalogRegistration.ts`) with its service credential,
  which needs the `catalogs:write` scope and the `catalog:website` capability on
  the **Oxy Website** application (`OxyHQServices` seed specs). It keeps
  retrying a registry outage with capped, jittered backoff (honouring
  `Retry-After`) until it lands, stops on a configuration refusal (a 4xx other
  than 401/408/429), and never re-registers once registered. Oxy keeps the last
  successful registration as the active one, so an old task still retrying
  during a deploy can reactivate the older catalog — compare `catalogHash`
  across tasks if MCP sign-in misbehaves after a deploy.
- **Status.** `GET /api/mcp/status` (public, no secrets) reports database
  readiness, the registration state, catalog version and hash, attempts, last
  success and a sanitized last error. It never affects `/api/health`.
- **Public docs** live in `src/content/mcp/`; `scripts/mcp-docs.test.ts` fails
  the build if they describe the retired static-token architecture outside a
  migration section.
- **Layout.** `server/mcp.ts` mounts the transport. Tools are declared by domain
  in `server/mcp/tools/*.ts` (listed in `tools/index.ts`), compiled into the
  catalog and dispatched by `server/mcp/catalog.ts`; shared input building blocks
  are `server/mcp/schemas.ts`, write patterns `server/mcp/writes.ts`, locale
  overlays `server/mcp/localized.ts`, errors `server/mcp/results.ts`. Business
  rules shared with REST live in `server/services/` (slugs, locales, media,
  translations, hero, newsroom).
- **Adding a tool** means a `server.tool(name, description, shape, handler,
  options)` in its domain file, a row in `MCP_TOOL_ACCESS` and, for a write, a
  row in `MCP_WRITE_EFFECTS`. The boot fails if any is missing. Then run
  `bun server/scripts/generate-mcp-tool-reference.ts`: `server/mcp/reference.test.ts`
  fails while `src/content/mcp/tools.mdx` disagrees with the catalog.

## Contracts a tool must keep

- **Errors.** A handler throws (or returns `toolError(e)`); `server/mcp/results.ts`
  turns it into `isError: true` with a stable `code` (`invalid_request`,
  `not_found`, `permission_denied`, `conflict`, `idempotency_conflict`,
  `precondition_failed`, `request_too_large`, `rate_limited`,
  `service_unavailable`, `internal_error`), a message and `retryable`. An
  unexpected failure is logged in full under a `reference` and answered
  generically — never a stack, SQL or storage detail. Services shared with REST
  throw `DomainError` (`server/utils/domainError.ts`) and each surface maps its
  `kind`.
- **Actor.** Handlers receive `ToolContext.actorId`, the authenticated active
  account. Audit fields (`uploadedBy`, the `[mcp:audit]` log line) come from it,
  never from input; editorial fields such as a post's `oxyUserId` may name
  someone else and default to the actor.
- **Effects.** `MCP_WRITE_EFFECTS` is declared per tool, not derived from the
  name. `idempotency: 'supported'` is Oxy's contract for "accepts an
  idempotency key" (the contract refuses a write without it), and every write
  does: `idempotencyKey` is added to its schema and `server/mcp/idempotency.ts`
  commits the write and its record in one transaction under an advisory lock, so
  a retry on any task replays the result and a changed input with the same key
  is an `idempotency_conflict`. `repeatSafe` records whether a repeat WITHOUT a
  key is harmless. `rollback: 'manual'` must name the real `undo` tool.
  Limitation: `@oxy.so/mcp` maps `idempotency !== 'none'` to MCP's
  `idempotentHint`, which for a create is only true when a key is sent.
- **One output contract.** A tool declares `outputSchema` (and `output: 'items'`
  for an array, sent as `{ items }`); admin and reader results are validated
  against the same schema. Lists take `page` (≥1) and `limit` (1–100, default
  20); newsroom listings are summaries unless `view: 'full'`.
- **Reader semantics.** A reader's read goes to the public route. A filter it
  cannot express (`status`, `featured: false`, `active: false`, admin filters)
  throws `PublicReadRefused` in `mcpAccess.ts` → `permission_denied`. A tool
  with `localized: true` takes `locale`; an unknown locale is `invalid_request`
  on both paths, and admins get the same `applyTranslations` overlay readers do.
- **Concurrency and previews.** Updates take `expectedUpdatedAt`, checked inside
  the UPDATE (`writes.ts`, millisecond precision) → `precondition_failed` with
  the current value. Deletes and whole-list replaces take `dryRun`, which runs
  the same lookup and precondition and writes nothing; deleting a document also
  deletes its translations in the same unit of work.
- **Translations** (`services/translations.ts`): the document must exist, the
  locale must be configured and not the default, and only content columns can
  be overridden (identity, state, ordering, references and dates are refused),
  with the column's type. `upsert_translation` merges by default; `mode:
  'replace'` and `removeFields` are explicit.
- **Discovery.** `describe_access` lists every tool with availability for the
  acting account and its options; `get_mcp_status` reads `/api/mcp/status`.
- **Reads never write.** `get_hero` returns the shipped defaults (`_id: null`)
  when the table is empty rather than inserting.
- **Slugs** (`server/services/slugs.ts`): generated from the title when omitted,
  claimed by the unique index itself (numbered, then random suffix); an explicit
  slug is never rewritten — a collision is a `conflict`.
- **Locales** (`server/services/locales.ts`, shared with REST): every
  default-changing operation is one transaction under an advisory lock, and
  exactly one enabled default always remains. Other tasks see a change within
  the locale cache TTL (10 s).
- **Media** (`server/services/media.ts`, shared with REST delete): uploads are
  validated from the bytes (JPEG, PNG, GIF, WebP, AVIF; no SVG; 25 MiB, 40 MP),
  reuse an identical existing object, and attach to their target in the same
  transaction as the media row; a failure compensates only the objects that call
  uploaded. An object key can be shared by several rows, so nothing deletes a key
  still in use. A delete refuses media still referenced unless `force`, and a
  storage delete that fails is recorded in `storage_cleanups` and swept.
- **Diagnostics.** `debug_upload_test` exists only with
  `MCP_ENABLE_DIAGNOSTICS=true`, and cleans up its row and object in `finally`.

## Tests

`bun run test:server` runs the server suite against a real PostgreSQL
(`TEST_DATABASE_URL`, local host, database name containing `test` — it is wiped
between tests). Object storage and remote downloads are in-memory doubles
(`server/test/setup.ts`). `server/mcp/http.test.ts` drives the real Express app
with a fake Oxy introspection endpoint: CORS, host, body limit, revoked/expired/
wrong-resource tokens, scopes and the active account. CI runs it in
`.github/workflows/server-tests.yml` for any change under `server/`.
