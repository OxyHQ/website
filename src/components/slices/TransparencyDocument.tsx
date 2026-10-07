import PageShell from '../layout/PageShell'
import Navbar from '../layout/Navbar'
import { useTheme } from '@oxy.so/bloom/theme'
import LongformArticle, { type LongformArticleProps } from './LongformArticle'
import { Link } from '../../lib/navigation'
import { useCurrentLocale } from '../../lib/i18n'
import { canonicalHref } from '../../lib/canonicalPath'

type Props = Omit<LongformArticleProps, 'locale' | 'shareUrl' | 'contentNavigation'> & {
  canonicalPath: string
  ogImage?: string
  theme?: string
  legal?: boolean
}

/** One reading screen for institutional MDX and CMS legal documents. */
export default function TransparencyDocument({ canonicalPath, ogImage, theme = '', legal, ...article }: Props) {
  const locale = useCurrentLocale()
  const { isDark } = useTheme()
  const isCollection = canonicalPath === '/transparency'
  const isLegalCollection = canonicalPath === '/transparency/legal'
  const currentLabel = isLegalCollection ? 'Legal' : legal ? article.title : article.eyebrow ?? article.title
  return (
    <PageShell
      seo={{ title: article.title, description: article.description ?? '', canonicalPath, ogImage }}
      className={`${theme} slice-theme bg-background text-foreground`}
      mainClassName="flex-1"
      navbar={<Navbar transparent transparentOn={isDark ? 'dark' : 'light'} />}
    >
      <LongformArticle
        {...article}
        headerOverlay
        locale={locale}
        shareUrl={typeof window === 'undefined' ? canonicalHref(canonicalPath)! : window.location.href}
        contentNavigation={!isCollection && (
          <nav aria-label="Breadcrumb" className="container pt-6 sm:pt-8">
            <ol className="flex min-w-0 items-center gap-2 text-b4 text-muted-foreground sm:gap-3">
              <li className="shrink-0">
                <Link to="/transparency/" className="transition-colors hover:text-primary">Transparency Center</Link>
              </li>
              {legal && (
                <li className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span aria-hidden="true">/</span>
                  <Link to="/transparency/legal/" className="transition-colors hover:text-primary">Legal</Link>
                </li>
              )}
              <li className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span aria-hidden="true">/</span>
                <span aria-current="page" title={currentLabel} className="truncate text-foreground">{currentLabel}</span>
              </li>
            </ol>
          </nav>
        )}
      />
    </PageShell>
  )
}
