import PageShell from '../layout/PageShell';
import Navbar from '../layout/Navbar';
import { useTheme } from '@oxy.so/bloom/theme';
import LongformArticle, { type LongformArticleProps } from './LongformArticle';
import { useCurrentLocale } from '../../lib/i18n';
import { canonicalHref } from '../../lib/canonicalPath';

type Props = Omit<LongformArticleProps, 'locale' | 'shareUrl'> & {
  canonicalPath: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  theme?: string;
};

/** One reading screen for institutional MDX and CMS legal documents. */
export default function TransparencyDocument({
  canonicalPath,
  ogImage,
  ogType,
  theme = '',
  ...article
}: Props) {
  const locale = useCurrentLocale();
  const { isDark } = useTheme();
  return (
    <PageShell
      seo={{
        title: article.title,
        description: article.description ?? '',
        canonicalPath,
        ogImage,
        ogType,
      }}
      className={`${theme} slice-theme bg-background text-foreground`}
      mainClassName="flex-1"
      navbar={<Navbar transparent transparentOn={isDark ? 'dark' : 'light'} />}
    >
      <LongformArticle
        {...article}
        headerOverlay
        locale={locale}
        shareUrl={
          typeof window === 'undefined' ? canonicalHref(canonicalPath)! : window.location.href
        }
      />
    </PageShell>
  );
}
