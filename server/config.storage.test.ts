/**
 * The website's legacy images move into their own R2 bucket (OxyHQ/oxy ADR
 * 0047). `config.s3` is chosen from the environment when the module loads, so
 * each case reads it in a fresh process.
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
  it('before the cutover: the S3 bucket, with the task role', () => {
    expect(storage({ AWS_S3_BUCKET: 'old' })).toMatchObject({
      bucket: 'old',
      region: 'us-west-2',
      legacy: null,
      hasCredentials: false,
      keyPrefix: 'public/',
    });
  });

  it('during the migration: its own R2 bucket, the S3 bucket kept for deletes', () => {
    expect(storage({ ...R2, AWS_S3_BUCKET: 'old' })).toMatchObject({
      bucket: 'oxy-website-legacy-media',
      region: 'auto',
      endpoint: R2.R2_ENDPOINT,
      hasCredentials: true,
      legacy: { bucket: 'old', region: 'us-west-2' },
      keyPrefix: 'public/',
      cdnBaseUrl: 'https://cloud.oxy.so',
    });
  });

  it('never reads AWS_ENDPOINT_URL for R2', () => {
    expect(storage({ ...R2, AWS_ENDPOINT_URL: 'https://elsewhere' })).toMatchObject({
      endpoint: R2.R2_ENDPOINT,
      legacy: null,
    });
  });

  it('refuses half an R2 configuration', () => {
    expect(storage({ R2_BUCKET: 'oxy-website-legacy-media' })).toHaveProperty('error');
  });
});
