import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, useOxy } from '@oxy.so/services/ui/client';
import { getNormalizedUserHandle } from '@oxy.so/core';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Field } from '@oxy.so/bloom/field';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import TransparencyDocument from '../components/slices/TransparencyDocument';
import { ARTICLE_BLOCK } from '../components/slices/articleBlock';
import Button from '../components/ui/Button';
import { Link } from '../lib/navigation';
import { useTranslation } from '../lib/i18n';
import { COUNTER_NOTICE_PAGE } from '../lib/transparency';
import {
  CONTENT_CLAIM_COUNTER_NOTICE_LIMITS,
  COUNTER_NOTICE_FIELDS,
  COUNTER_NOTICE_STATEMENTS,
  COUNTER_NOTICE_STATEMENT_KEYS,
  EMPTY_COUNTER_NOTICE_FORM,
  normalizeReference,
  submitCounterNotice,
  validateCounterNotice,
  type CounterNoticeField,
  type CounterNoticeForm,
  type CounterNoticeStatement,
} from '../lib/contentClaimCounterNotice';

/**
 * `/transparency/legal/counter-notice` — the owner of content a claim removed
 * disputes the removal (17 U.S.C. § 512(g)(3); ADR 0043 D10 in Oxy core). The
 * notice is posted to the Oxy API's authenticated
 * `POST /content-claims/counter-notices` through the SDK session, so only the
 * account that owns the removed files can send one.
 *
 * As on the report form: nothing typed is lost on a failure (the error renders
 * ABOVE the still-populated form and takes focus), validation runs against the
 * API's own schema (`src/lib/contentClaimCounterNotice.ts`), and the form can
 * be read and filled before signing in — signing in opens the in-page account
 * dialog, so the form survives it.
 */

const LEGAL_EMAIL = 'legal@oxy.so';

const STATEMENT_LABEL: Record<CounterNoticeStatement, string> = {
  perjury: 'contentClaim.counterNotice.statementPerjury',
  jurisdiction: 'contentClaim.counterNotice.statementJurisdiction',
  serviceOfProcess: 'contentClaim.counterNotice.statementServiceOfProcess',
  disclosure: 'contentClaim.counterNotice.statementDisclosure',
};

/** The outcomes that are not about one field: shown in the panel above the form. */
type Failure =
  | { kind: 'failed' }
  | { kind: 'rate_limited'; retryAt?: Date }
  | { kind: 'not_found' }
  | { kind: 'already_sent' }
  | { kind: 'not_disputable' }
  | { kind: 'signed_out' };

interface Receipt {
  reference: string;
  fileCount: number;
  email: string;
}

const FAILURE_COPY: Record<Failure['kind'], { title: string; body: string }> = {
  failed: {
    title: 'contentClaim.counterNotice.errorTitle',
    body: 'contentClaim.counterNotice.errorBody',
  },
  rate_limited: {
    title: 'contentClaim.counterNotice.rateLimitedTitle',
    body: 'contentClaim.counterNotice.rateLimitedBody',
  },
  not_found: {
    title: 'contentClaim.counterNotice.notFoundTitle',
    body: 'contentClaim.counterNotice.notFoundBody',
  },
  already_sent: {
    title: 'contentClaim.counterNotice.alreadySentTitle',
    body: 'contentClaim.counterNotice.alreadySentBody',
  },
  not_disputable: {
    title: 'contentClaim.counterNotice.notDisputableTitle',
    body: 'contentClaim.counterNotice.notDisputableBody',
  },
  signed_out: {
    title: 'contentClaim.counterNotice.signedOutTitle',
    body: 'contentClaim.counterNotice.signedOutBody',
  },
};

export default function CounterNoticePage() {
  const { t, locale } = useTranslation();
  const { oxyServices } = useOxy();
  const { user, isAuthenticated, isAuthResolved, signIn } = useAuth();
  const [params] = useSearchParams();
  const formId = useId();

  // The email the owner was sent can link here with the claim's reference.
  const [form, setForm] = useState<CounterNoticeForm>(() => ({
    ...EMPTY_COUNTER_NOTICE_FORM,
    reference: normalizeReference(params.get('reference') ?? ''),
  }));
  /** Fields the owner has edited. Until then the session prefill is shown. */
  const [touched, setTouched] = useState<Partial<Record<CounterNoticeField, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<CounterNoticeField, string>>>({});
  /** Server messages with no field to sit under, and a 400's own summary. */
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [failure, setFailure] = useState<Failure | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | undefined>();
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Derived during render, as on the report form: the session resolves late,
  // and an effect copying it into state would overwrite what the owner typed.
  const sessionName =
    isAuthenticated && user ? user.name?.displayName || getNormalizedUserHandle(user) || '' : '';
  const sessionEmail = isAuthenticated && user ? user.email || '' : '';
  const sessionHandle = isAuthenticated && user ? getNormalizedUserHandle(user) || '' : '';
  const values: CounterNoticeForm = {
    ...form,
    name: touched.name ? form.name : form.name || sessionName,
    email: touched.email ? form.email : form.email || sessionEmail,
  };

  const update = <K extends CounterNoticeField>(key: K, value: CounterNoticeForm[K]) => {
    setTouched((current) => (current[key] ? current : { ...current, [key]: true }));
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const focusSummary = () => requestAnimationFrame(() => summaryRef.current?.focus());

  const fail = (next: Failure) => {
    setFailure(next);
    focusSummary();
  };

  async function submit() {
    setFailure(undefined);
    setGeneralErrors([]);

    const validation = validateCounterNotice(values);
    if (!validation.ok) {
      const translated: Partial<Record<CounterNoticeField, string>> = {};
      for (const [field, key] of Object.entries(validation.errors)) {
        translated[field as CounterNoticeField] = t(key, CONTENT_CLAIM_COUNTER_NOTICE_LIMITS);
      }
      setErrors(translated);
      focusSummary();
      return;
    }
    setErrors({});

    // The notice is the signed-in account's: without one there is nothing to
    // send it as. The in-page dialog keeps the form; the owner sends after.
    if (!isAuthenticated || !oxyServices) {
      void signIn();
      return;
    }

    setSubmitting(true);
    const result = await submitCounterNotice(validation.payload, {
      send: (body) =>
        oxyServices.http.requestAuthenticatedResponse({
          method: 'POST',
          url: '/content-claims/counter-notices',
          body,
          headers: { 'content-type': 'application/json' },
        }),
    });
    setSubmitting(false);

    switch (result.status) {
      case 'created':
        setReceipt({
          reference: result.reference || validation.payload.reference || '',
          fileCount: result.fileIds.length,
          email: validation.payload.subscriber.email,
        });
        requestAnimationFrame(() => {
          // `instant`: the site's smooth scrolling would otherwise race the focus.
          window.scrollTo({ top: 0, behavior: 'instant' });
          successRef.current?.focus();
        });
        return;
      case 'invalid':
        setErrors(result.fields);
        setGeneralErrors(
          [...result.unmatched, ...(result.message ? [result.message] : [])].filter(
            (message, index, all) => all.indexOf(message) === index,
          ),
        );
        focusSummary();
        return;
      case 'ambiguous':
        setErrors({ reference: t('contentClaim.counterNotice.ambiguous') });
        focusSummary();
        return;
      case 'rate_limited':
        fail({ kind: 'rate_limited', retryAt: result.retryAt });
        return;
      case 'not_found':
      case 'already_sent':
      case 'not_disputable':
      case 'signed_out':
        fail({ kind: result.status });
        return;
      default:
        fail({ kind: 'failed' });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!submitting) void submit();
  }

  const anchor = (field: CounterNoticeField) => `${formId}-${field}-field`;
  const optionalCaption = (label: string) => (
    <>
      {label}
      <span className="ms-1 text-muted-foreground">({t('contentClaim.optional')})</span>
    </>
  );
  const errorEntries = COUNTER_NOTICE_FIELDS.flatMap((field) => {
    const message = errors[field];
    return message ? [[field, message] as const] : [];
  });

  const retryTime =
    failure?.kind === 'rate_limited' && failure.retryAt
      ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
          failure.retryAt,
        )
      : undefined;
  const failureCopy = failure ? FAILURE_COPY[failure.kind] : undefined;

  return (
    <TransparencyDocument
      canonicalPath={COUNTER_NOTICE_PAGE.path}
      title={t('contentClaim.counterNotice.title')}
      eyebrow={t('contentClaim.eyebrow')}
      description={t('contentClaim.counterNotice.intro')}
      entries={[]}
      readingTools={false}
    >
      <div className={`${ARTICLE_BLOCK} w-full min-w-0`}>
        {receipt ? (
          <section className="flex flex-col items-start gap-4" aria-labelledby={`${formId}-done`}>
            <h2
              ref={successRef}
              id={`${formId}-done`}
              tabIndex={-1}
              className="text-subheading-3 text-primary outline-none"
            >
              {t('contentClaim.counterNotice.successTitle')}
            </h2>
            {receipt.reference && (
              <p className="text-body-1 text-foreground">
                {t('contentClaim.counterNotice.successReference', {
                  reference: receipt.reference,
                })}
              </p>
            )}
            {receipt.fileCount > 0 && (
              <p className="text-body-1 text-foreground">
                {receipt.fileCount === 1
                  ? t('contentClaim.counterNotice.successFilesOne')
                  : t('contentClaim.counterNotice.successFilesMany', { count: receipt.fileCount })}
              </p>
            )}
            <p className="text-body-1 text-foreground">
              {t('contentClaim.counterNotice.successEmail', { email: receipt.email })}
            </p>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              {t('contentClaim.counterNotice.successNext')}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/transparency/legal/" variant="outline">
                {t('contentClaim.successBack')}
              </Button>
            </div>
          </section>
        ) : (
          <>
            <div
              ref={summaryRef}
              data-claim-summary
              tabIndex={-1}
              role={
                errorEntries.length > 0 || generalErrors.length > 0 || failure ? 'alert' : undefined
              }
              className="outline-none"
            >
              {(errorEntries.length > 0 || generalErrors.length > 0) && (
                <div className="mb-8 rounded-2xl border border-error/40 bg-error-subtle p-5">
                  <h2 className="text-base text-error-text">
                    {t('contentClaim.errorSummaryTitle')}
                  </h2>
                  <ul className="mt-2 list-disc ps-5 text-sm text-error-text">
                    {errorEntries.map(([field, message]) => (
                      <li key={field}>
                        <a
                          href={`#${anchor(field)}`}
                          className="underline underline-offset-4"
                          onClick={(event) => {
                            const target = document
                              .getElementById(anchor(field))
                              ?.querySelector<HTMLElement>('input, textarea, [role="checkbox"]');
                            if (!target) return;
                            event.preventDefault();
                            target.focus();
                            target.scrollIntoView({ block: 'center' });
                          }}
                        >
                          {message}
                        </a>
                      </li>
                    ))}
                    {generalErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {failure && failureCopy && (
                <div className="mb-8 rounded-2xl border border-error/40 bg-error-subtle p-5">
                  <h2 className="text-base text-error-text">{t(failureCopy.title)}</h2>
                  <p className="mt-2 text-sm text-error-text">
                    {failure.kind === 'rate_limited' && retryTime
                      ? t('contentClaim.counterNotice.rateLimitedBodyAt', { time: retryTime })
                      : t(failureCopy.body, { email: LEGAL_EMAIL })}
                  </p>
                  {failure.kind === 'failed' && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => void submit()}
                      >
                        {t('contentClaim.retry')}
                      </Button>
                    </div>
                  )}
                  {failure.kind === 'signed_out' && (
                    <div className="mt-4">
                      <Button type="button" variant="outline" onClick={() => void signIn()}>
                        {t('contentClaim.counterNotice.signIn')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-10 rounded-2xl border border-border bg-card p-5" data-account-panel>
              {isAuthenticated ? (
                <p className="text-sm text-foreground">
                  {sessionHandle
                    ? t('contentClaim.counterNotice.signedInAs', { handle: sessionHandle })
                    : t('contentClaim.counterNotice.signedInAsAccount')}
                </p>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-foreground">
                    {t('contentClaim.counterNotice.signInRequired')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isAuthResolved}
                    onClick={() => void signIn()}
                  >
                    {t('contentClaim.counterNotice.signIn')}
                  </Button>
                </div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-12"
              aria-busy={submitting}
              noValidate
            >
              <Section title={t('contentClaim.counterNotice.sectionClaim')}>
                <div id={anchor('reference')} className="sm:max-w-[calc(50%-0.5rem)]">
                  <Field
                    nativeID={`${formId}-reference`}
                    label={t('contentClaim.counterNotice.reference')}
                    description={t('contentClaim.counterNotice.referenceHelp')}
                    error={errors.reference}
                  >
                    <TextFieldInput
                      label={t('contentClaim.counterNotice.reference')}
                      placeholder="OXY-XXXX-XXXX"
                      value={form.reference}
                      onValueChange={(next) => update('reference', next)}
                      autoComplete="off"
                      autoCapitalize="characters"
                    />
                  </Field>
                </div>
                <div id={anchor('fileIds')}>
                  <Field
                    nativeID={`${formId}-fileIds`}
                    label={optionalCaption(t('contentClaim.counterNotice.fileIds'))}
                    description={t(
                      'contentClaim.counterNotice.fileIdsHelp',
                      CONTENT_CLAIM_COUNTER_NOTICE_LIMITS,
                    )}
                    error={errors.fileIds}
                  >
                    <Textarea
                      value={form.fileIds}
                      onValueChange={(next) => update('fileIds', next)}
                      rows={3}
                    />
                  </Field>
                </div>
              </Section>

              <Section title={t('contentClaim.counterNotice.sectionMaterial')}>
                <div id={anchor('materialDescription')}>
                  <Field
                    nativeID={`${formId}-materialDescription`}
                    label={t('contentClaim.counterNotice.materialDescription')}
                    description={t(
                      'contentClaim.counterNotice.materialDescriptionHelp',
                      CONTENT_CLAIM_COUNTER_NOTICE_LIMITS,
                    )}
                    error={errors.materialDescription}
                  >
                    <Textarea
                      value={form.materialDescription}
                      onValueChange={(next) => update('materialDescription', next)}
                      maxLength={CONTENT_CLAIM_COUNTER_NOTICE_LIMITS.maxMaterial}
                      rows={3}
                    />
                  </Field>
                </div>
                <div id={anchor('materialLocation')}>
                  <Field
                    nativeID={`${formId}-materialLocation`}
                    label={t('contentClaim.counterNotice.materialLocation')}
                    description={t('contentClaim.counterNotice.materialLocationHelp')}
                    error={errors.materialLocation}
                  >
                    <TextFieldInput
                      label={t('contentClaim.counterNotice.materialLocation')}
                      placeholder={null}
                      value={form.materialLocation}
                      onValueChange={(next) => update('materialLocation', next)}
                      autoComplete="off"
                    />
                  </Field>
                </div>
                <div id={anchor('explanation')}>
                  <Field
                    nativeID={`${formId}-explanation`}
                    label={t('contentClaim.counterNotice.explanation')}
                    description={t(
                      'contentClaim.counterNotice.explanationHelp',
                      CONTENT_CLAIM_COUNTER_NOTICE_LIMITS,
                    )}
                    error={errors.explanation}
                  >
                    <Textarea
                      value={form.explanation}
                      onValueChange={(next) => update('explanation', next)}
                      maxLength={CONTENT_CLAIM_COUNTER_NOTICE_LIMITS.maxExplanation}
                      rows={6}
                    />
                  </Field>
                </div>
              </Section>

              <Section title={t('contentClaim.counterNotice.sectionYou')}>
                <p className="text-sm text-muted-foreground">
                  {t('contentClaim.counterNotice.youHelp')}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div id={anchor('name')}>
                    <Field
                      nativeID={`${formId}-name`}
                      label={t('contentClaim.counterNotice.name')}
                      error={errors.name}
                    >
                      <TextFieldInput
                        label={t('contentClaim.counterNotice.name')}
                        placeholder={null}
                        value={values.name}
                        onValueChange={(next) => update('name', next)}
                        autoComplete="name"
                      />
                    </Field>
                  </div>
                  <div id={anchor('email')}>
                    <Field
                      nativeID={`${formId}-email`}
                      label={t('contentClaim.email')}
                      error={errors.email}
                    >
                      <TextFieldInput
                        label={t('contentClaim.email')}
                        placeholder={null}
                        keyboardType="email-address"
                        value={values.email}
                        onValueChange={(next) => update('email', next)}
                        autoComplete="email"
                      />
                    </Field>
                  </div>
                  <div id={anchor('phone')}>
                    <Field
                      nativeID={`${formId}-phone`}
                      label={t('contentClaim.counterNotice.phone')}
                      error={errors.phone}
                    >
                      <TextFieldInput
                        label={t('contentClaim.counterNotice.phone')}
                        placeholder={null}
                        keyboardType="phone-pad"
                        inputMode="tel"
                        value={form.phone}
                        onValueChange={(next) => update('phone', next)}
                        autoComplete="tel"
                      />
                    </Field>
                  </div>
                </div>
                <div id={anchor('address')}>
                  <Field
                    nativeID={`${formId}-address`}
                    label={t('contentClaim.counterNotice.address')}
                    error={errors.address}
                  >
                    <Textarea
                      value={form.address}
                      onValueChange={(next) => update('address', next)}
                      maxLength={CONTENT_CLAIM_COUNTER_NOTICE_LIMITS.maxAddress}
                      autoComplete="street-address"
                      rows={3}
                    />
                  </Field>
                </div>
              </Section>

              <Section title={t('contentClaim.sectionStatements')}>
                {locale !== 'en' && (
                  <p className="text-sm text-muted-foreground">
                    {t('contentClaim.counterNotice.statementsEnglish')}
                  </p>
                )}
                {COUNTER_NOTICE_STATEMENT_KEYS.map((statement) => (
                  <div key={statement} id={anchor(statement)}>
                    <Field nativeID={`${formId}-${statement}`} error={errors[statement]}>
                      <Checkbox
                        checked={form[statement]}
                        onCheckedChange={(next) => update(statement, next)}
                        label={t(STATEMENT_LABEL[statement])}
                      />
                    </Field>
                    {/* What the API records the owner affirmed is this English
                        wording, versioned in @oxy.so/contracts. */}
                    {locale !== 'en' && (
                      <p lang="en" dir="ltr" className="mt-2 ps-8 text-xs text-muted-foreground">
                        {COUNTER_NOTICE_STATEMENTS[statement]}
                      </p>
                    )}
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  {t('contentClaim.counterNotice.warning')}
                </p>
                <div id={anchor('signature')} className="sm:max-w-[calc(50%-0.5rem)]">
                  <Field
                    nativeID={`${formId}-signature`}
                    label={t('contentClaim.signature')}
                    description={t('contentClaim.counterNotice.signatureHelp')}
                    error={errors.signature}
                  >
                    <TextFieldInput
                      label={t('contentClaim.signature')}
                      placeholder={null}
                      value={form.signature}
                      onValueChange={(next) => update('signature', next)}
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </Section>

              <div className="flex flex-col gap-4 border-t border-border pt-6">
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {t('contentClaim.counterNotice.privacyNotice')}{' '}
                  <Link to="/transparency/legal/privacy" className="underline underline-offset-4">
                    {t('contentClaim.privacyLink')}
                  </Link>
                </p>
                <div>
                  <Button type="submit" variant="inverse" disabled={submitting}>
                    {submitting
                      ? t('contentClaim.counterNotice.submitting')
                      : isAuthenticated
                        ? t('contentClaim.counterNotice.submit')
                        : t('contentClaim.counterNotice.submitSignIn')}
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </TransparencyDocument>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="mb-5 text-subheading-3 text-primary">{title}</legend>
      {children}
    </fieldset>
  );
}
