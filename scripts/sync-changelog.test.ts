import { expect, test } from 'bun:test';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execPath, env } from 'node:process';

const advertisement = '001e# service=git-upload-pack\n00000000';
async function runSync(status: number, type: string, body: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'website-changelog-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    const output = path.join(root, 'src/content/_changelog/index.json');
    await mkdir(path.dirname(output), { recursive: true });
    const previous = JSON.stringify({ entries: [{ tagName: 'previous-release' }] });
    await writeFile(output, previous);
    await copyFile(
      path.join(import.meta.dir, 'sync-changelog.ts'),
      path.join(root, 'scripts/sync.ts'),
    );
    await writeFile(
      path.join(root, 'fetch.ts'),
      `globalThis.fetch = async (url, options) => {
  if (String(url).includes('/info/refs?')) {
    if (options?.headers?.Authorization || options?.headers?.Cookie || options?.credentials !== 'omit')
      throw new Error('Visibility must remain anonymous');
    if (String(url).includes('/example/first.git/'))
      return new Response(${JSON.stringify(advertisement)}, {headers:{'content-type':'application/x-git-upload-pack-advertisement'}});
    return new Response(${JSON.stringify(body)}, {status:${status}, headers:{'content-type':${JSON.stringify(type)}}});
  }
  if (options?.headers?.Authorization !== 'Bearer fixture-token') throw new Error('Release fetch should use its token');
  if (String(url).includes('/example/second/releases') && ${status !== 200}) throw new Error('Fetched private releases');
  return Response.json([]);
};`,
    );
    const child = Bun.spawn([execPath, '--preload', './fetch.ts', './scripts/sync.ts'], {
      cwd: root,
      env: {
        ...env,
        CHANGELOG_REPOS: 'example/first,example/second',
        GITHUB_TOKEN: 'fixture-token',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [code, error] = await Promise.all([child.exited, new Response(child.stderr).text()]);
    return { code, error, previous, output: await readFile(output, 'utf8') };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

for (const [label, status, type, body] of [
  ['rate limit', 403, 'application/json', '{}'],
  ['partial response', 206, 'application/x-git-upload-pack-advertisement', advertisement],
  ['HTML with status 200', 200, 'text/html', '<html>Login</html>'],
  ['invalid Git preamble', 200, 'application/x-git-upload-pack-advertisement', 'not Git'],
] as const) {
  test(`failed public verification (${label}) preserves the previous changelog`, async () => {
    const result = await runSync(status, type, body);
    expect(result.code).not.toBe(0);
    expect(result.error).toContain('Preserving the previous index');
    expect(result.output).toBe(result.previous);
  });
}
for (const status of [401, 404]) {
  test(`private repository (${status}) never has its releases fetched`, async () => {
    const result = await runSync(status, 'text/plain', 'Not found');
    expect(result.code).toBe(0);
    expect(JSON.parse(result.output).entries).toEqual([]);
  });
}
test('valid anonymous Git discovery permits the authenticated release request', async () => {
  const result = await runSync(200, 'application/x-git-upload-pack-advertisement', advertisement);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.output).entries).toEqual([]);
});
