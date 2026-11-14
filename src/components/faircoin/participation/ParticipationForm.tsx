import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@oxy.so/bloom/button';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Field } from '@oxy.so/bloom/field';
import { TextField, TextFieldInput } from '@oxy.so/bloom/text-field';
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
import { BrandScope } from '../../../theme/BrandScope';
import { Link } from '../../../lib/navigation';
import { useParticipationHref } from './shared';

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
  const href = useParticipationHref();
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
    if (receipt) {
      received.current?.focus({ preventScroll: true });
      received.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [receipt]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((name) => name !== field));
  }

  function focusSummary() {
    requestAnimationFrame(() => {
      summary.current?.focus({ preventScroll: true });
      summary.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  function showFailure(key: string) {
    setFailure(key);
    focusSummary();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !status?.acceptingApplications) return;
    setFailure(null);
    const parsed = faircoinApplicationSchema.safeParse(form);
    if (!parsed.success) {
      setErrors([...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]);
      focusSummary();
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
      <div className="min-w-0">
        <Field
          nativeID={fieldId(field)}
          label={label}
          error={fieldError(field)}
          required={!optional}
        >
          <TextField className="h-12" chromeClassName="!border-0 !bg-background" radius={12}>
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
          </TextField>
        </Field>
      </div>
    );
  }

  function longField(
    field: 'offering' | 'needs' | 'capacity' | 'availability' | 'conditions',
    maxLength: number,
  ) {
    const label = t(`faircoinParticipation.${field}`);
    return (
      <div className="min-w-0">
        <Field nativeID={fieldId(field)} label={label} error={fieldError(field)} required>
          <Textarea
            accessibilityLabel={label}
            value={form[field]}
            onValueChange={(value) => update(field, value)}
            maxLength={maxLength}
            rows={4}
            fieldClassName="!border-0 !bg-background !rounded-xl"
            inputClassName="!p-3"
            disabled={submitting}
          />
        </Field>
      </div>
    );
  }

  return (
    <>
      <section
        id="application"
        aria-labelledby="application-title"
        className="scroll-mt-28 px-[5px] lg:px-5"
      >
        <div className="faircoin-editorial-green relative isolate overflow-hidden rounded-[12px] bg-ring px-2 py-5 sm:px-6 sm:py-8 lg:rounded-[20px] lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-32 hidden size-[430px] -rotate-12 bg-primary-foreground/5 [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat] lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-20 hidden size-[440px] rotate-12 bg-primary-foreground/5 [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat] lg:block"
          />
          <BrandScope className="faircoin-editorial">
            <div className="faircoin-editorial relative mx-auto max-w-[1040px] rounded-[20px] bg-card p-4 text-foreground sm:p-7 lg:p-8 [&_.bloom-btn]:!bg-none [&_.bloom-btn::after]:!bg-none [&_.bloom-btn::after]:!shadow-none">
              <div className="mb-10 grid items-start gap-6 lg:grid-cols-[1fr_300px]">
                <div>
                  <h2
                    id="application-title"
                    className="text-3xl font-normal leading-tight tracking-[-.02em] sm:text-4xl"
                  >
                    {t('faircoinParticipation.propose')}
                  </h2>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                    {t('faircoinParticipation.noApproval')}
                  </p>
                </div>
                <aside className="rounded-2xl bg-background p-5 text-sm leading-relaxed">
                  <h3 className="font-medium">{t('faircoinParticipation.privacyTitle')}</h3>
                  {status?.acceptingApplications && (
                    <div className="mt-3 grid gap-2 text-muted-foreground">
                      <p>
                        {t('faircoinParticipation.retention', { days: status.retentionDays ?? '' })}
                      </p>
                      <p className="break-words">
                        {t('faircoinParticipation.deletion', {
                          email: status.privacyContact ?? '',
                        })}
                      </p>
                    </div>
                  )}
                </aside>
              </div>
              <div className="min-w-0">
                {!status && !statusError && (
                  <p role="status">{t('faircoinParticipation.loading')}</p>
                )}
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
                    className="grid scroll-mt-28 gap-4 py-8 outline-none"
                    data-nosnippet
                    data-pagefind-ignore
                  >
                    <h3 className="text-2xl font-normal">{t('faircoinParticipation.received')}</h3>
                    <p className="text-lg leading-relaxed">
                      {t('faircoinParticipation.receivedBody')}
                    </p>
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
                      className="scroll-mt-28 outline-none"
                    >
                      {(failure || errors.length > 0) && (
                        <div className="mb-8 rounded-xl bg-error-subtle p-5 text-error-text">
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
                                      const input = document.getElementById(fieldId(field));
                                      input?.focus({ preventScroll: true });
                                      input?.scrollIntoView({
                                        block: 'center',
                                        behavior: 'instant',
                                      });
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
                    <form
                      onSubmit={submit}
                      noValidate
                      aria-busy={submitting}
                      className="grid gap-10 lg:gap-12"
                    >
                      <fieldset className="min-w-0">
                        <legend className="mb-6 text-2xl leading-tight tracking-[-.02em]">
                          {t('faircoinParticipation.projectGroup')}
                        </legend>
                        <div className="grid gap-6 sm:grid-cols-2">
                          {shortField('projectName', 160)}
                          {shortField('website', 500, true)}
                          {shortField('contactName', 120)}
                          {shortField('contactEmail', 254)}
                        </div>
                      </fieldset>
                      <fieldset className="min-w-0">
                        <legend className="mb-6 text-2xl leading-tight tracking-[-.02em]">
                          {t('faircoinParticipation.offerGroup')}
                        </legend>
                        <div className="grid gap-6 sm:grid-cols-2">
                          {longField('offering', 2000)}
                          {longField('needs', 2000)}
                          {longField('capacity', 1000)}
                          {longField('availability', 1000)}
                        </div>
                      </fieldset>
                      <fieldset className="min-w-0">
                        <legend className="mb-6 text-2xl leading-tight tracking-[-.02em]">
                          {t('faircoinParticipation.logisticsGroup')}
                        </legend>
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="min-w-0">
                            <Field
                              nativeID={fieldId('modality')}
                              label={t('faircoinParticipation.modality')}
                              error={fieldError('modality')}
                            >
                              <OptionSelect
                                className="[&_[data-bloom-select-field]]:!min-h-12 [&_[data-bloom-select-field]]:!rounded-xl [&_[data-bloom-select-field]]:!border-0 [&_[data-bloom-select-field]]:![--bloom-select-paint:var(--background)] [&_[data-bloom-select-field]]:![--bloom-select-shadow:0_0_transparent]"
                                label={t('faircoinParticipation.modality')}
                                value={form.modality}
                                onValueChange={(value) =>
                                  update('modality', value as FormState['modality'])
                                }
                                disabled={submitting}
                                options={(['remote', 'local', 'both'] as const).map((value) => ({
                                  value,
                                  label: t(`faircoinParticipation.${value}`),
                                }))}
                              />
                            </Field>
                          </div>
                          {shortField('location', 160, form.modality === 'remote')}
                          <div className="sm:col-span-2">{longField('conditions', 2000)}</div>
                        </div>
                      </fieldset>
                      <div className="grid gap-6">
                        <Field
                          nativeID={fieldId('contactConsent')}
                          error={fieldError('contactConsent')}
                        >
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
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                          {t('faircoinParticipation.privacyBody')}
                        </p>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                          {t('faircoinParticipation.publicationNotice')}
                        </p>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                          {t('faircoinParticipation.privacyWarning')}
                        </p>
                        <div className="pt-2">
                          <Button
                            asChild
                            appearance="solid"
                            size="lg"
                            className="!min-h-14 !rounded-full !px-7 !font-normal"
                            disabled={submitting}
                          >
                            <button type="submit" disabled={submitting}>
                              {t(`faircoinParticipation.${submitting ? 'submitting' : 'submit'}`)}
                            </button>
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          </BrandScope>
        </div>
      </section>
      <div className="px-5 py-12 text-center lg:py-16">
        <Link
          to={href('/pilot/')}
          className="inline-flex min-h-12 items-center gap-6 rounded-full bg-background px-7 py-3 text-base transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {t('faircoinParticipation.how')}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </>
  );
}
