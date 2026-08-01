import { Suspense, createElement } from 'react'
import { MDXProvider } from '@mdx-js/react'
import PageShell from '../components/layout/PageShell'
import LongformArticle from '../components/slices/LongformArticle'
import { useCurrentLocale } from '../lib/i18n'
import { loadCompanyPage } from '../content/company-loader'
import { articleMdxComponents } from '../components/slices/articleMdxComponents'

/* ──────────────────────────────────────────────
 * Long-form company documents: `/company/manifesto`, `/company/charter`.
 *
 * Copy lives in `src/content/company/<slug>.mdx` and its frontmatter supplies
 * the title, date and reading time. The table of contents is derived from the
 * rendered headings by `LongformArticle`, so editing the MDX is enough to
 * change the page's navigation.
 * ──────────────────────────────────────────── */

interface CompanyArticlePageProps {
  /** MDX file under `src/content/company/`. */
  slug: string
  canonicalPath: string
  /** Closing band under the body. */
  cta: { title: string; label: string; href: string; external?: boolean }
}

export default function CompanyArticlePage({ slug, canonicalPath, cta }: CompanyArticlePageProps) {
  const locale = useCurrentLocale()
  const entry = loadCompanyPage(slug, locale)

  if (!entry) {
    // The MDX file is required — a hard failure during build/dev so missing
    // copy can't silently render nothing.
    return (
      <PageShell
        seo={{ title: 'Oxy', description: 'This page is missing its copy.', canonicalPath }}
        className="slice-theme bg-background"
        mainClassName="flex flex-1 items-center justify-center"
      >
        <p className="text-b3 text-alt-gray-e1">
          Copy missing — see <code>src/content/company/{slug}.mdx</code>.
        </p>
      </PageShell>
    )
  }

  const { frontmatter, headings, Component } = entry

  return (
    <PageShell
      seo={{
        title: frontmatter.title,
        description: frontmatter.description,
        canonicalPath,
        ogImage: frontmatter.ogImage,
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1"
    >
      <LongformArticle
        title={frontmatter.title}
        entries={headings}
        date={frontmatter.date}
        readingTime={frontmatter.readingTime}
        pdfHref={frontmatter.pdfHref}
        cta={cta}
      >
        <MDXProvider components={articleMdxComponents}>
          <Suspense fallback={<p className="text-b3 text-alt-gray-e1">Loading…</p>}>{createElement(Component)}</Suspense>
        </MDXProvider>
      </LongformArticle>
    </PageShell>
  )
}
