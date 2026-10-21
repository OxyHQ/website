import { expect, test } from 'bun:test';
import express from 'express';
import { createApp } from './app.js';
import { disabledMcpCatalogRegistrationStatus } from './services/mcpCatalogRegistration.js';

/* `req.ip` is the real client behind the ALB, with or without the Cloudflare
   proxy in front of it; the help feedback and sales limiters key on it. The probe
   takes the `trust proxy` setting `createApp` leaves on its app, so it fails if
   `createApp` stops setting it, and listens on loopback, which plays the ALB (a
   private socket peer). */

const CLIENT = '203.0.113.7';
const CLOUDFLARE_EDGE = '172.70.1.2';

async function ipSeenFor(forwardedFor: string): Promise<string | undefined> {
  const app = createApp({
    catalogRegistrationStatus: () => disabledMcpCatalogRegistrationStatus(),
  });
  const probe = express();
  probe.set('trust proxy', app.get('trust proxy'));
  probe.get('/ip', (req, res) => {
    res.json({ ip: req.ip });
  });
  const server = probe.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Probe did not bind');
    const response = await fetch(`http://127.0.0.1:${address.port}/ip`, {
      headers: { 'X-Forwarded-For': forwardedFor },
    });
    return ((await response.json()) as { ip?: string }).ip;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('req.ip is the client on a DNS-only hostname (the ALB appended the client)', async () => {
  expect(await ipSeenFor(CLIENT)).toBe(CLIENT);
});

test('req.ip is the client, not the Cloudflare edge, on a proxied hostname', async () => {
  expect(await ipSeenFor(`${CLIENT}, ${CLOUDFLARE_EDGE}`)).toBe(CLIENT);
});

test('req.ip ignores an address the caller wrote into the header itself', async () => {
  expect(await ipSeenFor(`198.51.100.1, ${CLIENT}`)).toBe(CLIENT);
});
