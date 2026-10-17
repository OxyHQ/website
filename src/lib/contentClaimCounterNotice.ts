/**
 * The client for `POST {OXY_API}/content-claims/counter-notices` — the owner of
 * content a claim took down disputes it (17 U.S.C. § 512(g)(3); ADR 0043 D10 in
 * Oxy core, `docs/adr/0043-application-owned-files.md`).
 *
 * Unlike the claim intake this endpoint is AUTHENTICATED: the API answers only
 * for files the signed-in account owns, and anything else is a 404 "as if there
 * were no claim". So the request goes through the Oxy SDK's session (its bearer
 * and its one 401 refresh), never a token the page copies out; the page hands
 * {@link submitCounterNotice} a `send` function that does exactly that, and the
 * tests hand it a fake.
 *
 * The schema is `@oxy.so/contracts`' `contentClaimCounterNoticeSchema`, the one
 * the API parses with. Every validation message is an i18n KEY under
 * `contentClaim.counterNotice.errors.*`, filled with
 * `CONTENT_CLAIM_COUNTER_NOTICE_LIMITS` by the page.
 */
import {
  CONTENT_CLAIM_COUNTER_NOTICE_LIMITS,
  CONTENT_CLAIM_ERROR_CODES,
  COUNTER_NOTICE_STATEMENTS,
  contentClaimCounterNoticeSchema,
  type ContentClaimCounterNotice,
  type ContentClaimCounterNoticeValidationKey,
} from '@oxy.so/contracts';
import { parseRetryAfter, splitContentUrls } from './contentClaims';

export { CONTENT_CLAIM_COUNTER_NOTICE_LIMITS, COUNTER_NOTICE_STATEMENTS };

/** The statements the notice affirms, in the order the form shows them. */
export const COUNTER_NOTICE_STATEMENT_KEYS = [
  'perjury',
  'jurisdiction',
  'serviceOfProcess',
  'disclosure',
] as const satisfies ReadonlyArray<keyof typeof COUNTER_NOTICE_STATEMENTS>;

export type CounterNoticeStatement = (typeof COUNTER_NOTICE_STATEMENT_KEYS)[number];

export type CounterNoticePayload = ContentClaimCounterNotice;

/** What the form holds: strings and booleans, exactly as typed. */
export interface CounterNoticeForm {
  /** The `OXY-XXXX-XXXX` the owner was emailed. */
  reference: string;
  /** Removed files' ids, one per line; optional when the reference is given. */
  fileIds: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  materialDescription: string;
  materialLocation: string;
  explanation: string;
  perjury: boolean;
  jurisdiction: boolean;
  serviceOfProcess: boolean;
  disclosure: boolean;
  signature: string;
}

export const EMPTY_COUNTER_NOTICE_FORM: CounterNoticeForm = {
  reference: '',
  fileIds: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  materialDescription: '',
  materialLocation: '',
  explanation: '',
  perjury: false,
  jurisdiction: false,
  serviceOfProcess: false,
  disclosure: false,
  signature: '',
};

/** The form's fields, which is also the set of places an error can be shown. */
export type CounterNoticeField = keyof CounterNoticeForm;

export const COUNTER_NOTICE_FIELDS = Object.keys(EMPTY_COUNTER_NOTICE_FORM) as CounterNoticeField[];

/**
 * A reference as a person may paste it — lower case, with spaces — made the
 * shape the API expects. Anything that is not a reference is returned trimmed,
 * for the schema to refuse.
 */
export function normalizeReference(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * The request body for a form, before validation. Blank optionals are omitted
 * rather than sent as `''` or `[]`, which the strict schema would refuse.
 */
export function toCounterNoticeInput(form: CounterNoticeForm): Record<string, unknown> {
  const reference = normalizeReference(form.reference);
  const fileIds = splitContentUrls(form.fileIds);
  return {
    ...(reference ? { reference } : {}),
    ...(fileIds.length > 0 ? { fileIds } : {}),
    subscriber: {
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
    },
    material: { description: form.materialDescription, location: form.materialLocation },
    explanation: form.explanation,
    statements: {
      perjury: form.perjury,
      jurisdiction: form.jurisdiction,
      serviceOfProcess: form.serviceOfProcess,
      disclosure: form.disclosure,
    },
    signature: form.signature,
  };
}

const PATH_TO_FIELD: Record<string, CounterNoticeField> = {
  reference: 'reference',
  // The page names a claim by reference; an id the API complains about is the
  // same question ("which claim?"), so it is shown there.
  claimId: 'reference',
  fileIds: 'fileIds',
  'subscriber.name': 'name',
  'subscriber.address': 'address',
  'subscriber.phone': 'phone',
  'subscriber.email': 'email',
  subscriber: 'name',
  'material.description': 'materialDescription',
  'material.location': 'materialLocation',
  material: 'materialDescription',
  explanation: 'explanation',
  'statements.perjury': 'perjury',
  'statements.jurisdiction': 'jurisdiction',
  'statements.serviceOfProcess': 'serviceOfProcess',
  'statements.disclosure': 'disclosure',
  statements: 'perjury',
  signature: 'signature',
};

/**
 * Map an issue path (ours or the server's `fields` key) to the form field that
 * shows it: `subscriber.email` → `email`, `fileIds.3` → `fileIds`. `undefined`
 * for a path the form has no field for, which the page shows in the summary.
 */
export function counterNoticeFieldForPath(
  path: ReadonlyArray<PropertyKey> | string,
): CounterNoticeField | undefined {
  const segments = (typeof path === 'string' ? path.split(/[.[\]]+/) : path.map(String))
    .filter(Boolean)
    .filter((segment) => Number.isNaN(Number(segment)));
  return PATH_TO_FIELD[segments.join('.')];
}

const CLAIM_REQUIRED: ContentClaimCounterNoticeValidationKey =
  'contentClaim.counterNotice.errors.claim';

export type CounterNoticeValidation =
  | { ok: true; payload: CounterNoticePayload }
  | { ok: false; errors: Partial<Record<CounterNoticeField, string>> };

/** Validate a form. On failure: the first error key for each field, in form order. */
export function validateCounterNotice(form: CounterNoticeForm): CounterNoticeValidation {
  const input = toCounterNoticeInput(form);
  const parsed = contentClaimCounterNoticeSchema.safeParse(input);
  if (parsed.success) return { ok: true, payload: parsed.data };
  const found: Partial<Record<CounterNoticeField, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = counterNoticeFieldForPath(issue.path);
    if (field && !found[field]) found[field] = issue.message;
  }
  // The schema's "name the claim" rule is a refinement, which Zod runs only
  // once every field parses — so on a form with other errors it would appear
  // only after those were fixed. Report it with the rest, in the schema's words.
  if (!('reference' in input) && !('fileIds' in input) && !found.reference) {
    found.reference = CLAIM_REQUIRED;
  }
  const errors: Partial<Record<CounterNoticeField, string>> = {};
  for (const field of COUNTER_NOTICE_FIELDS) if (found[field]) errors[field] = found[field];
  return { ok: false, errors };
}

export type CounterNoticeResult =
  | { status: 'created'; reference: string; fileIds: string[] }
  | {
      status: 'invalid';
      message?: string;
      fields: Partial<Record<CounterNoticeField, string>>;
      /** Server field errors the form has no field for. */
      unmatched: string[];
    }
  /** The files were removed after more than one claim: the reference decides which. */
  | { status: 'ambiguous' }
  /** No claim removed files of THIS account by that reference or file. */
  | { status: 'not_found' }
  /** This account already sent a counter-notice for the claim. */
  | { status: 'already_sent' }
  /** The claim is not in a state that can be disputed (not acted on, or closed). */
  | { status: 'not_disputable' }
  /** No session, or one the SDK could not refresh. */
  | { status: 'signed_out' }
  | { status: 'rate_limited'; retryAt?: Date }
  | { status: 'failed'; httpStatus?: number };

/**
 * Sends the JSON body to `POST /content-claims/counter-notices` with the
 * signed-in account's authority, and resolves to the raw response. In the page
 * this is the Oxy SDK's `http.requestAuthenticatedResponse`.
 */
export type CounterNoticeSend = (body: string) => Promise<Response>;

async function readJson(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    const body = await response.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function isAuthError(error: unknown): boolean {
  const { code, status } = (error ?? {}) as { code?: unknown; status?: unknown };
  return status === 401 || code === 'AUTH_REQUIRED' || code === 'AUTH_SESSION_CHANGED';
}

/**
 * Send a validated counter-notice.
 *
 * Never throws: a network failure is `failed`, like a 5xx, so the page has one
 * place to decide what the owner sees and what they typed is never lost to an
 * unhandled rejection. Nothing is retried behind the owner: a notice is a
 * sworn statement, and a duplicate is refused (409) anyway.
 */
export async function submitCounterNotice(
  payload: CounterNoticePayload,
  { send, now = () => new Date() }: { send: CounterNoticeSend; now?: () => Date },
): Promise<CounterNoticeResult> {
  let response: Response;
  try {
    response = await send(JSON.stringify(payload));
  } catch (error) {
    return isAuthError(error) ? { status: 'signed_out' } : { status: 'failed' };
  }

  const body = await readJson(response);
  const code = typeof body?.code === 'string' ? body.code : undefined;

  if (response.ok) {
    const fileIds = Array.isArray(body?.fileIds)
      ? body.fileIds.filter((id): id is string => typeof id === 'string')
      : [];
    // A stored notice in a shape we cannot read is still stored: "failed"
    // would invite a second sworn statement the API then refuses.
    return {
      status: 'created',
      reference: typeof body?.reference === 'string' ? body.reference : '',
      fileIds,
    };
  }

  switch (response.status) {
    case 400: {
      if (code === CONTENT_CLAIM_ERROR_CODES.counterNoticeAmbiguous) return { status: 'ambiguous' };
      const fields: Partial<Record<CounterNoticeField, string>> = {};
      const unmatched: string[] = [];
      const raw = body?.fields;
      if (raw && typeof raw === 'object') {
        for (const [path, message] of Object.entries(raw as Record<string, unknown>)) {
          if (typeof message !== 'string') continue;
          const field = counterNoticeFieldForPath(path);
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
    case 401:
      return { status: 'signed_out' };
    case 404:
      return { status: 'not_found' };
    case 409:
      return code === CONTENT_CLAIM_ERROR_CODES.counterNoticeExists
        ? { status: 'already_sent' }
        : { status: 'not_disputable' };
    case 429:
      return {
        status: 'rate_limited',
        retryAt: parseRetryAfter(response.headers.get('retry-after'), now()),
      };
    default:
      return { status: 'failed', httpStatus: response.status };
  }
}
