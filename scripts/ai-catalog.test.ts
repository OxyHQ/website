import { describe, expect, test } from 'bun:test'
import {
  AVAILABILITY_STATES,
  ctaIntentFor,
  isPubliclyListable,
  isPurchasable,
} from '../src/lib/ai/availability'
import {
  CATALOG_SCHEMA_VERSION,
  CatalogSchemaError,
  assertNoInternalLeakage,
  parsePublicCatalog,
  toCustomerSafeCatalog,
  type PublicCatalog,
} from '../src/lib/ai/catalog'
import {
  decodeModelSegment,
  encodeModelSegment,
  modelIdFromParams,
  modelPath,
  splitModelId,
} from '../src/lib/ai/modelId'
import {
  estimateMonthlyCost,
  formatNanoUsd,
  parseQuantity,
  usdStringToNano,
} from '../src/lib/ai/estimator'
import { BUILD_SNAPSHOT } from '../src/lib/ai/snapshot'
import { aiServices } from '../src/data/ai/taxonomy'
import snapshotJson from '../src/data/ai/catalog-snapshot.json'

/** A catalogue with one of everything the filters have to deal with. */
function fixture(): unknown {
  return {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedAt: '2026-01-15T00:00:00.000Z',
    priceVersion: '2026-01',
    source: 'oxy-control-plane',
    publishers: [
      { id: 'acme', name: 'Acme' },
      { id: 'hidden-co', name: 'Hidden Co' },
    ],
    providers: [
      { id: 'prov-a', name: 'Provider A' },
      { id: 'prov-secret', name: 'Provider Secret' },
    ],
    deployments: [
      {
        id: 'dep-public',
        providerId: 'prov-a',
        region: 'eu-west',
        kind: 'shared',
        availability: 'available',
        dataPolicy: { retention: 'none', trainsOnContent: 'no', zeroRetentionAvailable: true },
      },
      {
        id: 'dep-internal',
        providerId: 'prov-secret',
        region: 'internal',
        kind: 'managed',
        availability: 'internal_only',
        dataPolicy: { retention: 'unknown', trainsOnContent: 'unknown', zeroRetentionAvailable: false },
      },
    ],
    entries: [
      {
        kind: 'model',
        id: 'acme/one',
        publisherId: 'acme',
        name: 'Acme One',
        description: 'A model.',
        availability: 'available',
        commercial: 'public_payg',
        capabilities: ['text', 'tools'],
        contextTokens: 128000,
        revisions: [{ id: '2026-01-01', availability: 'available' }],
        deploymentIds: ['dep-public', 'dep-internal'],
        prices: [
          { unit: 'input_token', amountUsd: '0.60' },
          { unit: 'output_token', amountUsd: '2.40' },
          { unit: 'input_token', amountUsd: '9.99', deploymentId: 'dep-internal' },
        ],
      },
      {
        kind: 'routing_profile',
        id: 'oxy/balanced',
        publisherId: 'acme',
        name: 'Balanced',
        description: 'A policy over models.',
        availability: 'beta',
        commercial: 'public_payg',
        deploymentIds: [],
        prices: [],
      },
      {
        kind: 'model',
        id: 'hidden-co/secret',
        publisherId: 'hidden-co',
        name: 'Secret',
        description: 'Not for sale.',
        availability: 'available',
        commercial: 'internal_only',
        deploymentIds: ['dep-internal'],
        prices: [],
      },
    ],
  }
}

describe('availability is one vocabulary', () => {
  test('every state maps to exactly one call-to-action intent', () => {
    for (const state of AVAILABILITY_STATES) {
      expect(typeof ctaIntentFor(state)).toBe('string')
    }
  })

  test('a state that is not open for purchase cannot produce a purchase CTA', () => {
    // The whole point of deriving the CTA: `coming_soon` has no code path that
    // reaches `start_building`.
    expect(ctaIntentFor('coming_soon')).toBe('join_waitlist')
    expect(ctaIntentFor('private_preview')).toBe('request_access')
    expect(ctaIntentFor('deprecated')).toBe('see_replacement')
    expect(isPurchasable('coming_soon')).toBe(false)
    expect(isPurchasable('private_preview')).toBe(false)
    expect(isPurchasable('available')).toBe(true)
    expect(isPurchasable('beta')).toBe(true)
  })

  test('internal_only renders no action at all', () => {
    expect(ctaIntentFor('internal_only')).toBe('none')
    expect(isPubliclyListable('internal_only')).toBe(false)
  })

  test('deprecated stays listable so its sunset and replacement remain readable', () => {
    expect(isPubliclyListable('deprecated')).toBe(true)
  })

  test('no published service claims an availability the vocabulary does not have', () => {
    for (const service of aiServices) {
      expect(AVAILABILITY_STATES).toContain(service.availability)
      // A public service card must never be `internal_only` — the card would
      // render with no action and no explanation.
      expect(service.availability).not.toBe('internal_only')
    }
  })
})

describe('catalogue schema', () => {
  test('rejects an unknown schema version rather than parsing leniently', () => {
    expect(() => parsePublicCatalog({ ...(fixture() as object), schemaVersion: 99 })).toThrow(
      CatalogSchemaError,
    )
  })

  test('rejects a payload that is not an object', () => {
    expect(() => parsePublicCatalog('nope')).toThrow(CatalogSchemaError)
    expect(() => parsePublicCatalog(null)).toThrow(CatalogSchemaError)
  })

  test('rejects a malformed price rather than coercing it', () => {
    const broken = fixture() as { entries: Array<{ prices: unknown[] }> }
    broken.entries[0].prices = [{ unit: 'input_token', amountUsd: 0.6 }]
    expect(() => parsePublicCatalog(broken)).toThrow(CatalogSchemaError)
  })

  test('the committed snapshot parses and carries nothing internal', () => {
    const parsed = parsePublicCatalog(snapshotJson)
    expect(parsed.schemaVersion).toBe(CATALOG_SCHEMA_VERSION)
    expect(() => assertNoInternalLeakage(parsed)).not.toThrow()
  })
})

describe('internal-only filtering', () => {
  const safe: PublicCatalog = toCustomerSafeCatalog(parsePublicCatalog(fixture()))

  test('drops an entry whose commercial permission is internal_only', () => {
    expect(safe.entries.map((entry) => entry.id)).toEqual(['acme/one', 'oxy/balanced'])
  })

  test('drops an internal deployment and the references to it', () => {
    expect(safe.deployments.map((deployment) => deployment.id)).toEqual(['dep-public'])
    expect(safe.entries[0].deploymentIds).toEqual(['dep-public'])
  })

  test('drops a price that only applied to a dropped deployment', () => {
    // Leaving it would publish an internal price with no context for it.
    expect(safe.entries[0].prices.map((price) => price.amountUsd)).toEqual(['0.60', '2.40'])
  })

  test('drops publishers and providers left with nothing behind them', () => {
    expect(safe.publishers.map((publisher) => publisher.id)).toEqual(['acme'])
    expect(safe.providers.map((provider) => provider.id)).toEqual(['prov-a'])
  })

  test('the leakage guard catches what the filter would have missed', () => {
    expect(() => assertNoInternalLeakage(safe)).not.toThrow()
    expect(() => assertNoInternalLeakage({ a: { wholesaleCost: '0.01' } })).toThrow(
      CatalogSchemaError,
    )
    expect(() => assertNoInternalLeakage({ list: [{ availability: 'internal_only' }] })).toThrow(
      CatalogSchemaError,
    )
  })
})

describe('model ids survive a URL round trip', () => {
  const ids = [
    'openai/gpt-4o-mini',
    'meta/llama-3.1-70b-instruct',
    'acme/model@2026-01-01',
    'acme/family/variant',
    'acme/model:free',
    'acme/model~weird',
    'acme/model 1.5',
  ]

  test('every shape decodes back to itself', () => {
    for (const id of ids) {
      const parts = splitModelId(id)
      expect(parts).toBeDefined()
      const path = modelPath(id)
      expect(path).toBeDefined()
      const [, , , publisher, model] = (path as string).split('/')
      expect(modelIdFromParams(publisher, model)).toBe(id)
    }
  })

  test('a slash inside the model half does not become a second route segment', () => {
    const encoded = encodeModelSegment('family/variant')
    expect(encoded).not.toContain('/')
    expect(decodeModelSegment(encoded)).toBe('family/variant')
  })

  test('a literal tilde survives the slash encoding', () => {
    expect(decodeModelSegment(encodeModelSegment('a~b'))).toBe('a~b')
    expect(decodeModelSegment(encodeModelSegment('a~/b'))).toBe('a~/b')
  })

  test('a malformed id yields no path rather than a broken one', () => {
    expect(splitModelId('nopublisher')).toBeUndefined()
    expect(splitModelId('/leading')).toBeUndefined()
    expect(splitModelId('trailing/')).toBeUndefined()
    expect(modelPath('nopublisher')).toBeUndefined()
  })
})

describe('cost arithmetic is exact', () => {
  test('decimal strings become nano-dollars without a float in between', () => {
    expect(usdStringToNano('0.1')).toBe(100_000_000n)
    expect(usdStringToNano('0.2')).toBe(200_000_000n)
    // The reason this module exists: 0.1 + 0.2 !== 0.3 in binary floating point.
    expect(usdStringToNano('0.1') + usdStringToNano('0.2')).toBe(usdStringToNano('0.3'))
  })

  test('excess precision is truncated, never rounded up', () => {
    expect(usdStringToNano('0.0000000009')).toBe(0n)
    expect(usdStringToNano('1.9999999999')).toBe(1_999_999_999n)
  })

  test('a per-million price times a large volume stays exact', () => {
    const entry = toCustomerSafeCatalog(parsePublicCatalog(fixture())).entries[0]
    const result = estimateMonthlyCost({
      entry,
      lines: [
        { unit: 'input_token', quantityPerRequest: 1_000n },
        { unit: 'output_token', quantityPerRequest: 500n },
      ],
      monthlyRequests: 1_000_000n,
    })
    // 1e9 input tokens at $0.60/1M = $600; 5e8 output at $2.40/1M = $1200.
    expect(formatNanoUsd(result.totalNanoUsd, 2)).toBe('1800.00')
    expect(result.unpricedUnits).toEqual([])
  })

  test('an unpriced unit is reported, never counted as free', () => {
    const entry = toCustomerSafeCatalog(parsePublicCatalog(fixture())).entries[0]
    const result = estimateMonthlyCost({
      entry,
      lines: [
        { unit: 'input_token', quantityPerRequest: 1_000n },
        { unit: 'reasoning_token', quantityPerRequest: 5_000n },
      ],
      monthlyRequests: 1_000n,
    })
    expect(result.unpricedUnits).toEqual(['reasoning_token'])
    // Only the priced line contributes: 1e6 tokens at $0.60/1M = $0.60.
    expect(formatNanoUsd(result.totalNanoUsd, 2)).toBe('0.60')
  })

  test('quantities from a form are integers, clamped, and never NaN', () => {
    expect(parseQuantity('1,000')).toBe(1000n)
    expect(parseQuantity('')).toBe(0n)
    expect(parseQuantity('abc')).toBe(0n)
    expect(parseQuantity('-5')).toBe(5n)
    expect(parseQuantity('999999999999999999999')).toBe(100_000_000_000n)
  })

  test('formatting truncates rather than rounding the price up', () => {
    expect(formatNanoUsd(1_999_999_999n, 2)).toBe('1.99')
    expect(formatNanoUsd(0n, 2)).toBe('0.00')
  })
})

describe('the committed snapshot is honest about being empty', () => {
  test('the placeholder carries no entries', () => {
    // While the control plane has not published a catalogue, an empty snapshot
    // is the truthful state. A fixture with invented models would satisfy every
    // other test in this file and be a fabrication.
    if (BUILD_SNAPSHOT.source === 'placeholder') {
      expect(BUILD_SNAPSHOT.entries).toEqual([])
      expect(BUILD_SNAPSHOT.priceVersion).toBe('unpublished')
    }
  })
})
