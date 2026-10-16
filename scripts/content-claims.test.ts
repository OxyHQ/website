import { describe, expect, mock, test } from 'bun:test';
import {
  CONTENT_CLAIM_LIMITS,
  EMPTY_CONTENT_CLAIM_FORM,
  fieldForPath,
  parseRetryAfter,
  splitContentUrls,
  submitContentClaim,
  validateContentClaim,
  type ContentClaimForm,
  type ContentClaimPayload,
} from '../src/lib/contentClaims';
import en from '../src/lib/i18n/locales/en';

const API = 'https://api.test.invalid';

function copyrightForm(overrides: Partial<ContentClaimForm> = {}): ContentClaimForm {
  return {
    ...EMPTY_CONTENT_CLAIM_FORM,
    kind: 'copyright',
    contentUrls: 'https://cloud.oxy.so/assets/abc\n\n  https://mercaria.co/products/42  \n',
    description: 'This is my photograph, copied from my portfolio without permission.',
    originalWorkUrl: 'https://example.com/portfolio/42',
    name: ' Ada Lovelace ',
    email: 'ada@example.com',
    relationship: 'rights_holder',
    goodFaith: true,
    accurate: true,
    signature: 'Ada Lovelace',
    ...overrides,
  };
}

function validPayload(): ContentClaimPayload {
  const result = validateContentClaim(copyrightForm());
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.payload;
}

function respond(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('content claim validation', () => {
  test('a complete copyright claim becomes exactly the contract body', () => {
    expect(validPayload()).toEqual({
      kind: 'copyright',
      contentUrls: ['https://cloud.oxy.so/assets/abc', 'https://mercaria.co/products/42'],
      description: 'This is my photograph, copied from my portfolio without permission.',
      originalWorkUrl: 'https://example.com/portfolio/42',
      claimant: { name: 'Ada Lovelace', email: 'ada@example.com', relationship: 'rights_holder' },
      statements: { goodFaith: true, accurate: true },
      signature: 'Ada Lovelace',
    });
  });

  test('an empty form reports every required field, in form order', () => {
    const result = validateContentClaim(EMPTY_CONTENT_CLAIM_FORM);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors)).toEqual([
      'kind',
      'contentUrls',
      'description',
      'name',
      'email',
      'relationship',
      'goodFaith',
      'accurate',
      'signature',
    ]);
    expect(result.errors.contentUrls).toBe('contentClaim.errors.contentUrlsRequired');
  });

  test('every error the schema can raise is a key the English dictionary has', () => {
    const keys = new Set<string>();
    const forms: ContentClaimForm[] = [
      EMPTY_CONTENT_CLAIM_FORM,
      copyrightForm({ contentUrls: 'http://insecure.example', description: 'x'.repeat(6000) }),
      copyrightForm({
        contentUrls: Array.from({ length: 21 }, (_, i) => `https://a.example/${i}`).join('\n'),
        originalWorkUrl: 'not a url',
        organization: 'o'.repeat(500),
      }),
    ];
    for (const form of forms) {
      const result = validateContentClaim(form);
      if (!result.ok) for (const key of Object.values(result.errors)) if (key) keys.add(key);
    }
    const errors = en.contentClaim.errors as Record<string, string>;
    expect(keys.size).toBeGreaterThan(10);
    for (const key of keys) {
      expect(key.startsWith('contentClaim.errors.')).toBe(true);
      expect(errors[key.slice('contentClaim.errors.'.length)]).toBeString();
    }
  });

  test('content links must be https, between one and twenty', () => {
    const check = (contentUrls: string) => validateContentClaim(copyrightForm({ contentUrls }));
    expect(check('http://cloud.oxy.so/a')).toMatchObject({
      ok: false,
      errors: { contentUrls: 'contentClaim.errors.contentUrlInvalid' },
    });
    expect(check('cloud.oxy.so/a')).toMatchObject({ ok: false });
    expect(check('javascript:alert(1)')).toMatchObject({ ok: false });
    const twenty = Array.from({ length: 20 }, (_, i) => `https://a.example/${i}`);
    expect(check(twenty.join('\n')).ok).toBe(true);
    expect(check([...twenty, 'https://a.example/20'].join('\n'))).toMatchObject({
      ok: false,
      errors: { contentUrls: 'contentClaim.errors.contentUrlsTooMany' },
    });
    // A pasted list repeats itself more often than a person means to file twice.
    expect(
      splitContentUrls('https://a.example/1 https://a.example/1\nhttps://a.example/2'),
    ).toEqual(['https://a.example/1', 'https://a.example/2']);
  });

  test('the description is 20 to 5000 characters after trimming', () => {
    const check = (description: string) => validateContentClaim(copyrightForm({ description }));
    expect(check(`   ${'x'.repeat(19)}   `)).toMatchObject({
      ok: false,
      errors: { description: 'contentClaim.errors.descriptionShort' },
    });
    expect(check('x'.repeat(CONTENT_CLAIM_LIMITS.minDescription)).ok).toBe(true);
    expect(check('x'.repeat(CONTENT_CLAIM_LIMITS.maxDescription)).ok).toBe(true);
    expect(check('x'.repeat(CONTENT_CLAIM_LIMITS.maxDescription + 1))).toMatchObject({
      ok: false,
      errors: { description: 'contentClaim.errors.descriptionLong' },
    });
  });

  test('both statements must be affirmed, whatever the kind', () => {
    for (const kind of ['copyright', 'privacy', 'other'] as const) {
      expect(validateContentClaim(copyrightForm({ kind, goodFaith: false }))).toMatchObject({
        ok: false,
        errors: { goodFaith: 'contentClaim.errors.goodFaith' },
      });
      expect(validateContentClaim(copyrightForm({ kind, accurate: false }))).toMatchObject({
        ok: false,
        errors: { accurate: 'contentClaim.errors.accurate' },
      });
    }
  });

  test('the original-work link travels only with a rights claim', () => {
    const privacy = validateContentClaim(
      copyrightForm({ kind: 'privacy', relationship: 'affected_person' }),
    );
    expect(privacy.ok && 'originalWorkUrl' in privacy.payload).toBe(false);
    // Hidden for a privacy report, so a stale invalid value cannot block it either.
    expect(
      validateContentClaim(copyrightForm({ kind: 'privacy', originalWorkUrl: 'nope' })).ok,
    ).toBe(true);
    const trademark = validateContentClaim(
      copyrightForm({ kind: 'trademark', originalWorkUrl: '' }),
    );
    expect(trademark.ok && 'originalWorkUrl' in trademark.payload).toBe(false);
  });

  test('optional organization is omitted when blank and sent when given', () => {
    const blank = validateContentClaim(copyrightForm({ organization: '   ' }));
    expect(blank.ok && 'organization' in blank.payload.claimant).toBe(false);
    const given = validateContentClaim(copyrightForm({ organization: ' Analytical Engines ' }));
    expect(given.ok && given.payload.claimant.organization).toBe('Analytical Engines');
  });

  test('server field paths map onto form fields', () => {
    expect(fieldForPath('claimant.email')).toBe('email');
    expect(fieldForPath('contentUrls.3')).toBe('contentUrls');
    expect(fieldForPath('contentUrls[3]')).toBe('contentUrls');
    expect(fieldForPath('statements.goodFaith')).toBe('goodFaith');
    expect(fieldForPath('signature')).toBe('signature');
    expect(fieldForPath('captcha')).toBeUndefined();
  });
});

describe('content claim submission', () => {
  test('posts the payload as JSON to {apiBase}/content-claims and returns the reference', async () => {
    const fetchImpl = mock(async (_url: string | URL | Request, _init?: RequestInit) =>
      respond(201, { id: 'claim_1', reference: 'OXY-CC-7Q2K' }),
    );
    const payload = validPayload();
    const result = await submitContentClaim(payload, {
      apiBase: `${API}/`,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ status: 'created', id: 'claim_1', reference: 'OXY-CC-7Q2K' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(`${API}/content-claims`);
    expect(init?.method).toBe('POST');
    const headers = init?.headers as Record<string, string>;
    expect(headers['content-type']).toBe('application/json');
    expect(headers.authorization).toBeUndefined();
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  test('a signed-in visitor sends their bearer, and a stale one is dropped on 401', async () => {
    const seen: Array<string | undefined> = [];
    const fetchImpl = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      const auth = (init?.headers as Record<string, string> | undefined)?.authorization;
      seen.push(auth);
      return auth
        ? respond(401, { error: 'Invalid token' })
        : respond(201, { id: 'c', reference: 'R' });
    });
    const result = await submitContentClaim(validPayload(), {
      apiBase: API,
      accessToken: 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(seen).toEqual(['Bearer tok', undefined]);
    expect(result.status).toBe('created');
  });

  test('400 field errors are mapped to form fields, the rest kept for the summary', async () => {
    const fetchImpl = async () =>
      respond(400, {
        error: 'Invalid claim',
        fields: {
          'claimant.email': 'This address cannot receive mail',
          'contentUrls.0': 'Not an Oxy URL',
          captcha: 'Required',
        },
      });
    expect(
      await submitContentClaim(validPayload(), {
        apiBase: API,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).toEqual({
      status: 'invalid',
      message: 'Invalid claim',
      fields: { email: 'This address cannot receive mail', contentUrls: 'Not an Oxy URL' },
      unmatched: ['Required'],
    });
  });

  test('429 carries when to retry, from seconds or a date', async () => {
    const now = new Date('2026-10-16T10:00:00Z');
    const fetchImpl = async () => respond(429, { error: 'Too many' }, { 'retry-after': '120' });
    expect(
      await submitContentClaim(validPayload(), {
        apiBase: API,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        now: () => now,
      }),
    ).toEqual({ status: 'rate_limited', retryAt: new Date('2026-10-16T10:02:00Z') });
    expect(parseRetryAfter('Fri, 16 Oct 2026 11:00:00 GMT', now)).toEqual(
      new Date('2026-10-16T11:00:00Z'),
    );
    expect(parseRetryAfter(null, now)).toBeUndefined();
    expect(parseRetryAfter('soon', now)).toBeUndefined();
  });

  test('a 5xx, a non-JSON body or a network failure is a failure, never a throw', async () => {
    const cases: Array<() => Promise<Response>> = [
      async () => respond(503, { error: 'Unavailable' }),
      async () => new Response('<html>Bad gateway</html>', { status: 502 }),
      async () => {
        throw new TypeError('Failed to fetch');
      },
    ];
    const results = [];
    for (const fetchImpl of cases) {
      results.push(
        await submitContentClaim(validPayload(), {
          apiBase: API,
          fetchImpl: fetchImpl as unknown as typeof fetch,
        }),
      );
    }
    expect(results).toEqual([
      { status: 'failed', httpStatus: 503 },
      { status: 'failed', httpStatus: 502 },
      { status: 'failed' },
    ]);
  });

  test('a stored claim without a readable reference is still a success', async () => {
    const fetchImpl = async () => new Response(null, { status: 201 });
    expect(
      await submitContentClaim(validPayload(), {
        apiBase: API,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).toEqual({ status: 'created', id: '', reference: '' });
  });
});
