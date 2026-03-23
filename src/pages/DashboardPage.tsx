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
        <div className="container font-mono relative overflow-hidden flex flex-col md:block">
          <div className="w-full space-y-1.5 mt-1 mb-12">
          <div className="flex flex-col min-[961px]:hidden">
            <header className="flex flex-col items-start font-mono text-sm uppercase gap-2 pt-6 mb-6">
              <p className="text-foreground font-mono my-0 whitespace-nowrap">
                Oxy Platform{" "}
                <span className="block font-mono text-muted-foreground">
                  [Live Dashboard]
                </span>
              </p>
            </header>

            <section className="pb-6 w-full">
              <div className="flex flex-col gap-y-6">
                <TotalRequests stats={stats} />
                <TopCountries stats={stats} />
              </div>
              <RegionCount stats={stats} />
            </section>

            <div className="w-full flex justify-center pointer-events-none">
              <div className="w-full md:max-w-[125dvh] mx-auto">
                <MapContainer activeCountries={stats.topCountries} />
              </div>
            </div>
          </div>

          <div className="relative hidden min-[961px]:flex flex-row max-lg:items-end lg:items-center lg:justify-between">
            <header className="flex flex-col items-start font-mono text-sm xl:text-base uppercase gap-2 pt-6 max-lg:mb-8 mb-auto">
              <p className="text-foreground font-mono my-0 whitespace-nowrap">
                Oxy Platform{" "}
                <span className="block font-mono text-muted-foreground">
                  [Live Dashboard]
                </span>
              </p>
            </header>

            <section className="lg:absolute lg:bottom-0 pb-6 w-fit z-10 relative">
              <div className="flex flex-col gap-y-8">
                <TotalRequests stats={stats} />
                <TopCountries stats={stats} />
              </div>
              <RegionCount stats={stats} />
            </section>

            <div className="w-full h-full pointer-events-none max-lg:scale-[1.5] max-lg:-translate-y-16 max-lg:translate-x-[-20%] md:max-w-[125dvh]">
              <MapContainer activeCountries={stats.topCountries} />
            </div>
          </div>

          <section className="mt-8">
            <StatsGrid stats={stats} />
          </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
