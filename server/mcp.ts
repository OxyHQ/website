import type express from 'express'
import { createCatalogMcpHttpService } from '@oxy.so/mcp'
import { config } from './config.js'
import { oxyService } from './services/oxyService.js'
import { authorize, handlers, WEBSITE_MCP_CATALOG } from './mcp/catalog.js'

/* ──────────────────────────────────────────────
 * The website's MCP endpoint.
 *
 * Tools are declared by domain under `server/mcp/tools/`, compiled into the Oxy
 * capability catalog and dispatched in `server/mcp/catalog.ts`; who may call
 * what is `server/mcpAccess.ts`. This file mounts the stateless transport.
 * ──────────────────────────────────────────── */

export { invokeTool, WEBSITE_MCP_CATALOG, WEBSITE_MCP_TOOL_NAMES } from './mcp/catalog.js'
export type { ToolContext } from './mcp/registry.js'

/** Browser clients that may call the endpoint directly; server-side connectors send no Origin. */
const CLAUDE_ORIGINS = ['https://claude.ai', 'https://www.claude.ai', 'https://api.anthropic.com']

/**
 * Sign-in is Oxy's MCP OAuth: every request carries a short-lived token Oxy
 * issued for this exact resource, checked live against Oxy on each call. The
 * transport is stateless — every task behind the load balancer can answer
 * every request, so there is no session to lose between them.
 */
const service = createCatalogMcpHttpService({
  catalog: WEBSITE_MCP_CATALOG,
  handlers,
  authorize,
  authorizationServer: config.oxyApiBase,
  getServiceToken: () => oxyService.getServiceToken(),
  invalidateServiceToken: () => oxyService.invalidateServiceToken(),
  allowedOrigins: [...CLAUDE_ORIGINS, ...config.mcp.allowedOrigins],
  serverName: 'oxy-website',
  logger: { error: (message, error) => console.error(`[mcp] ${message}:`, error) },
})

export function mountMcp(app: express.Express) {
  // Mounted before express.json(): the transport reads the raw body itself.
  app.all('/mcp', (req, res) => {
    void service.handleMcp(req, res)
  })
  // RFC 9728 places a path-bearing resource's metadata under its path; the bare
  // well-known path is served too for clients that look there first.
  app.all([service.protectedResourceMetadataPath, '/.well-known/oauth-protected-resource'], (req, res) => {
    service.handleProtectedResourceMetadata(req, res)
  })
}
