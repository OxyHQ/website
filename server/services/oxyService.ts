import { OxyServices } from '@oxy.so/core'
import { config } from '../config.js'

/**
 * The website's Oxy service identity. Oxy answers MCP token introspection only
 * for the application that registered the resource, so this one credential
 * registers the catalog, introspects MCP tokens and calls Clarity.
 */
export const oxyService = new OxyServices({ baseURL: config.oxyApiBase })
if (config.oxyServiceApiKey && config.oxyServiceApiSecret) {
  oxyService.configureServiceAuth(config.oxyServiceApiKey, config.oxyServiceApiSecret)
}
