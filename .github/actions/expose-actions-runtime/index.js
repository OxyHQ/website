import { appendFileSync } from 'node:fs';

const runtimeVariables = [
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
