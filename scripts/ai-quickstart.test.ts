import { describe, expect, test } from 'bun:test'
import {
  CREDENTIAL_ENV_VAR,
  MODEL_ID_PLACEHOLDER,
  advancedSamples,
  quickstartSamples,
} from '../src/data/ai/quickstart'
import { INFERENCE_API_BASE, consoleLinks, CONSOLE_URL } from '../src/data/ai/taxonomy'

/**
 * The published snippets are a contract, and a snippet that drifts is a
 * developer's first five minutes wasted.
 *
 * These assertions are the properties that must hold whatever the copy says:
 * the documented base URL, a credential read from the environment, no literal
 * key, and a model id that is visibly a placeholder rather than an invented
 * model name.
 */
describe('quickstart snippets', () => {
  const all = [...quickstartSamples, ...advancedSamples]

  test('there is at least one runnable first snippet per documented language', () => {
    expect(quickstartSamples.map((sample) => sample.key).sort()).toEqual([
      'curl',
      'python',
      'typescript',
    ])
  })

  test('sample keys are unique', () => {
    const keys = all.map((sample) => sample.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('the first snippet in every language points at the documented base URL', () => {
    for (const sample of quickstartSamples) {
      expect(sample.code).toContain(INFERENCE_API_BASE)
    }
  })

  test('the base URL is the versioned one, not the API root', () => {
    // `https://api.oxy.so` alone is the platform API; the inference surface is
    // `/v1`, and a snippet missing it 404s on the reader's first attempt.
    expect(INFERENCE_API_BASE.endsWith('/v1')).toBe(true)
  })

  test('every credential comes from the environment', () => {
    for (const sample of quickstartSamples) {
      expect(sample.code).toContain(CREDENTIAL_ENV_VAR)
    }
  })

  test('no snippet contains anything shaped like a real key', () => {
    // A published example key gets copied verbatim, and a revoked one gets
    // reported as a bug. Neither belongs in documentation.
    const keyish = /\b(sk|oxy|alia)[-_][A-Za-z0-9]{16,}\b/
    for (const sample of all) {
      expect(keyish.test(sample.code)).toBe(false)
    }
  })

  test('the model id stays a placeholder until the catalogue is published', () => {
    for (const sample of quickstartSamples) {
      expect(sample.code).toContain(MODEL_ID_PLACEHOLDER)
    }
  })
})

describe('console deep links', () => {
  test('every link is under the Console origin', () => {
    for (const [name, url] of Object.entries(consoleLinks)) {
      expect(`${name}: ${url}`.includes(CONSOLE_URL)).toBe(true)
    }
  })

  test('the root is available as the fallback for a target that is not deployed yet', () => {
    expect(consoleLinks.root).toBe(CONSOLE_URL)
  })

  test('no deep link carries a credential or a token in the URL', () => {
    for (const url of Object.values(consoleLinks)) {
      expect(url).not.toMatch(/[?&](token|key|secret|credential)=/i)
    }
  })
})
