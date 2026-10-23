import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { CLARITY_SERVICE_AUDIENCE } from '@clarity.surf/sdk/server';
import type { AppCapabilityCatalog } from '@oxy.so/contracts';

// The local issuer fixture validates request wiring; no AWS/network credentials are used.
delete process.env.AWS_PROFILE;
delete process.env.AWS_DEFAULT_PROFILE;
process.env.AWS_ACCESS_KEY_ID = 'ASIA_TEST';
process.env.AWS_SECRET_ACCESS_KEY = 'fixture';
process.env.AWS_SESSION_TOKEN = 'fixture';
process.env.AWS_CREDENTIAL_EXPIRATION = new Date(Date.now() + 3600000).toISOString();
process.env.AWS_REGION = 'us-west-2';
process.env.R2_BUCKET = 'fixture';
process.env.R2_ENDPOINT = 'http://127.0.0.1:9';
process.env.R2_ACCESS_KEY_ID = 'fixture';
process.env.R2_SECRET_ACCESS_KEY = 'fixture';
const minted: { audience: string; protocolVersion: number; scopes?: unknown }[] = [];
const calls: { path: string; audience: string; body: string }[] = [];
let rejectCatalog = true;
const server = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  res.setHeader('content-type', 'application/json');
  if (req.url?.endsWith('/challenge')) return res.end('{"nonce":"fixture"}');
  if (req.url?.endsWith('/workload')) {
    const exchange = { audience: 'oxy-api', ...JSON.parse(body) };
    minted.push(exchange);
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      type: 'service',
      authority: 'first_party',
      appId: 'website',
      credentialId: 'wl_website',
      ownerAccountId: 'owner',
      environment: 'development',
      iss: 'oxy-auth',
      iat: now,
      exp: now + 300,
      aud: exchange.audience,
      nonce: minted.length,
    };
    return res.end(
      JSON.stringify({
        token: `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`,
        expiresIn: 300,
      }),
    );
  }
  assert.equal(req.headers.cookie, undefined);
  const payload = req.headers.authorization?.slice(7).split('.')[1];
  assert.ok(payload);
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  calls.push({ path: req.url ?? '', audience: claims.aud, body });
  if (req.url === '/capabilities/catalogs/register') {
    if (rejectCatalog) {
      rejectCatalog = false;
      res.writeHead(401);
      return res.end('{"error":"expired"}');
    }
    return res.end('{"registration":{}}');
  }
  if (req.url === '/v1/jobs/search') return res.end('{"data":[],"mode":"lexical"}');
  throw new Error(`Unexpected path ${req.url}`);
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
process.env.OXY_API_BASE = origin;
process.env.CLARITY_API_URL = origin;
const { oxyService, oxyTransport } = await import('../../server/services/oxyService');
const { createMcpCatalogRegistration } = await import(
  '../../server/services/mcpCatalogRegistration'
);
const { listCareerJobs, closeCareerJobsClient } = await import('../../server/services/careers');
try {
  const registration = createMcpCatalogRegistration({
    catalog: { appId: 'website', version: 'fixture', tools: [] } as unknown as AppCapabilityCatalog,
    transport: oxyTransport,
    oxyApiBase: origin,
    deps: { log: () => undefined, error: () => undefined },
  });
  await registration.start();
  assert.equal(registration.status().state, 'registered');
  assert.equal(registration.status().attempts, 1);
  assert.deepEqual(await listCareerJobs(), []);
  assert.deepEqual(
    calls.map(({ path, audience }) => ({ path, audience })),
    [
      { path: '/capabilities/catalogs/register', audience: 'oxy-api' },
      { path: '/capabilities/catalogs/register', audience: 'oxy-api' },
      { path: '/v1/jobs/search', audience: CLARITY_SERVICE_AUDIENCE },
    ],
  );
  assert.equal(calls[0]?.body, calls[1]?.body);
  assert.ok(
    minted.every(({ protocolVersion, scopes }) => protocolVersion === 2 && scopes === undefined),
  );
  assert.equal(minted.length, 3);
  process.stdout.write('WEBSITE_WORKLOAD_OK\n');
} finally {
  closeCareerJobsClient();
  oxyTransport.dispose();
  oxyService.dispose();
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
