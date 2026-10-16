/**
 * The client for `POST {OXY_API}/content-claims` — the public "Report content /
 * rights claim" intake of ADR 0043 D10 (Oxy core,
 * `docs/adr/0043-application-owned-files.md`).
 *
 * The contract is `@oxy.so/contracts`' — the schema the API parses with is the
 * one the form validates against before it posts, so the form cannot accept
 * what the API would answer 400 to. This file is the browser's half around it:
 * the form shape, the request builder and a submitter that never throws.
 *
 * Every validation message is an i18n KEY under `contentClaim.errors.*`, filled
 * with `CONTENT_CLAIM_LIMITS` by the page, so the schema never carries English.
 */
import {
  CLAIMANT_RELATIONSHIPS,
  CONTENT_CLAIM_KINDS,
  CONTENT_CLAIM_LIMITS,
  contentClaimSubmissionSchema,
  isRightsClaim,
  type ClaimantRelationship,
  type ContentClaimKind,
  type ContentClaimSubmission,
} from '@oxy.so/contracts';

export {
  CLAIMANT_RELATIONSHIPS,
  CONTENT_CLAIM_KINDS,
  CONTENT_CLAIM_LIMITS,
  isRightsClaim,
  type ClaimantRelationship,
  type ContentClaimKind,
};

/** The schema the form validates with: the API's own. */
export const contentClaimSchema = contentClaimSubmissionSchema;

export type ContentClaimPayload = ContentClaimSubmission;

/** What the form holds: strings and booleans, exactly as typed. */
export interface ContentClaimForm {
  kind: ContentClaimKind | '';
  /** One URL per line. */
  contentUrls: string;
  description: string;
  originalWorkUrl: string;
  name: string;
  email: string;
  organization: string;
  relationship: ClaimantRelationship | '';
  goodFaith: boolean;
  accurate: boolean;
  signature: string;
}

export const EMPTY_CONTENT_CLAIM_FORM: ContentClaimForm = {
  kind: '',
  contentUrls: '',
  description: '',
  originalWorkUrl: '',
  name: '',
  email: '',
  organization: '',
  relationship: '',
  goodFaith: false,
  accurate: false,
  signature: '',
};

/** The form's fields, which is also the set of places an error can be shown. */
export type ContentClaimField = keyof ContentClaimForm;

const FORM_FIELDS = Object.keys(EMPTY_CONTENT_CLAIM_FORM) as ContentClaimField[];

/** Split the textarea into URLs: one per line (or whitespace), blanks and repeats dropped. */
export function splitContentUrls(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/\s+/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * The request body for a form, before validation.
 *
 * `originalWorkUrl` is sent only for a rights claim — the field is hidden for
 * the other kinds, and a value typed before switching kind must not travel
 * with a privacy report. Empty optionals are omitted rather than sent as `''`,
 * which a strict server schema would reject as an invalid URL.
 */
export function toContentClaimInput(form: ContentClaimForm): Record<string, unknown> {
  const originalWorkUrl = form.originalWorkUrl.trim();
  const organization = form.organization.trim();
  return {
    kind: form.kind || undefined,
    contentUrls: splitContentUrls(form.contentUrls),
    description: form.description,
    ...(form.kind && isRightsClaim(form.kind) && originalWorkUrl ? { originalWorkUrl } : {}),
    claimant: {
      name: form.name,
      email: form.email,
      ...(organization ? { organization } : {}),
      relationship: form.relationship || undefined,
    },
    statements: { goodFaith: form.goodFaith, accurate: form.accurate },
    signature: form.signature,
  };
}

/**
 * Map an issue path (ours or the server's `fields` key) to the form field
 * that shows it: `claimant.email` → `email`, `contentUrls.3` → `contentUrls`,
 * `statements.goodFaith` → `goodFaith`. `undefined` for a path the form has no
 * field for, which the page shows in the summary instead.
 */
export function fieldForPath(
  path: ReadonlyArray<PropertyKey> | string,
): ContentClaimField | undefined {
  const segments = (typeof path === 'string' ? path.split(/[.[\]]+/) : path.map(String)).filter(
    Boolean,
  );
  if (segments[0] === 'contentUrls') return 'contentUrls';
  const named = [...segments].reverse().find((segment) => Number.isNaN(Number(segment)));
  return FORM_FIELDS.find((field) => field === named);
}

export type ValidationResult =
  | { ok: true; payload: ContentClaimPayload }
  | { ok: false; errors: Partial<Record<ContentClaimField, string>> };

/** Validate a form. On failure: the first error key for each field, in form order. */
export function validateContentClaim(form: ContentClaimForm): ValidationResult {
  const parsed = contentClaimSchema.safeParse(toContentClaimInput(form));
  if (parsed.success) return { ok: true, payload: parsed.data };
  const found: Partial<Record<ContentClaimField, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = fieldForPath(issue.path);
    if (field && !found[field]) found[field] = issue.message;
  }
  const errors: Partial<Record<ContentClaimField, string>> = {};
  for (const field of FORM_FIELDS) if (found[field]) errors[field] = found[field];
  return { ok: false, errors };
}

export type SubmitResult =
  | { status: 'created'; id: string; reference: string }
  | {
      status: 'invalid';
      message?: string;
      fields: Partial<Record<ContentClaimField, string>>;
      /** Server field errors the form has no field for. */
      unmatched: string[];
    }
  | { status: 'rate_limited'; retryAt?: Date }
  | { status: 'failed'; httpStatus?: number };

export interface SubmitOptions {
  /** `OXY_API` from `src/lib/oxyApi.ts`; a parameter so tests never reach a host. */
  apiBase: string;
  /** The signed-in visitor's Oxy bearer, when there is one. The claim never needs it. */
  accessToken?: string | null;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

/** `Retry-After` is either delta-seconds or an HTTP date. */
export function parseRetryAfter(header: string | null, now: Date): Date | undefined {
  if (!header) return undefined;
  const value = header.trim();
  if (/^\d+$/.test(value)) return new Date(now.getTime() + Number(value) * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Post a validated claim.
 *
 * Never throws: a network failure is `failed`, like a 5xx, so the page has one
 * place to decide what the visitor sees and the form state is never lost to an
 * unhandled rejection.
 *
 * A signed-in visitor's bearer is attached so the claim is linked to their
 * account, but the endpoint is public: if the API answers 401 to a token that
 * has gone stale, the claim is sent once more without it rather than turning a
 * signed-in visitor away from a form anyone may use.
 */
export async function submitContentClaim(
  payload: ContentClaimPayload,
  { apiBase, accessToken, fetchImpl = fetch, now = () => new Date() }: SubmitOptions,
): Promise<SubmitResult> {
  const url = `${apiBase.replace(/\/+$/, '')}/content-claims`;
  const send = (token: string | null | undefined) =>
    fetchImpl(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

  let response: Response;
  try {
    response = await send(accessToken);
    if (response.status === 401 && accessToken) response = await send(null);
  } catch {
    return { status: 'failed' };
  }

  const body = (await readJson(response)) as Record<string, unknown> | undefined;

  // The contract answers 201; any other 2xx is still a stored claim, and
  // calling it a failure would invite a duplicate.
  if (response.ok) {
    const id = body?.id;
    const reference = body?.reference;
    if (typeof id === 'string' && typeof reference === 'string') {
      return { status: 'created', id, reference };
    }
    // Stored, but not in a shape we can show a reference from. Retrying would
    // file a duplicate and "failed" would be untrue; the page leaves the
    // reference out and the confirmation email still carries it.
    return { status: 'created', id: typeof id === 'string' ? id : '', reference: '' };
  }

  if (response.status === 400) {
    const fields: Partial<Record<ContentClaimField, string>> = {};
    const unmatched: string[] = [];
    const raw = body?.fields;
    if (raw && typeof raw === 'object') {
      for (const [path, message] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof message !== 'string') continue;
        const field = fieldForPath(path);
        if (field && !fields[field]) fields[field] = message;
        else if (!field) unmatched.push(message);
      }
    }
    return {
      status: 'invalid',
      message: typeof body?.error === 'string' ? body.error : undefined,
      fields,
      unmatched,
    };
  }

  if (response.status === 429) {
    return {
      status: 'rate_limited',
      retryAt: parseRetryAfter(response.headers.get('retry-after'), now()),
    };
  }

  return { status: 'failed', httpStatus: response.status };
}
