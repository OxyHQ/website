import PageShell from '../components/layout/PageShell';
import Navbar from '../components/layout/Navbar';
import PeableContent from '../components/peable/PeableContent';

export default function PeablePage() {
  return (
    <PageShell
      className="peable-theme bg-background text-foreground"
      navbar={<Navbar transparent transparentOn="dark" />}
      seo={{
        title: 'Peable',
        description:
          'Payments across the Oxy ecosystem, with every fee shown before you confirm. In development: nothing is open for deposits yet.',
        canonicalPath: '/peable/',
      }}
      mainClassName="flex-1"
    >
      <PeableContent />
    </PageShell>
  );
}
