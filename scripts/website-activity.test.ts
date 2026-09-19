import { describe, expect, test } from 'bun:test'
import { startWebsiteActivity } from '../server/services/ecosystemActivity'
import type { createEcosystemTraffic } from '@oxy.so/core/server'

describe('website activity bootstrap', () => {
  test('does not start a publisher when credentials are absent and rejects an incomplete credentialed configuration', () => {
    const create = () => { throw new Error('must not run') }
    expect(startWebsiteActivity(() => true, {}, create)).toBeUndefined()
    expect(startWebsiteActivity(() => true, { OXY_SERVICE_API_KEY: 'fixture' }, create)).toBeUndefined()
    expect(() => startWebsiteActivity(() => true, { OXY_SERVICE_API_KEY: 'fixture', OXY_SERVICE_API_SECRET: 'fixture' }, create)).toThrow('credentials')
  })
  test('installs observation once at boot with actual readiness, independent of dashboard requests', () => {
    let installations = 0
    let ready = false
    const create = ((options) => {
      expect(options.service).toBe('website')
      expect(options.region).toBe('us-west-2')
      expect(options.ready?.()).toBe(false)
      ready = true
      expect(options.ready?.()).toBe(true)
      return { installFetch() { installations++ } } as ReturnType<typeof createEcosystemTraffic>
    }) as typeof createEcosystemTraffic
    startWebsiteActivity(() => ready, { AWS_REGION: 'us-west-2', OXY_SERVICE_API_KEY: 'fixture', OXY_SERVICE_API_SECRET: 'fixture' }, create)
    expect(installations).toBe(1)
  })
})
