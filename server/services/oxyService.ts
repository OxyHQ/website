import { OxyServer } from '@oxy.so/core/server'
import { config } from '../config.js'

/**
 * The website's Oxy service identity. Oxy answers MCP token introspection only
 * for the application that registered the resource, so this one credential
 * registers the catalog, introspects MCP tokens and calls Clarity.
 */
export const oxyService = new OxyServer({
  baseURL: config.oxyApiBase,
  ...(config.oxyServiceApiKey && config.oxyServiceApiSecret
    ? { serviceAuth: { apiKey: config.oxyServiceApiKey, apiSecret: config.oxyServiceApiSecret } }
    : {}),
})
