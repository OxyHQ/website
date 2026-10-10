import { useTheme } from '@oxy.so/bloom/theme';
import Navbar from '../layout/Navbar';
import PageShell from '../layout/PageShell';
import ResourceLinksSection from '../sections/ResourceLinksSection';
import TransparencyHero, { type TransparencyHeroProps } from './TransparencyHero';

export interface TransparencyCollectionProps {
  canonicalPath: string;
  description: string;
  hero: TransparencyHeroProps;
  resourcesTitle: string;
  resourcesTheme: string;
  groups: readonly {
    id: string;
    title: string;
    documents: readonly { path: string; title: string }[];
  }[];
}

/** One collection screen for the transparency centre and its document catalogues. */
export default function TransparencyCollection({
  canonicalPath,
  description,
  hero,
  resourcesTitle,
  resourcesTheme,
  groups,
}: TransparencyCollectionProps) {
  const { isDark } = useTheme();
  const title = hero.titleLines.join(' ');

  return (
    <PageShell
      seo={{ title, description, canonicalPath }}
      className="slice-theme bg-background text-foreground"
      navbar={<Navbar transparent transparentOn={isDark ? 'dark' : 'light'} />}
    >
      <TransparencyHero {...hero} />
      <div
        id="documents"
        className={`${resourcesTheme} scroll-mt-[var(--site-header-occlusion-bottom)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]`}
      >
        <ResourceLinksSection
          className={resourcesTheme}
          title={resourcesTitle}
          groups={groups.map(({ id, title: groupTitle, documents }) => ({
            id,
            title: groupTitle,
            links: documents.map(({ path, title: documentTitle }) => ({
              href: path,
              label: documentTitle,
            })),
          }))}
        />
      </div>
    </PageShell>
  );
}
