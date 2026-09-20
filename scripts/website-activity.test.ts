import { describe, expect, mock, test } from 'bun:test'
import type { createEcosystemTraffic } from '@oxy.so/core/server'

/**
 * `canAttestWorkloadIdentity` is mocked rather than driven through its real
 * environment variable, because the real one is set by ECS and by nothing else:
 * a test that arranged `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` would be
 * asserting this suite's idea of how the SDK detects a task role rather than
 * what the website does with the answer.
 */
let attestable = false
mock.module('@oxy.so/core/server', () => ({
  canAttestWorkloadIdentity: () => attestable,
  createEcosystemTraffic: () => { throw new Error('must not run') },
}))

const { startWebsiteActivity } = await import('../server/services/ecosystemActivity')

describe('website activity bootstrap', () => {
  test('does not start a publisher without a usable identity, and a half credential is not one', () => {
    attestable = false
    const create = () => { throw new Error('must not run') }
    expect(startWebsiteActivity(() => true, {}, create)).toBeUndefined()
    expect(startWebsiteActivity(() => true, { OXY_SERVICE_API_KEY: 'fixture' }, create)).toBeUndefined()
    expect(startWebsiteActivity(() => true, { OXY_SERVICE_API_SECRET: 'fixture' }, create)).toBeUndefined()
  })

  test('still refuses to boot without a region once it HAS an identity', () => {
    attestable = false
    const create = () => { throw new Error('must not run') }
    expect(() => startWebsiteActivity(() => true, { OXY_SERVICE_API_KEY: 'fixture', OXY_SERVICE_API_SECRET: 'fixture' }, create)).toThrow('AWS_REGION')
  })

  /**
   * The case the key check got wrong. A deployed task carries no pair at all —
   * it attests its ECS task role — and the old gate read that as "no
   * credentials" and returned, which is indistinguishable from a quiet day on
   * the dashboard.
   */
  test('starts on an attestable task role with no key pair anywhere', () => {
    attestable = true
    let installations = 0
    const create = (() => ({ installFetch() { installations++ } }) as ReturnType<typeof createEcosystemTraffic>) as typeof createEcosystemTraffic
    expect(startWebsiteActivity(() => true, { AWS_REGION: 'us-west-2' }, create)).toBeDefined()
    expect(installations).toBe(1)
  })

  test('installs observation once at boot with actual readiness, independent of dashboard requests', () => {
    attestable = false
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
