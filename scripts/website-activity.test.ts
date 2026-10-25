import { describe, expect, test } from 'bun:test';
import type { createEcosystemTraffic } from '@oxy.so/core/server';
import { startWebsiteActivity } from '../server/services/ecosystemActivity';

describe('website activity bootstrap', () => {
  test('starts with a lazy workload provider rather than a key or ECS environment gate', () => {
    let installations = 0;
    let ready = false;
    const create = ((options) => {
      expect(options.service).toBe('website');
      expect(options.region).toBe('us-west-2');
      expect(options.workloadCredentials).toBeFunction();
      expect(options.ready?.()).toBe(false);
      ready = true;
      expect(options.ready?.()).toBe(true);
      return {
        installFetch() {
          installations++;
        },
      } as ReturnType<typeof createEcosystemTraffic>;
    }) as typeof createEcosystemTraffic;
    startWebsiteActivity(() => ready, { AWS_REGION: 'us-west-2' }, create);
    expect(installations).toBe(1);
  });
});
