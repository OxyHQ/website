import { config } from '../../config.js'
import type { ToolRegistrar } from '../registry.js'
import { ok, ToolError } from '../results.js'

/* What this connection can do, and whether the MCP service is healthy. Both
   are safe for every account: they describe the catalog and the service, not
   site content, and carry no personal data. */

export function registerDiscoveryTools(server: ToolRegistrar): void {
  server.tool('describe_access', 'Describe what this connection can do: whether the acting account is a website admin, the scopes granted, and every tool grouped by domain with whether it is available to this account, whether it writes, whether it accepts an idempotency key, whether a plain repeat is safe, how to undo it, and the input limits. Call this first instead of discovering permissions by trial and error.', {}, async (_input, context) => {
    const { describeAccess } = await import('../catalog.js')
    return ok(describeAccess(context))
  })

  server.tool('get_mcp_status', 'Report whether the MCP service is healthy on the task answering: database readiness, capability catalog registration with Oxy (state, version, hash, last error) and the configured authorization server. Contains no secrets.', {}, async (_input, context) => {
    const response = await fetch(`http://127.0.0.1:${config.port}/api/mcp/status`, {
      headers: { accept: 'application/json' },
      signal: context.signal ? AbortSignal.any([context.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new ToolError('service_unavailable', `The status endpoint answered ${response.status}`)
    return ok(await response.json())
  })
}
