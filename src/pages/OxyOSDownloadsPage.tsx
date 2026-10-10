import PageShell from '../components/layout/PageShell';
import OxyOSDownloadsContent from '../components/oxyos/OxyOSDownloadsPage';

export default function OxyOSDownloadsPage() {
  return (
    <PageShell
      seo={{
        title: 'Download Oxy OS',
        description:
          'Download Oxy OS: every release, its architecture and where to get the ISO image.',
        canonicalPath: '/os/downloads',
      }}
      className="oxyos-theme bg-background"
      mainClassName="flex-1"
    >
      <OxyOSDownloadsContent />
    </PageShell>
  );
}
