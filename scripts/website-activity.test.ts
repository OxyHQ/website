import { describe, expect, test } from 'bun:test'
import { startWebsiteActivity } from '../server/services/ecosystemActivity'
import type { createEcosystemTraffic } from '@oxy.so/core/server'

describe('website activity bootstrap', () => {
  test('does not start a publisher when disabled and rejects incomplete enabled configuration', () => {
    const create = () => { throw new Error('must not run') }
    expect(startWebsiteActivity(() => true, {}, create)).toBeUndefined()
    expect(() => startWebsiteActivity(() => true, { OXY_ECOSYSTEM_ACTIVITY_ENABLED: 'true' }, create)).toThrow('credentials')
    expect(() => startWebsiteActivity(() => true, { OXY_ECOSYSTEM_ACTIVITY_ENABLED: 'yes' }, create)).toThrow('true or false')
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
    startWebsiteActivity(() => ready, { OXY_ECOSYSTEM_ACTIVITY_ENABLED: 'true', AWS_REGION: 'us-west-2', OXY_SERVICE_API_KEY: 'fixture', OXY_SERVICE_API_SECRET: 'fixture' }, create)
    expect(installations).toBe(1)
  })
})
