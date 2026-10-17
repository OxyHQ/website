import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useOxy } from '@oxy.so/services/ui/client';
import { getNormalizedUserHandle } from '@oxy.so/core';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Field } from '@oxy.so/bloom/field';
import { RadioGroup } from '@oxy.so/bloom/radio';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import TransparencyDocument from '../components/slices/TransparencyDocument';
import { ARTICLE_BLOCK } from '../components/slices/articleBlock';
import Button from '../components/ui/Button';
import { Link } from '../lib/navigation';
import { useTranslation } from '../lib/i18n';
import { OXY_API } from '../lib/oxyApi';
import { COUNTER_NOTICE_PAGE, REPORT_CONTENT_PAGE } from '../lib/transparency';
import {
  CLAIMANT_RELATIONSHIPS,
  CONTENT_CLAIM_KINDS,
  CONTENT_CLAIM_LIMITS,
  EMPTY_CONTENT_CLAIM_FORM,
  isRightsClaim,
  submitContentClaim,
  validateContentClaim,
  type ClaimantRelationship,
  type ContentClaimField,
  type ContentClaimForm,
  type ContentClaimKind,
} from '../lib/contentClaims';

/**
 * `/transparency/legal/report-content` — the public intake for rights claims
 * and removal requests (ADR 0043 D10 in Oxy core). Claims are posted to the
 * Oxy API's `POST /content-claims` and land in the staff review queue in the
 * console; this page owns only the form.
 *
 * As on `/contact/sales`: nothing typed is lost on a failure (the error renders
 * ABOVE the still-populated form and takes focus), validation runs against the
 * same schema the request is built from (`src/lib/contentClaims.ts`), and a
 * signed-in visitor's account is a convenience, never a requirement.
 */

const KIND_COPY: Record<ContentClaimKind, { label: string; help: string; goodFaith: string }> = {
  copyright: {
    label: 'contentClaim.kindCopyright',
    help: 'contentClaim.kindCopyrightHelp',
    goodFaith: 'contentClaim.goodFaithRights',
  },
  trademark: {
    label: 'contentClaim.kindTrademark',
    help: 'contentClaim.kindTrademarkHelp',
    goodFaith: 'contentClaim.goodFaithRights',
  },
  privacy: {
    label: 'contentClaim.kindPrivacy',
    help: 'contentClaim.kindPrivacyHelp',
    goodFaith: 'contentClaim.goodFaithPrivacy',
  },
  illegal_content: {
    label: 'contentClaim.kindIllegal',
    help: 'contentClaim.kindIllegalHelp',
    goodFaith: 'contentClaim.goodFaithIllegal',
  },
  other: {
    label: 'contentClaim.kindOther',
    help: 'contentClaim.kindOtherHelp',
    goodFaith: 'contentClaim.goodFaithOther',
  },
};

const RELATIONSHIP_LABEL: Record<ClaimantRelationship, string> = {
  rights_holder: 'contentClaim.relationshipRightsHolder',
  authorized_agent: 'contentClaim.relationshipAgent',
  affected_person: 'contentClaim.relationshipAffected',
  other: 'contentClaim.relationshipOther',
};

/** The statement texts a kind asks the claimant to affirm. */
function statementKeys(kind: ContentClaimKind | '') {
  return {
    goodFaith: KIND_COPY[kind || 'other'].goodFaith,
    accurate:
      kind && isRightsClaim(kind) ? 'contentClaim.accurateRights' : 'contentClaim.accurateGeneral',
  };
}

const LEGAL_EMAIL = 'legal@oxy.so';

type Failure = { kind: 'failed' } | { kind: 'rate_limited'; retryAt?: Date };

interface Receipt {
  reference: string;
  email: string;
}

export default function ReportContentPage() {
  const { t, locale } = useTranslation();
  const { user, isAuthenticated, oxyServices } = useOxy();
  const formId = useId();

  const [form, setForm] = useState<ContentClaimForm>(EMPTY_CONTENT_CLAIM_FORM);
  /** Fields the visitor has edited. Until then the session prefill is shown. */
  const [touched, setTouched] = useState<Partial<Record<ContentClaimField, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<ContentClaimField, string>>>({});
  /** Server messages with no field to sit under, and a 400's own summary. */
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [failure, setFailure] = useState<Failure | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | undefined>();
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Derived during render, as on /contact/sales: the session resolves late, and
  // an effect copying it into state would overwrite what the visitor typed.
  const sessionName =
    isAuthenticated && user ? user.name?.displayName || getNormalizedUserHandle(user) || '' : '';
  const sessionEmail = isAuthenticated && user ? user.email || '' : '';
  const values: ContentClaimForm = {
    ...form,
    name: touched.name ? form.name : form.name || sessionName,
    email: touched.email ? form.email : form.email || sessionEmail,
  };

  const statements = statementKeys(form.kind);
  const rightsClaim = form.kind !== '' && isRightsClaim(form.kind);

  const update = <K extends ContentClaimField>(key: K, value: ContentClaimForm[K]) => {
    setTouched((current) => (current[key] ? current : { ...current, [key]: true }));
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  /**
   * A ticked statement is an affirmation of ITS wording. Switching to a kind
   * whose statement reads differently clears the box, so nobody submits a
   * penalty-of-perjury declaration they never saw.
   */
  const changeKind = (kind: ContentClaimKind) => {
    const before = statementKeys(form.kind);
    const after = statementKeys(kind);
    setForm((current) => ({
      ...current,
      kind,
      goodFaith: before.goodFaith === after.goodFaith && current.goodFaith,
      accurate: before.accurate === after.accurate && current.accurate,
    }));
    setErrors((current) => {
      const { kind: _kind, ...rest } = current;
      return rest;
    });
  };

  const focusSummary = () => requestAnimationFrame(() => summaryRef.current?.focus());

  async function submit() {
    setFailure(undefined);
    setGeneralErrors([]);

    const validation = validateContentClaim(values);
    if (!validation.ok) {
      const translated: Partial<Record<ContentClaimField, string>> = {};
      for (const [field, key] of Object.entries(validation.errors)) {
        translated[field as ContentClaimField] = t(key, CONTENT_CLAIM_LIMITS);
      }
      setErrors(translated);
      focusSummary();
      return;
    }

    setErrors({});
    setSubmitting(true);
    const result = await submitContentClaim(validation.payload, {
      apiBase: OXY_API,
      accessToken: isAuthenticated ? oxyServices?.session.accessToken : null,
    });
    setSubmitting(false);

    switch (result.status) {
      case 'created':
        setReceipt({ reference: result.reference, email: validation.payload.claimant.email });
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
      case 'rate_limited':
        setFailure({ kind: 'rate_limited', retryAt: result.retryAt });
        focusSummary();
        return;
      default:
        setFailure({ kind: 'failed' });
        focusSummary();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!submitting) void submit();
  }

  function startOver() {
    setForm(EMPTY_CONTENT_CLAIM_FORM);
    setTouched({});
    setErrors({});
    setGeneralErrors([]);
    setFailure(undefined);
    setReceipt(undefined);
  }

  const anchor = (field: ContentClaimField) => `${formId}-${field}-field`;
  const optionalCaption = (label: string) => (
    <>
      {label}
      <span className="ms-1 text-muted-foreground">({t('contentClaim.optional')})</span>
    </>
  );
  const errorEntries = (Object.keys(EMPTY_CONTENT_CLAIM_FORM) as ContentClaimField[]).flatMap(
    (field) => {
      const message = errors[field];
      return message ? [[field, message] as const] : [];
    },
  );

  const retryTime =
    failure?.kind === 'rate_limited' && failure.retryAt
      ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
          failure.retryAt,
        )
      : undefined;

  return (
    <TransparencyDocument
      canonicalPath={REPORT_CONTENT_PAGE.path}
      title={t('contentClaim.title')}
      eyebrow={t('contentClaim.eyebrow')}
      description={t('contentClaim.intro')}
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
              {t('contentClaim.successTitle')}
            </h2>
            {receipt.reference && (
              <p className="text-body-1 text-foreground">
                {t('contentClaim.successReference', { reference: receipt.reference })}
              </p>
            )}
            <p className="text-body-1 text-foreground">
              {t('contentClaim.successEmail', { email: receipt.email })}
            </p>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              {t('contentClaim.successNext')}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="inverse" onClick={startOver}>
                {t('contentClaim.successAnother')}
              </Button>
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
                              ?.querySelector<HTMLElement>(
                                'input, textarea, [role="radio"], [role="checkbox"]',
                              );
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
              {failure && (
                <div className="mb-8 rounded-2xl border border-error/40 bg-error-subtle p-5">
                  <h2 className="text-base text-error-text">
                    {failure.kind === 'rate_limited'
                      ? t('contentClaim.rateLimitedTitle')
                      : t('contentClaim.errorTitle')}
                  </h2>
                  <p className="mt-2 text-sm text-error-text">
                    {failure.kind === 'rate_limited'
                      ? retryTime
                        ? t('contentClaim.rateLimitedBodyAt', { time: retryTime })
                        : t('contentClaim.rateLimitedBody')
                      : t('contentClaim.errorBody', { email: LEGAL_EMAIL })}
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
                </div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-12"
              aria-busy={submitting}
              noValidate
            >
              <Section title={t('contentClaim.sectionKind')}>
                <div id={anchor('kind')}>
                  {/* The legend above already says it; the group takes it as its name.
                      Plain radios, not cards: a card cuts its description to one
                      line, and the privacy option's GDPR note is the part that matters. */}
                  <Field error={errors.kind} multiple>
                    <RadioGroup
                      label={t('contentClaim.sectionKind')}
                      value={form.kind || undefined}
                      onValueChange={(next) => changeKind(next as ContentClaimKind)}
                      options={CONTENT_CLAIM_KINDS.map((kind) => ({
                        value: kind,
                        label: t(KIND_COPY[kind].label),
                        description: t(KIND_COPY[kind].help),
                      }))}
                    />
                  </Field>
                </div>
                {form.kind === 'illegal_content' && (
                  <p className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                    {t('contentClaim.emergencyNotice')}
                  </p>
                )}
              </Section>

              <Section title={t('contentClaim.sectionContent')}>
                <div id={anchor('contentUrls')}>
                  <Field
                    nativeID={`${formId}-contentUrls`}
                    label={t('contentClaim.contentUrls')}
                    description={t('contentClaim.contentUrlsHelp', CONTENT_CLAIM_LIMITS)}
                    error={errors.contentUrls}
                  >
                    <Textarea
                      value={form.contentUrls}
                      onValueChange={(next) => update('contentUrls', next)}
                      placeholder="https://"
                      rows={4}
                    />
                  </Field>
                </div>
                <div id={anchor('description')}>
                  <Field
                    nativeID={`${formId}-description`}
                    label={t('contentClaim.description')}
                    description={t('contentClaim.descriptionHelp', CONTENT_CLAIM_LIMITS)}
                    error={errors.description}
                  >
                    <Textarea
                      value={form.description}
                      onValueChange={(next) => update('description', next)}
                      maxLength={CONTENT_CLAIM_LIMITS.maxDescription}
                      rows={6}
                    />
                  </Field>
                </div>
                {rightsClaim && (
                  <div id={anchor('originalWorkUrl')}>
                    <Field
                      nativeID={`${formId}-originalWorkUrl`}
                      label={optionalCaption(t('contentClaim.originalWorkUrl'))}
                      description={t('contentClaim.originalWorkUrlHelp')}
                      error={errors.originalWorkUrl}
                    >
                      <TextFieldInput
                        label={`${t('contentClaim.originalWorkUrl')} (${t('contentClaim.optional')})`}
                        keyboardType="url"
                        inputMode="url"
                        placeholder="https://"
                        value={form.originalWorkUrl}
                        onValueChange={(next) => update('originalWorkUrl', next)}
                      />
                    </Field>
                  </div>
                )}
              </Section>

              <Section title={t('contentClaim.sectionYou')}>
                {isAuthenticated && (
                  <p className="text-sm text-muted-foreground">{t('contentClaim.signedInHelp')}</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div id={anchor('name')}>
                    <Field
                      nativeID={`${formId}-name`}
                      label={t('contentClaim.name')}
                      error={errors.name}
                    >
                      <TextFieldInput
                        label={t('contentClaim.name')}
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
                      description={t('contentClaim.emailHelp')}
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
                  <div id={anchor('organization')}>
                    <Field
                      nativeID={`${formId}-organization`}
                      label={optionalCaption(t('contentClaim.organization'))}
                      error={errors.organization}
                    >
                      <TextFieldInput
                        label={`${t('contentClaim.organization')} (${t('contentClaim.optional')})`}
                        placeholder={null}
                        value={form.organization}
                        onValueChange={(next) => update('organization', next)}
                        autoComplete="organization"
                      />
                    </Field>
                  </div>
                </div>
                <div id={anchor('relationship')}>
                  <Field
                    label={t('contentClaim.relationship')}
                    error={errors.relationship}
                    multiple
                  >
                    <RadioGroup
                      value={form.relationship || undefined}
                      onValueChange={(next) => update('relationship', next as ClaimantRelationship)}
                      options={CLAIMANT_RELATIONSHIPS.map((relationship) => ({
                        value: relationship,
                        label: t(RELATIONSHIP_LABEL[relationship]),
                      }))}
                    />
                  </Field>
                </div>
              </Section>

              <Section title={t('contentClaim.sectionStatements')}>
                <div id={anchor('goodFaith')}>
                  <Field nativeID={`${formId}-goodFaith`} error={errors.goodFaith}>
                    <Checkbox
                      checked={form.goodFaith}
                      onCheckedChange={(next) => update('goodFaith', next)}
                      label={t(statements.goodFaith)}
                    />
                  </Field>
                </div>
                <div id={anchor('accurate')}>
                  <Field nativeID={`${formId}-accurate`} error={errors.accurate}>
                    <Checkbox
                      checked={form.accurate}
                      onCheckedChange={(next) => update('accurate', next)}
                      label={t(statements.accurate)}
                    />
                  </Field>
                </div>
                {rightsClaim && (
                  <p className="text-sm text-muted-foreground">{t('contentClaim.rightsWarning')}</p>
                )}
                <div id={anchor('signature')} className="sm:max-w-[calc(50%-0.5rem)]">
                  <Field
                    nativeID={`${formId}-signature`}
                    label={t('contentClaim.signature')}
                    description={t('contentClaim.signatureHelp')}
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
                  {t('contentClaim.privacyNotice')}{' '}
                  <Link to="/transparency/legal/privacy" className="underline underline-offset-4">
                    {t('contentClaim.privacyLink')}
                  </Link>
                </p>
                <div>
                  <Button type="submit" variant="inverse" disabled={submitting}>
                    {submitting ? t('contentClaim.submitting') : t('contentClaim.submit')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('contentClaim.counterNoticePrompt')}{' '}
                  <Link to={COUNTER_NOTICE_PAGE.path} className="underline underline-offset-4">
                    {t('contentClaim.counterNoticeLink')}
                  </Link>
                </p>
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
