import { describe, expect, mock, test } from 'bun:test';
import {
  CONTENT_CLAIM_COUNTER_NOTICE_VALIDATION_KEYS,
  CONTENT_CLAIM_VALIDATION_KEYS,
  COUNTER_NOTICE_STATEMENTS,
  contentClaimCounterNoticeSchema,
  contentClaimSubmissionSchema,
} from '@oxy.so/contracts';
import { contentClaimSchema } from '../src/lib/contentClaims';
import {
  COUNTER_NOTICE_STATEMENT_KEYS,
  EMPTY_COUNTER_NOTICE_FORM,
  counterNoticeFieldForPath,
  normalizeReference,
  submitCounterNotice,
  validateCounterNotice,
  type CounterNoticeForm,
  type CounterNoticePayload,
} from '../src/lib/contentClaimCounterNotice';
import { COUNTER_NOTICE_PAGE } from '../src/lib/transparency';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';
import en from '../src/lib/i18n/locales/en';

function noticeForm(overrides: Partial<CounterNoticeForm> = {}): CounterNoticeForm {
  return {
    ...EMPTY_COUNTER_NOTICE_FORM,
    reference: ' oxy-7k3m-9q2d ',
    name: ' Ada Lovelace ',
    address: '12 St James’s Square, London SW1Y 4JH',
    phone: '+44 20 7946 0000',
    email: 'ada@example.com',
    materialDescription: 'A photograph of my own garden.',
    materialLocation: 'A post on my Mention profile',
    explanation: 'I took this photograph myself and never licensed it to anyone.',
    perjury: true,
    jurisdiction: true,
    serviceOfProcess: true,
    disclosure: true,
    signature: 'Ada Lovelace',
    ...overrides,
  };
}

function validPayload(): CounterNoticePayload {
  const result = validateCounterNotice(noticeForm());
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.payload;
}

function respond(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

/** Read `a.b.c` out of a locale dictionary. */
function lookup(dictionary: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[segment] : undefined,
      dictionary,
    );
}

describe('the contract is @oxy.so/contracts’', () => {
  test('the report form validates with the API’s own schema', () => {
    expect(contentClaimSchema).toBe(contentClaimSubmissionSchema);
  });

  test('every validation key either schema can raise is translated in every locale', async () => {
    const keys = [
      ...CONTENT_CLAIM_VALIDATION_KEYS,
      ...CONTENT_CLAIM_COUNTER_NOTICE_VALIDATION_KEYS,
    ];
    for (const locale of SUPPORTED_LOCALES) {
      const dictionary = (await import(`../src/lib/i18n/locales/${locale}.ts`)).default;
      for (const key of keys) {
        const value = lookup(dictionary, key);
        expect({ locale, key, ok: typeof value === 'string' && value.length > 0 }).toEqual({
          locale,
          key,
          ok: true,
        });
      }
    }
  });

  test('the English statements are the contract’s wording, word for word', () => {
    // The API records COUNTER_NOTICE_STATEMENT_VERSION with each notice; the
    // English page must show exactly the text that version names.
    const counterNotice = en.contentClaim.counterNotice;
    expect(counterNotice.statementPerjury).toBe(COUNTER_NOTICE_STATEMENTS.perjury);
    expect(counterNotice.statementJurisdiction).toBe(COUNTER_NOTICE_STATEMENTS.jurisdiction);
    expect(counterNotice.statementServiceOfProcess).toBe(
      COUNTER_NOTICE_STATEMENTS.serviceOfProcess,
    );
    expect(counterNotice.statementDisclosure).toBe(COUNTER_NOTICE_STATEMENTS.disclosure);
    expect([...COUNTER_NOTICE_STATEMENT_KEYS].sort() as string[]).toEqual(
      Object.keys(COUNTER_NOTICE_STATEMENTS).sort(),
    );
  });

  test('the page lives where the legal collection links it', () => {
    expect(COUNTER_NOTICE_PAGE.path).toBe('/transparency/legal/counter-notice');
  });
});

describe('counter-notice validation', () => {
  test('a complete notice becomes exactly the contract body', () => {
    const payload = validPayload();
    expect(payload).toEqual({
      reference: 'OXY-7K3M-9Q2D',
      subscriber: {
        name: 'Ada Lovelace',
        address: '12 St James’s Square, London SW1Y 4JH',
        phone: '+44 20 7946 0000',
        email: 'ada@example.com',
      },
      material: {
        description: 'A photograph of my own garden.',
        location: 'A post on my Mention profile',
      },
      explanation: 'I took this photograph myself and never licensed it to anyone.',
      statements: { perjury: true, jurisdiction: true, serviceOfProcess: true, disclosure: true },
      signature: 'Ada Lovelace',
    });
    expect(contentClaimCounterNoticeSchema.safeParse(payload).success).toBe(true);
  });

  test('an empty form reports every required field, in form order', () => {
    const result = validateCounterNotice(EMPTY_COUNTER_NOTICE_FORM);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors)).toEqual([
      'reference',
      'name',
      'address',
      'phone',
      'email',
      'materialDescription',
      'materialLocation',
      'explanation',
      'perjury',
      'jurisdiction',
      'serviceOfProcess',
      'disclosure',
      'signature',
    ]);
    expect(result.errors.reference).toBe('contentClaim.counterNotice.errors.claim');
  });

  test('a claim is named by reference or by removed files; either is enough', () => {
    const byFiles = validateCounterNotice(
      noticeForm({ reference: '', fileIds: 'file_a\nfile_b file_a\n' }),
    );
    expect(byFiles.ok && byFiles.payload).toMatchObject({ fileIds: ['file_a', 'file_b'] });
    expect(byFiles.ok && 'reference' in byFiles.payload).toBe(false);
    const both = validateCounterNotice(noticeForm({ fileIds: 'file_a' }));
    expect(both.ok && both.payload).toMatchObject({
      reference: 'OXY-7K3M-9Q2D',
      fileIds: ['file_a'],
    });
    const tooMany = Array.from({ length: 51 }, (_, i) => `file_${i}`).join('\n');
    expect(validateCounterNotice(noticeForm({ fileIds: tooMany }))).toMatchObject({
      ok: false,
      errors: { fileIds: 'contentClaim.counterNotice.errors.fileIds' },
    });
  });

  test('a reference is normalized, and anything else is refused', () => {
    expect(normalizeReference(' oxy-7k3m- 9q2d ')).toBe('OXY-7K3M-9Q2D');
    for (const reference of ['OXY-7K3M', 'OXY-ILOU-9Q2D', 'claim 42']) {
      expect(validateCounterNotice(noticeForm({ reference }))).toMatchObject({
        ok: false,
        errors: { reference: 'contentClaim.counterNotice.errors.reference' },
      });
    }
  });

  test('every statement must be affirmed', () => {
    for (const statement of COUNTER_NOTICE_STATEMENT_KEYS) {
      expect(validateCounterNotice(noticeForm({ [statement]: false }))).toMatchObject({
        ok: false,
        errors: { [statement]: `contentClaim.counterNotice.errors.${statement}` },
      });
    }
  });

  test('the bounds are the contract’s', () => {
    expect(validateCounterNotice(noticeForm({ phone: '123' }))).toMatchObject({
      ok: false,
      errors: { phone: 'contentClaim.counterNotice.errors.phone' },
    });
    expect(validateCounterNotice(noticeForm({ phone: 'call me' }))).toMatchObject({
      ok: false,
    });
    expect(validateCounterNotice(noticeForm({ materialDescription: 'photo' }))).toMatchObject({
      ok: false,
      errors: { materialDescription: 'contentClaim.counterNotice.errors.materialDescription' },
    });
    expect(validateCounterNotice(noticeForm({ explanation: 'it is mine' }))).toMatchObject({
      ok: false,
      errors: { explanation: 'contentClaim.counterNotice.errors.explanation' },
    });
  });

  test('every key validation raises is in the English dictionary', () => {
    const forms = [
      EMPTY_COUNTER_NOTICE_FORM,
      noticeForm({ reference: 'nope', phone: 'x', email: 'nope' }),
      noticeForm({ reference: '', fileIds: '' }),
    ];
    for (const form of forms) {
      const result = validateCounterNotice(form);
      if (result.ok) continue;
      for (const key of Object.values(result.errors)) {
        expect(typeof lookup(en, key ?? '')).toBe('string');
      }
    }
  });

  test('server field paths map onto form fields', () => {
    expect(counterNoticeFieldForPath('subscriber.email')).toBe('email');
    expect(counterNoticeFieldForPath('material.location')).toBe('materialLocation');
    expect(counterNoticeFieldForPath('fileIds.3')).toBe('fileIds');
    expect(counterNoticeFieldForPath('statements.disclosure')).toBe('disclosure');
    expect(counterNoticeFieldForPath('claimId')).toBe('reference');
    expect(counterNoticeFieldForPath('captcha')).toBeUndefined();
  });
});

describe('counter-notice submission', () => {
  test('sends the payload as JSON and reads the claim and the files it covers', async () => {
    const send = mock(async (_body: string) =>
      respond(201, {
        id: 'cn_1',
        reference: 'OXY-7K3M-9Q2D',
        state: 'counter_noticed',
        fileIds: ['file_a', 'file_b'],
      }),
    );
    const payload = validPayload();
    expect(await submitCounterNotice(payload, { send })).toEqual({
      status: 'created',
      reference: 'OXY-7K3M-9Q2D',
      fileIds: ['file_a', 'file_b'],
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(send.mock.calls[0]?.[0] ?? '')).toEqual(payload);
  });

  test('400 field errors land on fields; an ambiguous claim asks for the reference', async () => {
    const invalid = await submitCounterNotice(validPayload(), {
      send: async () =>
        respond(400, {
          error: 'Some details of your counter-notice need attention.',
          code: 'CONTENT_CLAIM_COUNTER_NOTICE_INVALID',
          fields: {
            'subscriber.phone': 'Enter a telephone number we can reach you on.',
            captcha: 'This field is not part of a counter-notice.',
          },
        }),
    });
    expect(invalid).toEqual({
      status: 'invalid',
      message: 'Some details of your counter-notice need attention.',
      fields: { phone: 'Enter a telephone number we can reach you on.' },
      unmatched: ['This field is not part of a counter-notice.'],
    });
    expect(
      await submitCounterNotice(validPayload(), {
        send: async () =>
          respond(400, { error: 'Name the claim', code: 'CONTENT_CLAIM_COUNTER_NOTICE_AMBIGUOUS' }),
      }),
    ).toEqual({ status: 'ambiguous' });
  });

  test('404, both 409s and 401 are each their own outcome', async () => {
    const outcome = async (response: Response) =>
      (await submitCounterNotice(validPayload(), { send: async () => response })).status;
    expect(await outcome(respond(404, { error: 'No such claim' }))).toBe('not_found');
    expect(
      await outcome(respond(409, { error: 'x', code: 'CONTENT_CLAIM_COUNTER_NOTICE_EXISTS' })),
    ).toBe('already_sent');
    expect(await outcome(respond(409, { error: 'x', code: 'CONTENT_CLAIM_STATE_CONFLICT' }))).toBe(
      'not_disputable',
    );
    expect(await outcome(respond(401, { error: 'Unauthorized' }))).toBe('signed_out');
  });

  test('an SDK that has no session to send with is signed out, not a failure', async () => {
    const send = async () => {
      throw Object.assign(new Error('An active Oxy session is required'), {
        code: 'AUTH_REQUIRED',
      });
    };
    expect(await submitCounterNotice(validPayload(), { send })).toEqual({ status: 'signed_out' });
  });

  test('429 carries when to retry; a 5xx or a network failure never throws', async () => {
    const now = new Date('2026-10-16T10:00:00Z');
    expect(
      await submitCounterNotice(validPayload(), {
        send: async () => respond(429, { error: 'Too many' }, { 'retry-after': '60' }),
        now: () => now,
      }),
    ).toEqual({ status: 'rate_limited', retryAt: new Date('2026-10-16T10:01:00Z') });
    expect(
      await submitCounterNotice(validPayload(), {
        send: async () => new Response('<html>Bad gateway</html>', { status: 502 }),
      }),
    ).toEqual({ status: 'failed', httpStatus: 502 });
    expect(
      await submitCounterNotice(validPayload(), {
        send: async () => {
          throw new TypeError('Failed to fetch');
        },
      }),
    ).toEqual({ status: 'failed' });
  });

  test('a stored notice without a readable body is still a success', async () => {
    expect(
      await submitCounterNotice(validPayload(), {
        send: async () => new Response(null, { status: 201 }),
      }),
    ).toEqual({ status: 'created', reference: '', fileIds: [] });
  });
});
