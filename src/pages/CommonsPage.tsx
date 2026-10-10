import CommonsContent from '../components/commons/CommonsContent';
import PageShell from '../components/layout/PageShell';
import Navbar from '../components/layout/Navbar';
import { APP_CARD_IMAGES } from '../data/appCardImages';
import '../styles/commons.css';

export default function CommonsPage() {
  return (
    <PageShell
      seo={{
        title: 'Commons, identity you actually own',
        description:
          'Oxy ID lives on your device, not in our database. Sign in across every Oxy app by proving possession of a key nobody else holds.',
        canonicalPath: '/commons',
        ogImage: APP_CARD_IMAGES['/commons'],
      }}
      className="slice-theme commons-theme bg-background"
      navbar={<Navbar transparent transparentOn="dark" />}
      mainClassName="flex-1"
      hideFooterDivider
    >
      <CommonsContent />
    </PageShell>
  );
}
