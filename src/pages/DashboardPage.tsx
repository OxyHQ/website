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
      <main className="flex-1">
        <div className="container font-mono flex flex-col min-h-[calc(100dvh-var(--site-header-height))]">
          {/* Header */}
          <header className="flex flex-col items-start font-mono text-sm uppercase gap-2 pt-6 mb-4 shrink-0">
            <p className="text-foreground font-mono my-0 whitespace-nowrap">
              Oxy Platform{" "}
              <span className="block font-mono text-muted-foreground">
                [Live Dashboard]
              </span>
            </p>
          </header>

          {/* Map + summary stats — takes available space */}
          <div className="relative flex-1 min-h-0">
            <div className="pointer-events-none w-full h-full flex items-center justify-center">
              <MapContainer activeCountries={stats.topCountries} />
            </div>

            <div className="min-[961px]:absolute min-[961px]:bottom-0 min-[961px]:left-0 z-10 pb-2">
              <div className="flex flex-col gap-y-4">
                <TotalRequests stats={stats} />
                <TopCountries stats={stats} />
              </div>
              <RegionCount stats={stats} />
            </div>
          </div>

          {/* Stats grid — always visible, pinned to bottom */}
          <section className="shrink-0 pt-16 pb-6">
            <StatsGrid stats={stats} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
