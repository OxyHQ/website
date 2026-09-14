import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  INQUIRY_RETENTION_DAYS,
  INQUIRY_STATUSES,
  MESSAGE_MAX_LENGTH,
  idempotencyKeyFor,
  salesInquirySchema,
  type SalesInquiryInput,
} from '../server/contracts/salesInquiry'

const ROOT = path.resolve(import.meta.dir, '..')

function validInput(): Record<string, unknown> {
  return {
    interest: 'oxy_inference',
    name: 'Ada Lovelace',
    email: 'ADA@Example.com ',
    company: 'Analytical Engines',
    useCase: 'Summarising build logs for an internal tool.',
  }
}

describe('sales inquiry validation', () => {
  test('accepts the minimum a useful inquiry needs and nothing less', () => {
    const parsed = salesInquirySchema.parse(validInput())
    expect(parsed.email).toBe('ada@example.com')
    expect(parsed.modalities).toEqual([])
    expect(parsed.marketingConsent).toBe(false)
  })

  test('marketing consent is off unless it is ticked', () => {
    // Consenting to be marketed at is its own decision, not a side effect of
    // asking a sales question.
    expect(salesInquirySchema.parse(validInput()).marketingConsent).toBe(false)
    expect(
      salesInquirySchema.parse({ ...validInput(), marketingConsent: true }).marketingConsent,
    ).toBe(true)
  })

  test('rejects a submission with no reply address', () => {
    expect(salesInquirySchema.safeParse({ ...validInput(), email: 'not-an-email' }).success).toBe(
      false,
    )
  })

  test('rejects an unknown interest rather than storing it', () => {
    expect(salesInquirySchema.safeParse({ ...validInput(), interest: 'free_stuff' }).success).toBe(
      false,
    )
  })

  test('a website must be a full URL or absent', () => {
    expect(salesInquirySchema.safeParse({ ...validInput(), website: 'example.com' }).success).toBe(
      false,
    )
    expect(
      salesInquirySchema.safeParse({ ...validInput(), website: 'https://example.com' }).success,
    ).toBe(true)
    expect(salesInquirySchema.safeParse({ ...validInput(), website: '' }).success).toBe(true)
  })

  test('a message longer than the cap is rejected, not truncated', () => {
    const tooLong = 'x'.repeat(MESSAGE_MAX_LENGTH + 1)
    expect(salesInquirySchema.safeParse({ ...validInput(), message: tooLong }).success).toBe(false)
  })

  test('unknown fields are dropped rather than stored', () => {
    const parsed = salesInquirySchema.parse({
      ...validInput(),
      apiKey: 'sk-live-should-never-be-stored',
    }) as Record<string, unknown>
    expect('apiKey' in parsed).toBe(false)
  })
})

describe('idempotency', () => {
  test('the same submission twice produces the same key', () => {
    const a = salesInquirySchema.parse(validInput()) as SalesInquiryInput
    const b = salesInquirySchema.parse(validInput()) as SalesInquiryInput
    expect(idempotencyKeyFor(a)).toBe(idempotencyKeyFor(b))
  })

  test('a different use case is a different inquiry', () => {
    const a = salesInquirySchema.parse(validInput()) as SalesInquiryInput
    const b = salesInquirySchema.parse({
      ...validInput(),
      useCase: 'Something else entirely.',
    }) as SalesInquiryInput
    expect(idempotencyKeyFor(a)).not.toBe(idempotencyKeyFor(b))
  })

  test('a different person at the same company is a different inquiry', () => {
    const a = salesInquirySchema.parse(validInput()) as SalesInquiryInput
    const b = salesInquirySchema.parse({
      ...validInput(),
      email: 'charles@example.com',
    }) as SalesInquiryInput
    expect(idempotencyKeyFor(a)).not.toBe(idempotencyKeyFor(b))
  })
})

describe('the record holds nothing it should not', () => {
  const schemaSource = readFileSync(path.join(ROOT, 'server', 'db', 'schema', 'site.ts'), 'utf8')
  const table = schemaSource.slice(schemaSource.indexOf('export const salesInquiries'))

  test('there is no column an IP address could be written to', () => {
    // The platform-wide no-IP invariant. The rate limiter keys on the connection
    // in memory; nothing about the client reaches the database.
    for (const forbidden of ['ipAddress', 'ip_address', 'remoteAddr', 'clientIp', 'geo']) {
      expect(table.includes(forbidden)).toBe(false)
    }
  })

  test('there is no column a secret could be typed into', () => {
    for (const forbidden of ['apiKey', 'credential', 'token', 'providerKey', 'prompt']) {
      expect(table.includes(forbidden)).toBe(false)
    }
  })

  test('retention is a column, not a convention', () => {
    expect(table.includes('deleteAfter')).toBe(true)
    expect(INQUIRY_RETENTION_DAYS).toBeGreaterThan(0)
  })
})

describe('status vocabulary', () => {
  test('stays small enough to be a lifecycle rather than a CRM', () => {
    expect(INQUIRY_STATUSES.length).toBeLessThanOrEqual(8)
    expect(INQUIRY_STATUSES[0]).toBe('new')
    expect(INQUIRY_STATUSES).toContain('spam')
  })
})
