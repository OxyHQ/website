import type http from 'node:http'
import { createApp } from '../app.js'
import { config } from '../config.js'
import { disabledMcpCatalogRegistrationStatus } from '../services/mcpCatalogRegistration.js'

/* One app per test process, on `config.port`, so the public-read bridge (which
   calls 127.0.0.1:config.port) reaches it from any test file. Never closed:
   the process ends with the run. */

let server: http.Server | null = null

export async function ensureApp(): Promise<http.Server> {
  if (server) return server
  const app = createApp({ catalogRegistrationStatus: () => disabledMcpCatalogRegistrationStatus() })
  const started = app.listen(config.port)
  await new Promise<void>((resolve) => started.once('listening', resolve))
  started.unref()
  server = started
  return started
}
