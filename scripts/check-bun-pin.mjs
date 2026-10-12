#!/usr/bin/env bun

/**
 * One bun version, named once: `packageManager` in the root `package.json`.
 *
 * Three things install bun from this repository, and each reads `bun.lock`
 * with `--frozen-lockfile`:
 *
 *   - CI and the Pages deploy, through `oven-sh/setup-bun`, which reads the pin
 *     when a step says `bun-version-file: package.json`;
 *   - the API image, whose `FROM oven/bun:<tag>` is a literal Docker cannot read
 *     from `package.json`;
 *   - whoever runs `bun install` locally.
 *
 * The image tag is the one that drifts silently. A bump that misses it builds
 * production on a bun nobody tested, and the frozen install there either fails
 * the post-merge deploy (no pull-request workflow builds the image) or, worse,
 * passes. So this fails when:
 *
 *   1. `packageManager` is not `bun@<x.y.z>`;
 *   2. any tracked Dockerfile's `FROM oven/bun:<tag>`, `COPY --from=oven/bun:<tag>`
 *      or `ARG BUN_VERSION=<v>` names another version, or no tag at all
 *      (`latest` is whatever bun shipped last);
 *   3. a workflow's `setup-bun` step names a literal `bun-version` (or a
 *      `BUN_VERSION` env) that disagrees, names an expression this cannot
 *      evaluate, or names nothing (setup-bun then installs the newest bun).
 *
 * Vacuity floor: finding no `oven/bun` reference in any Dockerfile, or no
 * `setup-bun` step in any workflow, is a FAILURE. "I parsed nothing" and
 * "everything agrees" are otherwise the same output. Comment lines are skipped,
 * so a commented-out `FROM` satisfies nothing.
 * `scripts/test-check-bun-pin.mjs` mutation-tests every rule and both floors.
 */

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIN = /^bun@(\d+\.\d+\.\d+)$/;
const DOCKERFILE = /(^|\/)Dockerfile(\.[^/]+)?$/;
const WORKFLOW = /^\.github\/workflows\/[^/]+\.ya?ml$/;

/** `1.4.3-alpine` → `1.4.3`; `1.4.3@sha256:…` → `1.4.3`. */
const versionOfTag = (tag) => tag.split('@')[0].split('-')[0];

const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

/** Every `oven/bun` reference in one Dockerfile, ignoring comments. */
export function bunImageReferences(contents) {
  const args = new Map();
  const refs = [];
  for (const [index, raw] of contents.split('\n').entries()) {
    const line = raw.trim();
    if (line.startsWith('#')) continue;
    const arg = /^ARG\s+BUN_VERSION=(\S+)/i.exec(line);
    if (arg) {
      const value = unquote(arg[1]);
      args.set('BUN_VERSION', value);
      refs.push({ line: index + 1, kind: 'ARG BUN_VERSION', version: value });
      continue;
    }
    const image =
      /^FROM\s+(?:--\S+\s+)*oven\/bun(?::(\S+))?/i.exec(line) ??
      /^COPY\s+(?:--\S+\s+)*--from=oven\/bun(?::(\S+))?/i.exec(line);
    if (!image) continue;
    let tag = image[1] ?? 'latest';
    // `oven/bun:${BUN_VERSION}-alpine` resolves through the ARG above it.
    tag = tag.replace(/\$\{?BUN_VERSION\}?/g, () => args.get('BUN_VERSION') ?? '$BUN_VERSION');
    refs.push({ line: index + 1, kind: 'oven/bun', tag, version: versionOfTag(tag) });
  }
  return refs;
}

/**
 * Every `oven-sh/setup-bun` step in one workflow and what it pins, plus every
 * literal `BUN_VERSION:` env. A step is the lines indented deeper than its
 * `- uses:` dash, up to the next item at that depth or shallower.
 */
export function setupBunSteps(contents) {
  const lines = contents.split('\n');
  const steps = [];
  const envPins = [];
  for (const [index, raw] of lines.entries()) {
    if (raw.trim().startsWith('#')) continue;
    const env = /^\s*BUN_VERSION:\s*(\S.*?)\s*(?:#.*)?$/.exec(raw);
    if (env) envPins.push({ line: index + 1, value: unquote(env[1]) });
    const uses = /^(\s*)(-\s+)?uses:\s*oven-sh\/setup-bun\b/.exec(raw);
    if (!uses) continue;
    const stepIndent = uses[1].length;
    const step = { line: index + 1, version: undefined, versionFile: undefined };
    for (let j = index + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (next.trim() === '' || next.trim().startsWith('#')) continue;
      const indent = next.length - next.trimStart().length;
      if (indent < stepIndent || (indent === stepIndent && next.trimStart().startsWith('-'))) break;
      const version = /^\s*bun-version:\s*(\S.*?)\s*(?:#.*)?$/.exec(next);
      if (version) step.version = unquote(version[1]);
      const file = /^\s*bun-version-file:\s*(\S.*?)\s*(?:#.*)?$/.exec(next);
      if (file) step.versionFile = unquote(file[1]);
    }
    steps.push(step);
  }
  return { steps, envPins };
}

export async function checkBunPin({ root } = {}) {
  const repositoryRoot = root ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const failures = [];

  const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
  const pinned = PIN.exec(String(manifest.packageManager ?? ''))?.[1];
  if (!pinned) {
    throw new Error(
      `check-bun-pin: root package.json must pin \`packageManager\` as bun@<x.y.z> (found ${JSON.stringify(manifest.packageManager ?? null)}). It is the one bun version CI, the image and the lockfile are held to.`,
    );
  }

  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: repositoryRoot, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);

  let imageRefs = 0;
  for (const path of tracked.filter((p) => DOCKERFILE.test(p))) {
    const refs = bunImageReferences(await readFile(resolve(repositoryRoot, path), 'utf8'));
    imageRefs += refs.length;
    for (const ref of refs) {
      if (ref.version === pinned) continue;
      const named =
        ref.kind === 'oven/bun' ? `oven/bun:${ref.tag}` : `ARG BUN_VERSION=${ref.version}`;
      failures.push(
        `${path}:${ref.line} uses ${named}, but package.json pins bun@${pinned}. The image must run the bun that wrote bun.lock and that CI tests with.`,
      );
    }
  }
  if (imageRefs === 0) {
    throw new Error(
      'check-bun-pin: parsed no `oven/bun` reference out of any tracked Dockerfile, so the image pin check would measure nothing.',
    );
  }

  let setupSteps = 0;
  for (const path of tracked.filter((p) => WORKFLOW.test(p))) {
    const { steps, envPins } = setupBunSteps(await readFile(resolve(repositoryRoot, path), 'utf8'));
    setupSteps += steps.length;
    for (const step of steps) {
      if (step.versionFile !== undefined) {
        if (step.versionFile !== 'package.json') {
          failures.push(
            `${path}:${step.line} setup-bun reads bun-version-file: ${step.versionFile}; the pin lives in package.json.`,
          );
        }
        continue;
      }
      if (step.version === undefined) {
        failures.push(
          `${path}:${step.line} setup-bun names no version, so it installs the newest bun. Use \`bun-version-file: package.json\`.`,
        );
      } else if (step.version !== pinned) {
        failures.push(
          `${path}:${step.line} setup-bun installs bun-version ${step.version}, but package.json pins bun@${pinned}. Use \`bun-version-file: package.json\`.`,
        );
      }
    }
    for (const env of envPins) {
      if (env.value !== pinned) {
        failures.push(
          `${path}:${env.line} sets BUN_VERSION ${env.value}, but package.json pins bun@${pinned}.`,
        );
      }
    }
  }
  if (setupSteps === 0) {
    throw new Error(
      'check-bun-pin: found no `oven-sh/setup-bun` step in any workflow, so the CI pin check would measure nothing.',
    );
  }

  return { pinned, imageRefs, setupSteps, failures };
}

if (import.meta.main) {
  const { pinned, imageRefs, setupSteps, failures } = await checkBunPin().catch((error) => {
    console.error(`bun pin check FAILED: ${error.message}`);
    process.exit(1);
  });
  if (failures.length > 0) {
    console.error('bun pin check FAILED:\n');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `bun pin check passed: package.json pins bun@${pinned}; ${imageRefs} oven/bun image reference(s) and ${setupSteps} setup-bun step(s) agree.`,
  );
}
