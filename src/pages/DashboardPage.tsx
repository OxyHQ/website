import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import MapContainer from "../components/dashboard/MapContainer";
import {
  TotalRequests,
  TopCountries,
  RegionCount,
  StatsGrid,
} from "../components/dashboard/StatsDisplay";
import { usePlatformStats } from "../api/hooks";

export default function DashboardPage() {
  const { data: stats } = usePlatformStats();

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main>
        <div className="container font-mono">
          {/* Hero: map behind, stats on top — fills viewport height */}
          <div className="relative h-[calc(100dvh-var(--site-header-height))] overflow-hidden">
            {/* Map layer — fills the entire hero, centered */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <MapContainer activeCountries={stats.topCountries} />
              </div>
            </div>

            {/* Stats overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between pt-6 pb-6">
              <header className="flex flex-col items-start font-mono text-sm uppercase gap-2">
                <p className="text-foreground font-mono my-0 whitespace-nowrap">
                  Oxy Platform{" "}
                  <span className="block font-mono text-muted-foreground">
                    [Live Dashboard]
                  </span>
                </p>
              </header>

              <div className="mt-auto">
                <div className="flex flex-col gap-y-4">
                  <TotalRequests stats={stats} />
                  <TopCountries stats={stats} />
                </div>
                <RegionCount stats={stats} />
              </div>
            </div>
          </div>

          {/* Stats grid below the hero */}
          <section className="mt-8 mb-12">
            <StatsGrid stats={stats} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
