import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { ManifestoSection } from '../components/initiative/ManifestoSection';
import { imagePaths } from '../data/initiative';

export default function InitiativePage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="bg-white dark:bg-black">
        <ManifestoSection imagePaths={imagePaths} />
      </main>
      <Footer />
    </div>
  );
}
