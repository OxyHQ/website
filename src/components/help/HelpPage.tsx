import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { RiShieldCheckLine } from '@oxy.so/bloom/icons/RiShieldCheckLine';
import { ComposerPanel } from '@oxy.so/bloom/composer-panel';
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine';
import { startIntercomConversation } from '../../lib/intercom';
import { Link } from '../../lib/navigation';
import { useTranslation } from '../../lib/i18n';
import { getBrandMark } from '../../data/brand-assets';
import { HELP_CATEGORIES, loadHelpArticles, type HelpCategoryId } from '../../content/help-loader';
import Button from '../ui/Button';
import { useHelpDictation } from './useHelpDictation';

const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
const panels: { id: HelpCategoryId; image: string; position?: string; wide?: boolean }[] = [
  {
    id: 'account',
    image: '/images/landing/company-band.jpg',
    position: 'object-[center_40%]',
    wide: true,
  },
  { id: 'inbox', image: '/images/landing/inbox-phone.png', wide: true },
  { id: 'console', image: '/images/landing/video-thumb-in-house-ops.webp' },
  { id: 'getting-started', image: '/images/landing/hero-photo-03.avif' },
  { id: 'auth', image: '/images/landing/hero-photo-02.avif', wide: true },
];
const shortcutMarks: Record<HelpCategoryId, string> = {
  account: 'accounts',
  inbox: 'inbox',
  console: 'console',
  auth: 'auth',
  'getting-started': 'oxyos',
};
const focusClasses =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

/** Meta Help reference: centered search, six shortcuts, panoramic and asymmetric photo panels. */
export default function HelpPageContent() {
  const { t, locale } = useTranslation();
  const { pathname, hash } = useLocation();
  const [params] = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const sendingRef = useRef(false);
  const [voiceFailed, setVoiceFailed] = useState(false);
  const dictation = useHelpDictation(
    locale,
    (text) => {
      if (!sendingRef.current)
        setMessage((current) => [current.trim(), text].filter(Boolean).join(' '));
    },
    () => setVoiceFailed(true),
  );
  const query = params.get('q') ?? '';
  const selectedTopic = HELP_CATEGORIES.find(
    (category) => category.id === (params.get('topic') ?? hash.slice(1)),
  );
  const showAll = params.get('all') === '1';
  const filtered = !!query.trim() || !!selectedTopic || showAll;
  const articles = useMemo(() => loadHelpArticles(locale), [locale]);
  const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  const results = articles.filter((article) => {
    if (selectedTopic && article.frontmatter.category !== selectedTopic.id) return false;
    const body = normalizeSearch(
      [
        article.frontmatter.title,
        article.frontmatter.description,
        ...article.frontmatter.tags,
        article.searchText,
      ].join(' '),
    );
    return terms.every((term) => body.includes(term));
  });
  const topicHref = (id: string) => `${pathname}?topic=${id}#help-results`;
  useEffect(() => {
    if (selectedTopic) heading.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [selectedTopic]);
  const featured = articles.filter((article) => article.frontmatter.featured).slice(0, 4);

  return (
    <div data-help-center>
      <section
        aria-labelledby="help-title"
        className="px-6 pb-36 pt-24 text-center sm:pb-48 sm:pt-28"
      >
        <div className="mx-auto max-w-[848px]">
          <h1
            id="help-title"
            className="text-balance text-[28px] font-medium leading-tight tracking-tight sm:text-4xl sm:leading-[46px]"
          >
            {t('help.welcome')}
          </h1>
          <div className="mx-auto mt-7 max-w-[780px] text-start" aria-busy={sending}>
            <ComposerPanel
              testID="help-composer"
              value={message}
              placeholder={t('help.supportPrompt')}
              labels={{ message: t('help.supportPrompt'), send: t('common.submit') }}
              addMenu={[]}
              permissions={[]}
              listening={dictation.listening}
              onListeningChange={(next) => {
                if (sending) return;
                setVoiceFailed(false);
                dictation.setActive(next);
              }}
              disabled={sending || !message.trim()}
              onValueChange={(value) => {
                setMessage(value);
                setSendFailed(false);
              }}
              onSubmit={async (value) => {
                if (!value.trim() || sendingRef.current) return;
                dictation.setActive(false);
                sendingRef.current = true;
                setSending(true);
                setSendFailed(false);
                try {
                  await startIntercomConversation(value);
                  setMessage((current) => (current === value ? '' : current));
                } catch {
                  setSendFailed(true);
                } finally {
                  sendingRef.current = false;
                  setSending(false);
                }
              }}
            />
            {sending && (
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                {t('help.openingSupport')}
              </p>
            )}
            {voiceFailed && (
              <p role="alert" className="mt-3 text-sm text-muted-foreground">
                {t('help.voiceUnavailable')}
              </p>
            )}
            {sendFailed && (
              <p role="alert" className="mt-3 text-sm text-muted-foreground">
                {t('help.supportUnavailable')}
              </p>
            )}
          </div>
        </div>
      </section>

      {filtered && (
        <section
          id="help-results"
          aria-labelledby="help-results-heading"
          className="container scroll-mt-28 pb-20"
        >
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2
              id="help-results-heading"
              ref={heading}
              tabIndex={-1}
              className="text-2xl outline-none sm:text-4xl"
            >
              {query.trim()
                ? t('help.searchResults')
                : (selectedTopic?.label ?? t('help.allArticles'))}
            </h2>
            <Link
              to={pathname}
              className={`rounded-sm underline underline-offset-4 ${focusClasses}`}
            >
              {t('help.clearFilters')}
            </Link>
          </div>
          <p role="status" aria-live="polite" className="mb-5 text-muted-foreground">
            {t(results.length === 1 ? 'help.articleCountOne' : 'help.articleCountOther', {
              count: results.length,
            })}
          </p>
          {results.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((article) => (
                <Link
                  key={article.slug}
                  to={`${article.locale === 'en' ? '' : `/${article.locale}`}/help/${article.slug}/`}
                  data-help-result
                  className={`rounded-3xl bg-surface p-6 transition-colors hover:bg-secondary ${focusClasses}`}
                >
                  <h3 className="text-xl font-medium">{article.frontmatter.title}</h3>
                  <p className="mt-3 text-muted-foreground">{article.frontmatter.description}</p>
                  <p className="mt-5 text-sm text-muted-foreground">
                    {t('help.readTime', { count: article.readingMinutes })}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p>{t('help.noResults')}</p>
          )}
        </section>
      )}

      <section aria-labelledby="help-ecosystem-title" className="mx-auto max-w-[1488px] px-6">
        <div className="mb-8 text-center">
          <h2
            id="help-ecosystem-title"
            className="text-3xl font-medium tracking-tight sm:text-4xl sm:leading-[46px]"
          >
            {t('help.ecosystemHeading')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('help.ecosystemDescription')}</p>
        </div>
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {HELP_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={topicHref(category.id)}
              data-help-topic={category.id}
              className={`flex min-h-32 flex-col items-start justify-between gap-4 rounded-3xl bg-surface px-6 py-4 transition-colors hover:bg-secondary ${focusClasses}`}
            >
              <span className="flex size-12 items-center justify-center" aria-hidden="true">
                {category.id === 'auth' ? (
                  <RiShieldCheckLine width={48} height={48} fill="currentColor" />
                ) : (
                  <img
                    src={getBrandMark(shortcutMarks[category.id])}
                    alt=""
                    className="size-12 object-contain"
                  />
                )}
              </span>
              <span className="text-xl leading-tight sm:text-2xl">{category.label}</span>
            </Link>
          ))}
          <Link
            to="/one/"
            className={`flex min-h-32 flex-col items-start justify-between gap-4 rounded-3xl bg-surface px-6 py-4 transition-colors hover:bg-secondary ${focusClasses}`}
          >
            <img src={getBrandMark('accounts')} alt="" className="size-12 object-contain" />
            <span className="text-xl sm:text-2xl">Oxy One</span>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {panels.map((panel, index) => {
            const category = HELP_CATEGORIES.find((item) => item.id === panel.id)!;
            const lead = index === 0;
            return (
              <article
                key={panel.id}
                className={`help-photo-theme relative isolate flex min-h-[420px] overflow-hidden rounded-3xl bg-background text-foreground ${lead ? 'md:col-span-3 md:min-h-[464px] md:items-center' : panel.wide ? 'md:col-span-2 md:min-h-[576px]' : 'md:min-h-[576px]'}`}
              >
                <img
                  src={panel.image}
                  alt=""
                  loading="lazy"
                  className={`absolute inset-0 -z-20 size-full object-cover ${panel.position ?? ''}`}
                />
                <div
                  className={`absolute inset-0 -z-10 ${lead ? 'bg-linear-to-t from-background/95 via-background/40 to-transparent md:bg-linear-to-r md:from-background/85 md:via-background/30' : 'bg-linear-to-t from-background/95 via-background/30 to-transparent'}`}
                />
                <div
                  className={`flex w-full flex-col justify-end gap-4 p-7 sm:p-10 ${lead ? 'items-center text-center md:max-w-[480px] md:items-start md:p-12 md:text-start' : 'items-center text-center'}`}
                >
                  <h3
                    className={`text-balance font-medium leading-tight ${lead ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}
                  >
                    {category.label}
                  </h3>
                  <p className="max-w-lg text-pretty text-base leading-snug">
                    {category.description}
                  </p>
                  <Button href={topicHref(category.id)} className="mt-2 rounded-full">
                    {category.label} · {t('help.seoTitle')}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="help-featured-title"
        className="mx-auto max-w-[1488px] px-6 pt-20 sm:pt-24"
      >
        <h2 id="help-featured-title" className="mb-8 text-center text-2xl">
          {t('help.featuredHeading')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((article, index) => (
            <article
              key={article.slug}
              className={`help-photo-theme relative isolate flex min-h-[400px] items-end overflow-hidden rounded-3xl bg-background text-foreground ${index < 2 ? 'md:min-h-[640px]' : ''}`}
            >
              <img
                src={
                  [
                    '/images/landing/identity-app.webp',
                    '/images/landing/hero-photo-03.avif',
                    '/images/landing/video-thumb-in-house-ops.webp',
                    '/images/landing/company-band.jpg',
                  ][index]
                }
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-20 size-full object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-linear-to-t from-background/95 via-background/25 to-transparent" />
              <div className="flex w-full flex-col items-center p-8 text-center sm:p-12">
                <h3 className="text-balance text-3xl font-medium leading-tight">
                  {article.frontmatter.title}
                </h3>
                <p className="mt-4 max-w-lg text-pretty">{article.frontmatter.description}</p>
                <Button
                  href={`${article.locale === 'en' ? '' : `/${article.locale}`}/help/${article.slug}/`}
                  className="mt-6 rounded-full"
                >
                  {t('help.readTime', { count: article.readingMinutes })}
                  <RiArrowRightLine aria-hidden={true} width={16} height={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="help-more-title"
        className="mx-auto max-w-[1488px] px-6 py-20 sm:py-24"
      >
        <h2 id="help-more-title" className="mb-8 text-center text-3xl font-medium">
          {t('help.moreSupport')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={topicHref(category.id)}
              className={`flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-surface ${focusClasses}`}
            >
              {category.label}
              <RiArrowRightLine aria-hidden={true} width={16} height={16} />
            </Link>
          ))}
          <a
            href="mailto:support@oxy.so"
            className={`flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-surface ${focusClasses}`}
          >
            {t('help.contactCtaButton')}
            <RiArrowRightLine aria-hidden={true} width={16} height={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
