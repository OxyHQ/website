/**
 * The website's legacy images live in their own R2 bucket (OxyHQ/oxy ADR 0047)
 * and nowhere else. `config.s3` is read when the module loads, so each case
 * reads it in a fresh process.
 */
import { describe, expect, it } from 'bun:test';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function storage(env: Record<string, string>) {
  const script = `const { config } = await import('./server/config.ts'); const { credentials, ...rest } = config.s3; console.log('RESULT ' + JSON.stringify({ ...rest, hasCredentials: Boolean(credentials) }));`;
  const out = spawnSync('bun', ['-e', script], {
    cwd: path.resolve(import.meta.dir, '..'),
    env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', ...env },
    encoding: 'utf8',
  });
  const line = out.stdout.split('\n').find((text) => text.startsWith('RESULT '));
  return line ? JSON.parse(line.slice('RESULT '.length)) : { error: out.stderr };
}

const R2 = {
  R2_BUCKET: 'oxy-website-legacy-media',
  R2_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
  R2_ACCESS_KEY_ID: 'id',
  R2_SECRET_ACCESS_KEY: 'secret',
};

describe('the legacy images store', () => {
  it('is its own R2 bucket, served from cloud.oxy.so under public/', () => {
    expect(storage(R2)).toEqual({
      endpoint: R2.R2_ENDPOINT,
      region: 'auto',
      bucket: 'oxy-website-legacy-media',
      keyPrefix: 'public/',
      cdnBaseUrl: 'https://cloud.oxy.so',
      hasCredentials: true,
    });
  });

  it('never reads AWS_ENDPOINT_URL or an S3 bucket', () => {
    expect(
      storage({ ...R2, AWS_ENDPOINT_URL: 'https://elsewhere', AWS_S3_BUCKET: 'old' }),
    ).toMatchObject({
      endpoint: R2.R2_ENDPOINT,
      bucket: 'oxy-website-legacy-media',
    });
  });

  it('refuses half an R2 configuration', () => {
    expect(storage({ R2_BUCKET: 'oxy-website-legacy-media' })).toHaveProperty('error');
  });
});
