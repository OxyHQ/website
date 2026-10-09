import { Suspense, createElement } from 'react'
import { useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import HelpArticleFooter from '../components/help/HelpArticleFooter'
import PageShell from '../components/layout/PageShell'
import TransparencyDocument from '../components/slices/TransparencyDocument'
import { articleMdxComponents } from '../components/slices/articleMdxComponents'
import { ARTICLE_BLOCK } from '../components/slices/articleBlock'
import { Link } from '../lib/navigation'
import { useCurrentLocale, useTranslation } from '../lib/i18n'
import { HELP_CATEGORIES, loadHelpBySlug } from '../content/help-loader'

/** Help and institutional documents share one reading screen and MDX renderer. */
export default function HelpArticlePage() {
  const params = useParams<{ '*': string }>()
  const locale = useCurrentLocale()
  const { t } = useTranslation()
  const slug = (params['*'] ?? '').replace(/\/+$/, '')
  const entry = loadHelpBySlug(slug, locale)

  if (!entry) {
    return (
      <PageShell
        seo={{ title: t('errors.notFoundTitle'), description: t('errors.notFoundDescription'), canonicalPath: `/help/${slug}/`, noIndex: true }}
        className="help-theme bg-background text-foreground"
        mainClassName="container flex flex-1 flex-col items-center justify-center gap-6 py-32 text-center"
      >
        <h1 className="text-heading-responsive-lg">{t('errors.notFoundTitle')}</h1>
        <p className="text-muted-foreground">{t('errors.notFoundDescription')}</p>
        <Link to="/help/" className="text-primary underline underline-offset-4">{t('help.seoTitle')}</Link>
      </PageShell>
    )
  }

  const { frontmatter, headings, Component } = entry
  const category = HELP_CATEGORIES.find(item => item.id === frontmatter.category)
  const updated = frontmatter.updated ? new Date(frontmatter.updated) : null
  const date = updated && !Number.isNaN(updated.getTime())
    ? t('help.lastUpdated', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(updated) })
    : undefined

  return (
    <TransparencyDocument
      key={`${locale}:${entry.slug}`}
      canonicalPath={`/help/${entry.slug}/`}
      ogImage={entry.cover}
      ogType="article"
      theme="help-theme"
      title={frontmatter.title}
      eyebrow={category?.label}
      description={frontmatter.description}
      entries={headings}
      date={date}
      readingTime={t('help.readTime', { count: entry.readingMinutes })}
      cta={{ title: t('help.seoTitle'), label: t('help.allArticles'), href: '/help/?all=1#help-results' }}
    >
      <MDXProvider components={articleMdxComponents}>
        <Suspense fallback={<p className={`${ARTICLE_BLOCK} text-muted-foreground`}>Loading…</p>}>
          {createElement(Component)}
        </Suspense>
      </MDXProvider>
      <HelpArticleFooter entry={entry} />
    </TransparencyDocument>
  )
}
