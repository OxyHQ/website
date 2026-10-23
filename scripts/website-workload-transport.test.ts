import { test, expect } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('website catalog and Clarity SDK use their workload audiences and one shared auth refresh', () => {
  const result = spawnSync(
    'bun',
    [fileURLToPath(new URL('./fixtures/website-workload-probe.ts', import.meta.url))],
    {
      encoding: 'utf8',
      timeout: 15000,
      env: process.env,
    },
  );
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
  expect(result.stdout).toBe('WEBSITE_WORKLOAD_OK\n');
}, 20000);
