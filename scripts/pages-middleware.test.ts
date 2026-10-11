import { expect, test } from 'bun:test';
import { onRequest } from '../functions/_middleware';

test('static assets pass through the Pages middleware untouched', async () => {
  const response = new Response('original asset', {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
  const request = new Request('https://oxy.so/assets/private-test-name.png');
  const result = await onRequest({
    request,
    env: {},
    next: async () => response,
  } as unknown as Parameters<typeof onRequest>[0]);
  expect(result).toBe(response);
  expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000');
  expect(await result.text()).toBe('original asset');
});
