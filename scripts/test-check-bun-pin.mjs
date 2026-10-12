#!/usr/bin/env bun

/**
 * Mutation-tests `check-bun-pin.mjs`.
 *
 * Each case breaks exactly one thing in a scratch repository (a real
 * `git init`, so the gate's real file listing runs) and requires the gate to
 * fail naming it. The controls that must PASS matter as much: a gate that fired
 * on a correct tree would be disabled by whoever hit it first.
 */

import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkBunPin } from './check-bun-pin.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let failed = 0;

function report(name, ok, detail = '') {
  if (ok) {
    console.log(`  ok   ${name}`);
    return;
  }
  failed += 1;
  console.error(`  FAIL ${name}${detail ? `\n       ${detail}` : ''}`);
}

const manifest = (packageManager) =>
  `${JSON.stringify(packageManager === undefined ? { name: 'x' } : { name: 'x', packageManager })}\n`;

const workflow = (setup = '        with:\n          bun-version-file: package.json\n') =>
  'on: pull_request\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n' +
  '      - uses: actions/checkout@v4\n' +
  `      - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6\n${setup}` +
  '      - run: bun install --frozen-lockfile\n';

const GOOD = {
  'package.json': manifest('bun@1.4.3'),
  Dockerfile: 'FROM oven/bun:1.4.3-alpine\nRUN bun install --frozen-lockfile\n',
  '.github/workflows/ci.yml': workflow(),
};

async function runAgainst(overrides) {
  const files = { ...GOOD, ...overrides };
  const root = await mkdtemp(join(tmpdir(), 'bun-pin-'));
  try {
    for (const [path, contents] of Object.entries(files)) {
      if (contents === null) continue;
      const absolute = join(root, path);
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, contents, 'utf8');
    }
    execFileSync('git', ['init', '-q'], { cwd: root });
    execFileSync('git', ['add', '-A'], { cwd: root });
    try {
      return { result: await checkBunPin({ root }) };
    } catch (error) {
      return { error };
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/** The gate must fail, with one failure whose text matches `pattern`. */
async function expectFailure(name, overrides, pattern) {
  const { result, error } = await runAgainst(overrides);
  const messages = error ? [error.message] : (result?.failures ?? []);
  report(
    name,
    messages.length > 0 && messages.some((m) => pattern.test(m)),
    messages.length ? messages.join('; ') : 'the gate passed',
  );
}

async function expectPass(name, overrides) {
  const { result, error } = await runAgainst(overrides);
  report(
    name,
    !error && result.failures.length === 0,
    error ? error.message : result.failures.join('; '),
  );
}

console.log('check-bun-pin self-test\n');

await expectPass('control: pin, image and setup-bun agree', {});
await expectPass('control: a literal setup-bun version equal to the pin passes', {
  '.github/workflows/ci.yml': workflow("        with:\n          bun-version: '1.4.3'\n"),
});
await expectPass('control: COPY --from and an ARG-built tag at the pin pass', {
  Dockerfile:
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a literal Dockerfile/workflow placeholder, not a template
    'ARG BUN_VERSION=1.4.3\nFROM oven/bun:${BUN_VERSION}-alpine AS a\nFROM node:22\nCOPY --from=oven/bun:1.4.3-alpine /usr/local/bin/bun /usr/local/bin/bun\n',
});

// --- the pin itself ---------------------------------------------------------
await expectFailure(
  'no packageManager fails',
  { 'package.json': manifest(undefined) },
  /must pin `packageManager`/,
);
await expectFailure(
  'a range in packageManager fails',
  { 'package.json': manifest('bun@^1.4.3') },
  /must pin/,
);

// --- the image --------------------------------------------------------------
await expectFailure(
  'an image on another bun fails',
  { Dockerfile: 'FROM oven/bun:1.4.2-alpine\n' },
  /Dockerfile:1 uses oven\/bun:1\.4\.2-alpine, but package\.json pins bun@1\.4\.3/,
);
await expectFailure(
  'packageManager moved but the image did not',
  { 'package.json': manifest('bun@1.4.4') },
  /oven\/bun:1\.4\.3-alpine, but package\.json pins bun@1\.4\.4/,
);
await expectFailure(
  'an untagged image fails',
  { Dockerfile: 'FROM oven/bun\n' },
  /oven\/bun:latest/,
);
await expectFailure(
  'a stage behind --platform is still checked',
  { Dockerfile: 'FROM --platform=linux/arm64 oven/bun:1.5.0 AS b\n' },
  /oven\/bun:1\.5\.0/,
);
await expectFailure(
  'a later stage on another bun fails even when the first agrees',
  { Dockerfile: 'FROM oven/bun:1.4.3-alpine AS a\nFROM oven/bun:1.3.14-alpine\n' },
  /Dockerfile:2 uses oven\/bun:1\.3\.14-alpine/,
);
await expectFailure(
  'COPY --from another bun fails',
  { Dockerfile: 'FROM node:22\nCOPY --from=oven/bun:1.4.2-alpine /usr/local/bin/bun /b\n' },
  /oven\/bun:1\.4\.2-alpine/,
);
await expectFailure(
  'ARG BUN_VERSION at another bun fails',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: a literal Dockerfile/workflow placeholder, not a template
  { Dockerfile: 'ARG BUN_VERSION=1.4.2\nFROM oven/bun:${BUN_VERSION}-alpine\n' },
  /ARG BUN_VERSION=1\.4\.2/,
);
await expectFailure(
  'floor: no oven/bun image at all fails',
  { Dockerfile: 'FROM node:22-alpine\n' },
  /parsed no `oven\/bun` reference/,
);
await expectFailure(
  'floor: a commented-out FROM satisfies nothing',
  { Dockerfile: '# FROM oven/bun:1.4.3-alpine\nFROM node:22\n' },
  /parsed no `oven\/bun` reference/,
);
await expectFailure(
  'floor: no Dockerfile at all fails',
  { Dockerfile: null },
  /parsed no `oven\/bun` reference/,
);

// --- the workflows ----------------------------------------------------------
await expectFailure(
  'a literal setup-bun version off the pin fails',
  { '.github/workflows/ci.yml': workflow('        with:\n          bun-version: 1.4.2\n') },
  /ci\.yml:\d+ setup-bun installs bun-version 1\.4\.2/,
);
await expectFailure(
  'a setup-bun step with no version fails',
  { '.github/workflows/ci.yml': workflow('') },
  /names no version/,
);
await expectFailure(
  'an expression the gate cannot evaluate fails',
  {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a literal Dockerfile/workflow placeholder, not a template
    '.github/workflows/ci.yml': workflow('        with:\n          bun-version: ${{ env.BUN }}\n'),
  },
  /installs bun-version \$\{\{ env\.BUN \}\}/,
);
await expectFailure(
  'a version file other than package.json fails',
  {
    '.github/workflows/ci.yml': workflow(
      '        with:\n          bun-version-file: .bun-version\n',
    ),
  },
  /bun-version-file: \.bun-version/,
);
await expectFailure(
  'a BUN_VERSION env off the pin fails',
  { '.github/workflows/ci.yml': `env:\n  BUN_VERSION: '1.4.2'\n${workflow()}` },
  /sets BUN_VERSION 1\.4\.2/,
);
await expectFailure(
  'floor: no setup-bun step anywhere fails',
  {
    '.github/workflows/ci.yml':
      'on: push\njobs:\n  a:\n    runs-on: x\n    steps:\n      - run: true\n',
  },
  /no `oven-sh\/setup-bun` step/,
);

// --- the real repository ----------------------------------------------------
{
  const { result, error } = await checkBunPin({ root: repositoryRoot })
    .then((result) => ({ result }))
    .catch((error) => ({ error }));
  report(
    'the real repository agrees with its pin',
    !error && result.failures.length === 0,
    error ? error.message : result.failures.join('\n       '),
  );
}

console.log('');
if (failed > 0) {
  console.error(`${failed} self-test case(s) FAILED.`);
  process.exit(1);
}
console.log('All self-test cases passed.');
