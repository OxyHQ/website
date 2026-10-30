import PageShell from '../components/layout/PageShell';
import OxyOSContent from '../components/oxyos/OxyOSPage';
import { APP_CARD_IMAGES } from '../data/appCardImages';

export default function OxyOSPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy OS',
        description:
          'OxyOS is a new operating system built in the open: its own compositor, apps drawn natively with Bloom, and your Oxy account at the login.',
        canonicalPath: '/os',
        ogImage: APP_CARD_IMAGES['/os'],
      }}
      className="oxyos-theme bg-background"
      mainClassName="flex-1"
    >
      <div className="cursor-theme">
        <OxyOSContent />
      </div>
    </PageShell>
  );
}
