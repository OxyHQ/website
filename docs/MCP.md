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
- **Adding a tool** means a `server.tool(...)` in `server/mcp.ts` and a row in
  `MCP_TOOL_ACCESS`. The boot fails if either is missing.
