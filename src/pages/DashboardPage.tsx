import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import MapContainer from "../components/dashboard/MapContainer";
import {
  TotalRequests,
  TopCountries,
  RegionCount,
  StatsGrid,
} from "../components/dashboard/StatsDisplay";
import Logo from "../components/ui/Logo";
import { usePlatformStats } from "../api/hooks";

export default function DashboardPage() {
  const { data: stats } = usePlatformStats();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement !== null);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      dashboardRef.current?.requestFullscreen();
    }
  }

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      {!isFullscreen && <Navbar />}
      <main className="flex-1">
        <div ref={dashboardRef} className={`container font-mono flex flex-col bg-background ${isFullscreen ? "min-h-screen px-8" : "min-h-[calc(100dvh-var(--site-header-height))]"}`}>
          <header className="relative flex items-center justify-between font-mono text-sm uppercase gap-2 pt-6 mb-4 shrink-0">
            <p className="text-foreground font-mono my-0 whitespace-nowrap">
              Oxy Platform{" "}
              <span className="block font-mono text-muted-foreground">
                [Live Dashboard]
              </span>
            </p>
            {isFullscreen && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2">
                <Logo className="h-8" />
              </div>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-2 m-0 bg-transparent text-muted-foreground border border-solid border-border hover:text-foreground hover:bg-accent transition-colors duration-150 flex items-center justify-center outline-none focus-visible:ring cursor-pointer rounded-md"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </header>

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

          <section className="shrink-0 pt-8 pb-6">
            <StatsGrid stats={stats} />
          </section>
        </div>
      </main>
      {!isFullscreen && <Footer />}
    </div>
  );
}
