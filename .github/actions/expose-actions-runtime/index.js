import { appendFileSync } from 'node:fs';

// What buildx reads for `type=gha` (docker/buildx build/opt.go,
// addGithubToken). ACTIONS_CACHE_SERVICE_V2 is what selects the v2 cache
// protocol and ACTIONS_RESULTS_URL; without it buildx speaks v1 to
// ACTIONS_CACHE_URL, a retired service, and the cache misses silently.
const runtimeVariables = [
  'ACTIONS_CACHE_SERVICE_V2',
  'ACTIONS_CACHE_URL',
  'ACTIONS_RESULTS_URL',
  'ACTIONS_RUNTIME_TOKEN',
  'ACTIONS_RUNTIME_URL',
];

for (const name of runtimeVariables) {
  const value = process.env[name];
  if (value) {
    appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
  }
}

// The three the v2 cache cannot work without; a gap here is a cold build that
// otherwise succeeds without a word.
const missing = ['ACTIONS_CACHE_SERVICE_V2', 'ACTIONS_RESULTS_URL', 'ACTIONS_RUNTIME_TOKEN'].filter(
  (name) => !process.env[name],
);
if (missing.length > 0) {
  console.log(`::warning::buildx gha cache disabled, not set for this action: ${missing.join(', ')}`);
}
