import { useRef, useState, useSyncExternalStore } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/SEO";
import MapContainer from "../components/dashboard/MapContainer";
import {
  TotalRequests,
  LiveActivity,
  RegionCount,
  StatsGrid,
} from "../components/dashboard/StatsDisplay";
import InfraOverlay from "../components/dashboard/InfraOverlay";
import Logo from "../components/ui/Logo";
import { usePlatformActivity, usePlatformStats, useInfraStatus } from "../api/hooks";
import { INFRA_NODES } from "../data/dashboard/infra-nodes";

function subscribeFullscreen(callback: () => void): () => void {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

function getFullscreenSnapshot(): boolean {
  return document.fullscreenElement !== null;
}

function getFullscreenServerSnapshot(): boolean {
  return false;
}

export default function DashboardPage() {
  const [isGlobe, setIsGlobe] = useState(true);
  const { data: stats } = usePlatformStats();
  const { events: activityEvents } = usePlatformActivity();
  const { data: infraData } = useInfraStatus();
  const displayedStats = {
    ...stats,
    regions: infraData
      ? INFRA_NODES.filter((node) =>
          infraData.nodes.find((status) => status.region === node.region)?.status !== 'offline'
        ).length
      : stats.regions,
  };
  const dashboardRef = useRef<HTMLDivElement>(null);
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getFullscreenServerSnapshot,
  );

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      dashboardRef.current?.requestFullscreen();
    }
  }

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Dashboard"
        description="Live platform dashboard: API traffic, top countries and infrastructure status across every Oxy region."
        canonicalPath="/dashboard"
      />
      <h1 className="sr-only">Oxy Platform Dashboard</h1>
      {!isFullscreen && <Navbar />}
      <main className="flex-1">
        <div ref={dashboardRef} className={`container relative isolate font-mono flex flex-col bg-background ${isFullscreen ? "h-screen overflow-hidden px-8" : "min-h-[calc(100dvh-var(--site-header-height))]"}`}>
          <div className="absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2 touch-none cursor-grab active:cursor-grabbing">
            <MapContainer
              isGlobe={isGlobe}
              infraStatus={infraData?.nodes}
              activityEvents={activityEvents}
            />
          </div>

          <header className="relative z-10 flex items-center justify-between font-mono text-sm uppercase gap-2 pt-6 mb-4 shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-error px-3 py-1.5 font-sans text-xs font-bold tracking-wide text-error-foreground">
              LIVE
              <span aria-hidden="true" className="size-2 rounded-full bg-error-foreground" />
            </span>
            {isFullscreen && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2">
                <Logo className="h-8" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={isGlobe ? "Show flat map" : "Show globe"}
                aria-pressed={!isGlobe}
                onClick={() => setIsGlobe((current) => !current)}
                className="min-w-12 cursor-pointer rounded-full border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring"
              >
                {isGlobe ? "2D" : "3D"}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="p-2 m-0 bg-transparent text-muted-foreground border border-solid border-border hover:text-foreground hover:bg-accent transition-colors duration-150 flex items-center justify-center outline-none focus-visible:ring cursor-pointer rounded-full"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>

          <div className={`pointer-events-none relative z-10 flex-1 ${isFullscreen ? "min-h-0" : "min-h-[520px]"}`}>
            <div className="min-[961px]:absolute min-[961px]:bottom-0 min-[961px]:left-0 z-10 pb-2">
              <div className="flex flex-col gap-y-4">
                <TotalRequests stats={displayedStats} />
                <LiveActivity events={activityEvents} />
              </div>
              <RegionCount stats={displayedStats} />
            </div>

            <div className="min-[961px]:absolute min-[961px]:bottom-0 min-[961px]:right-0 z-10 pb-2">
              <InfraOverlay nodes={infraData?.nodes} />
            </div>
          </div>

          <section className={`relative z-10 shrink-0 ${isFullscreen ? "pb-6 pt-4" : "pb-12 pt-8 md:pb-16"}`}>
            <StatsGrid stats={displayedStats} />
          </section>
        </div>
      </main>
      {!isFullscreen && <Footer />}
    </div>
  );
}
