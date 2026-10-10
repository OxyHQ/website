import { useRef, useState } from 'react';
import { RiThumbUpLine } from '@oxy.so/bloom/icons/RiThumbUpLine';
import { RiThumbDownLine } from '@oxy.so/bloom/icons/RiThumbDownLine';
import Button from '../ui/Button';
import { Button as BloomButton } from '@oxy.so/bloom/button';
import { ARTICLE_BLOCK } from '../slices/articleBlock';
import { useTranslation } from '../../lib/i18n';
import { Link } from '../../lib/navigation';
import { apiFetch } from '../../api/client';
import { loadHelpByCategory, type HelpEntry } from '../../content/help-loader';

type StoredVote = { token: string; helpful?: boolean };
function savedVote(key: string): StoredVote {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null') as StoredVote | null;
    if (
      value &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value.token)
    )
      return {
        token: value.token,
        helpful: typeof value.helpful === 'boolean' ? value.helpful : undefined,
      };
  } catch {
    /* Storage may be unavailable; the in-memory token still deduplicates retries. */
  }
  return { token: crypto.randomUUID() };
}

export default function HelpArticleFooter({ entry }: { entry: HelpEntry }) {
  const { t, locale } = useTranslation();
  const key = `oxy:help-feedback:${entry.locale}:${entry.slug}`;
  const [vote, setVote] = useState(() => savedVote(key));
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const related = loadHelpByCategory(entry.frontmatter.category, locale).filter(
    (article) => article.slug !== entry.slug,
  );

  async function submit(helpful: boolean) {
    if (busy.current || vote.helpful === helpful) return;
    busy.current = true;
    setPending(true);
    setFailed(false);
    // Keep the same token even after a failed request or a reload, but never
    // mark a vote as saved until the backend acknowledges it.
    try {
      localStorage.setItem(key, JSON.stringify(vote));
    } catch {
      /* Optional persistence. */
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      await apiFetch('/help/feedback', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          slug: entry.slug,
          locale: entry.locale,
          token: vote.token,
          helpful,
        }),
      });
      const next = { token: vote.token, helpful };
      setVote(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* Optional persistence. */
      }
    } catch {
      setFailed(true);
    } finally {
      window.clearTimeout(timeout);
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div
      data-toc-skip
      data-help-article-footer
      className={`${ARTICLE_BLOCK} mt-12 w-full border-t border-border pt-8`}
    >
      <section aria-labelledby="help-feedback-heading" aria-busy={pending}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="help-feedback-heading" className="text-body-1">
            {t('help.wasThisHelpful')}
          </h2>
          <div className="flex gap-2">
            <BloomButton
              appearance="outline"
              disabled={pending}
              pressed={vote.helpful === true}
              onPress={() => void submit(true)}
            >
              <RiThumbUpLine width={18} height={18} aria-hidden />
              {t('help.helpfulYes')}
            </BloomButton>
            <BloomButton
              appearance="outline"
              disabled={pending}
              pressed={vote.helpful === false}
              onPress={() => void submit(false)}
            >
              <RiThumbDownLine width={18} height={18} aria-hidden />
              {t('help.helpfulNo')}
            </BloomButton>
          </div>
        </div>
        {pending && (
          <p role="status" className="mt-3 text-body-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {!pending &&
          (failed ? (
            <p role="alert" className="mt-3 text-body-sm text-muted-foreground">
              {t('help.feedbackError')}
            </p>
          ) : (
            vote.helpful !== undefined && (
              <p role="status" className="mt-3 text-body-sm text-muted-foreground">
                {t('help.feedbackThanks')}
              </p>
            )
          ))}
      </section>
      {related.length > 0 && (
        <section
          className="mt-10 border-t border-border pt-8"
          aria-labelledby="help-related-heading"
        >
          <h2 id="help-related-heading" className="mb-4 text-subheading-3 text-primary">
            {t('help.relatedArticles')}
          </h2>
          <ul className="divide-y divide-border">
            {related.map((article) => (
              <li key={article.slug}>
                <Link
                  to={`${article.locale === 'en' ? '' : `/${article.locale}`}/help/${article.slug}/`}
                  className="block py-4 text-body-1 underline-offset-4 hover:underline"
                >
                  {article.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <p className="text-body-1">{t('help.contactCta')}</p>
        <Button href="/help/">{t('help.contactCtaButton')}</Button>
      </div>
    </div>
  );
}
