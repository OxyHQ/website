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
          <div className="relative min-h-[calc(100dvh-var(--site-header-height))]">
            {/* Header */}
            <header className="flex flex-col items-start font-mono text-sm uppercase gap-2 pt-6 mb-4">
              <p className="text-foreground font-mono my-0 whitespace-nowrap">
                Oxy Platform{" "}
                <span className="block font-mono text-muted-foreground">
                  [Live Dashboard]
                </span>
              </p>
            </header>

            {/* Stats + Map side by side on desktop, stacked on mobile */}
            <div className="relative">
              {/* Map — right-aligned, stats overlap on left */}
              <div className="pointer-events-none w-full">
                <MapContainer activeCountries={stats.topCountries} />
              </div>

              {/* Stats overlay — bottom-left on top of map */}
              <div className="min-[961px]:absolute min-[961px]:bottom-0 min-[961px]:left-0 z-10 pb-4">
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
