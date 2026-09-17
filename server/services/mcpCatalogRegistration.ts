import type { AppCapabilityCatalog } from '@oxy.so/contracts'
import type { OxyServices } from '@oxy.so/core'

const MAX_ATTEMPTS = 6
const MAX_DELAY_MS = 60_000

/**
 * Register the MCP catalog with Oxy, which is what makes Oxy recognise
 * `website-api.oxy.so/mcp` as a resource it can issue tokens for.
 *
 * Runs after `listen()` and never throws: an Oxy outage at boot must not take
 * the site down, it only delays MCP sign-in until a retry lands. Registering an
 * unchanged catalog is harmless — Oxy keeps one active registration per app.
 */
export async function registerMcpCatalog(input: {
  catalog: AppCapabilityCatalog
  oxy: OxyServices
  oxyApiBase: string
}): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${input.oxyApiBase}/capabilities/catalogs/register`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${await input.oxy.getServiceToken()}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ catalog: input.catalog, deployedAt: new Date().toISOString() }),
        signal: AbortSignal.timeout(15_000),
      })
      if (response.ok) {
        console.log(`[mcp] registered capability catalog ${input.catalog.version} (${input.catalog.tools.length} tools)`)
        return
      }
      // The body names the refusal (a scope the credential lacks, a schema the
      // API rejected); a 4xx other than 401/429 will not fix itself on retry.
      const detail = (await response.text().catch(() => '')).slice(0, 500)
      if (response.status === 401) input.oxy.invalidateServiceToken()
      if (response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 429) {
        console.error(`[mcp] catalog registration refused (status=${response.status}): ${detail}`)
        return
      }
      console.error(`[mcp] catalog registration failed (status=${response.status}, attempt ${attempt}): ${detail}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error)
      console.error(`[mcp] catalog registration failed (attempt ${attempt}): ${message}`)
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(5_000 * 2 ** (attempt - 1), MAX_DELAY_MS)))
    }
  }
}
