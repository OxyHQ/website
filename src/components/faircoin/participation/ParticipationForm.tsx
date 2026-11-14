import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@oxy.so/bloom/button';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Field } from '@oxy.so/bloom/field';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import OptionSelect from '../../ui/OptionSelect';
import { API_BASE } from '../../../api/client';
import { useTranslation } from '../../../lib/i18n';
import {
  faircoinApplicationSchema,
  faircoinApplicationReceiptSchema,
  faircoinParticipationStatusSchema,
  type FaircoinApplicationReceipt,
} from '../../../../server/contracts/faircoinApplication';
import { PARTICIPATION_GUTTER } from './shared';

type FormState = {
  projectName: string;
  website: string;
  contactName: string;
  contactEmail: string;
  offering: string;
  needs: string;
  capacity: string;
  availability: string;
  modality: 'remote' | 'local' | 'both';
  location: string;
  conditions: string;
  contactConsent: boolean;
  updatesConsent: boolean;
  website_confirm: string;
};

const EMPTY_FORM: FormState = {
  projectName: '',
  website: '',
  contactName: '',
  contactEmail: '',
  offering: '',
  needs: '',
  capacity: '',
  availability: '',
  modality: 'remote',
  location: '',
  conditions: '',
  contactConsent: false,
  updatesConsent: false,
  website_confirm: '',
};

/**
 * State stays in memory only. Failed requests leave every field mounted and
 * reuse the same key for the same normalized submission, including lost receipts.
 * No authenticated client or wallet connection is needed to express interest.
 */
export default function ParticipationForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const {
    data: status,
    isError: statusError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['faircoin-participation-status'],
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(`${API_BASE}/faircoin/applications/status`, {
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      });
      if (!response.ok) throw new Error('Unavailable');
      return faircoinParticipationStatusSchema.parse(await response.json());
    },
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<FaircoinApplicationReceipt | null>(null);
  const busy = useRef(false);
  const pending = useRef<{ body: string; key: string } | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const received = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (receipt) received.current?.focus();
  }, [receipt]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((name) => name !== field));
  }

  function showFailure(key: string) {
    setFailure(key);
    requestAnimationFrame(() => summary.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !status?.acceptingApplications) return;
    setFailure(null);
    const parsed = faircoinApplicationSchema.safeParse(form);
    if (!parsed.success) {
      setErrors([...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]);
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    setErrors([]);
    busy.current = true;
    setSubmitting(true);
    try {
      const body = JSON.stringify(parsed.data);
      if (pending.current?.body !== body) {
        pending.current = { body, key: crypto.randomUUID() };
      }
      const response = await fetch(`${API_BASE}/faircoin/applications`, {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': pending.current.key,
        },
        body,
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null);
        const code =
          typeof errorBody === 'object' && errorBody !== null && 'code' in errorBody
            ? errorBody.code
            : undefined;
        // A confirmed conflict means this key belongs to a different payload;
        // an explicit retry may use a new key. Ambiguous failures keep it.
        if (response.status === 409) pending.current = null;
        const key =
          response.status === 429
            ? 'rateLimited'
            : response.status === 409
              ? 'conflict'
              : response.status === 503 && code === 'APPLICATIONS_CLOSED'
                ? 'disabled'
                : response.status === 400
                  ? 'validationError'
                  : 'serverError';
        showFailure(key);
        return;
      }
      const confirmed = faircoinApplicationReceiptSchema.parse(await response.json());
      setReceipt(confirmed);
      setForm(EMPTY_FORM);
      pending.current = null;
    } catch {
      // Never render arbitrary server text or log a payload containing contact data.
      showFailure('serverError');
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  const fieldError = (field: string) =>
    errors.includes(field) ? t('faircoinParticipation.validationError') : undefined;
  const fieldId = (field: string) => `${id}-${field}`;

  function shortField(
    field: 'projectName' | 'website' | 'contactName' | 'contactEmail' | 'location',
    maxLength: number,
    optional = false,
  ) {
    const label = `${t(`faircoinParticipation.${field}`)}${optional ? ` (${t('faircoinParticipation.optional')})` : ''}`;
    return (
      <Field nativeID={fieldId(field)} label={label} error={fieldError(field)} required={!optional}>
        <TextFieldInput
          label={label}
          placeholder={null}
          value={form[field]}
          maxLength={maxLength}
          onValueChange={(value) => update(field, value)}
          disabled={submitting}
          keyboardType={
            field === 'contactEmail' ? 'email-address' : field === 'website' ? 'url' : 'default'
          }
          autoComplete={
            field === 'contactName'
              ? 'name'
              : field === 'contactEmail'
                ? 'email'
                : field === 'projectName'
                  ? 'organization'
                  : 'off'
          }
        />
      </Field>
    );
  }

  function longField(
    field: 'offering' | 'needs' | 'capacity' | 'availability' | 'conditions',
    maxLength: number,
  ) {
    const label = t(`faircoinParticipation.${field}`);
    return (
      <Field nativeID={fieldId(field)} label={label} error={fieldError(field)} required>
        <Textarea
          accessibilityLabel={label}
          value={form[field]}
          onValueChange={(value) => update(field, value)}
          maxLength={maxLength}
          rows={3}
          disabled={submitting}
        />
      </Field>
    );
  }

  return (
    <section id="application" className={`${PARTICIPATION_GUTTER} pb-20 lg:pb-32`}>
      <div className="grid gap-10 border-t border-border pt-10 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-6 lg:col-span-4">
          <h2 className="text-3xl font-normal leading-tight lg:text-4xl">
            {t('faircoinParticipation.privacyTitle')}
          </h2>
          <p className="text-base leading-relaxed">{t('faircoinParticipation.privacyBody')}</p>
          <p className="text-base leading-relaxed">
            {t('faircoinParticipation.publicationNotice')}
          </p>
          <p className="text-base leading-relaxed">{t('faircoinParticipation.privacyWarning')}</p>
          {status?.acceptingApplications && (
            <>
              <p className="text-base leading-relaxed">
                {t('faircoinParticipation.retention', { days: status.retentionDays ?? '' })}
              </p>
              <p className="break-words text-base leading-relaxed">
                {t('faircoinParticipation.deletion', { email: status.privacyContact ?? '' })}
              </p>
            </>
          )}
        </div>

        <div className="min-w-0 lg:col-span-7 lg:col-start-6">
          {!status && !statusError && <p role="status">{t('faircoinParticipation.loading')}</p>}
          {statusError && (
            <div className="space-y-4" role="status">
              <p>{t('faircoinParticipation.configError')}</p>
              <Button asChild appearance="outline" tone="neutral">
                <button type="button" disabled={isFetching} onClick={() => void refetch()}>
                  {t('faircoinParticipation.retry')}
                </button>
              </Button>
            </div>
          )}
          {status && !status.acceptingApplications && (
            <p role="status" className="max-w-xl text-xl leading-relaxed">
              {t('faircoinParticipation.disabled')}
            </p>
          )}
          <noscript>
            <p>{t('faircoinParticipation.noScript')}</p>
          </noscript>
          {receipt ? (
            <div
              ref={received}
              tabIndex={-1}
              role="status"
              className="space-y-4 outline-none"
              data-nosnippet
              data-pagefind-ignore
            >
              <h3 className="text-2xl font-normal">{t('faircoinParticipation.received')}</h3>
              <p className="text-lg leading-relaxed">{t('faircoinParticipation.receivedBody')}</p>
              <p className="break-all font-mono text-sm">
                {t('faircoinParticipation.receipt', { reference: receipt.id })}
              </p>
            </div>
          ) : status?.acceptingApplications ? (
            <div data-nosnippet data-pagefind-ignore>
              <div
                ref={summary}
                data-application-summary
                tabIndex={-1}
                role={failure || errors.length > 0 ? 'alert' : undefined}
                className="outline-none"
              >
                {(failure || errors.length > 0) && (
                  <div className="mb-8 rounded-xl border border-error bg-error-subtle p-5 text-error-text">
                    <p>{t(`faircoinParticipation.${failure ?? 'validationError'}`)}</p>
                    {errors.length > 0 && (
                      <ul className="mt-3 list-disc space-y-2 ps-5">
                        {errors.map((field) => (
                          <li key={field}>
                            <a
                              href={`#${fieldId(field)}`}
                              className="underline underline-offset-4"
                              onClick={(event) => {
                                event.preventDefault();
                                document.getElementById(fieldId(field))?.focus();
                              }}
                            >
                              {t(`faircoinParticipation.${field}`)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <form onSubmit={submit} noValidate aria-busy={submitting} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {shortField('projectName', 160)}
                  {shortField('website', 500, true)}
                  {shortField('contactName', 120)}
                  {shortField('contactEmail', 254)}
                </div>
                {longField('offering', 2000)}
                {longField('needs', 2000)}
                <div className="grid gap-6 sm:grid-cols-2">
                  {longField('capacity', 1000)}
                  {longField('availability', 1000)}
                </div>
                <Field
                  nativeID={fieldId('modality')}
                  label={t('faircoinParticipation.modality')}
                  error={fieldError('modality')}
                >
                  <OptionSelect
                    label={t('faircoinParticipation.modality')}
                    value={form.modality}
                    onValueChange={(value) => update('modality', value as FormState['modality'])}
                    disabled={submitting}
                    options={(['remote', 'local', 'both'] as const).map((value) => ({
                      value,
                      label: t(`faircoinParticipation.${value}`),
                    }))}
                  />
                </Field>
                {shortField('location', 160, form.modality === 'remote')}
                {longField('conditions', 2000)}
                <Field nativeID={fieldId('contactConsent')} error={fieldError('contactConsent')}>
                  <Checkbox
                    checked={form.contactConsent}
                    onCheckedChange={(value) => update('contactConsent', value)}
                    label={t('faircoinParticipation.contactConsent')}
                    disabled={submitting}
                  />
                </Field>
                <Checkbox
                  checked={form.updatesConsent}
                  onCheckedChange={(value) => update('updatesConsent', value)}
                  label={t('faircoinParticipation.updatesConsent')}
                  disabled={submitting}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[9999px] opacity-0"
                >
                  <label htmlFor={fieldId('website_confirm')}>
                    {t('faircoinParticipation.website')}
                  </label>
                  <input
                    id={fieldId('website_confirm')}
                    name="website_confirm"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website_confirm}
                    onChange={(event) => update('website_confirm', event.target.value)}
                  />
                </div>
                <div className="pt-4">
                  <Button asChild appearance="solid" size="lg" disabled={submitting}>
                    <button type="submit" disabled={submitting}>
                      {t(`faircoinParticipation.${submitting ? 'submitting' : 'submit'}`)}
                    </button>
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
