import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { ManifestoSection } from '../components/initiative/ManifestoSection';
import { imagePaths } from '../data/initiative';

export default function InitiativePage() {
  return (
    <div className="relative min-h-screen max-w-screen overflow-x-clip">
      <div className="absolute inset-x-0 top-0 z-50">
        <Navbar transparent />
      </div>
      <main className="bg-white dark:bg-black">
        <ManifestoSection imagePaths={imagePaths} />
      </main>
      <Footer />
    </div>
  );
}
