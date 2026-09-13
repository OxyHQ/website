import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import { dashboardPresentation } from "../lib/dashboardPresentation";
import { Maximize2, Minimize2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/SEO";
import MapContainer from "../components/dashboard/MapContainer";
import {
  TotalRequests,
  LiveActivity,
  RegionCount,
  LiveOrigins,
} from "../components/dashboard/StatsDisplay";
import ReferenceMetricsGrid from "../components/dashboard/ReferenceMetricsGrid";
import Logo from "../components/ui/Logo";
import { usePlatformActivity, usePlatformStats, useInfraStatus } from "../api/hooks";
import { INFRA_NODES } from "../data/dashboard/infra-nodes";
import { useTranslation } from "../lib/i18n";

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
  const { t } = useTranslation();
  const [isGlobe, setIsGlobe] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [windowFullscreen, setWindowFullscreen] = useState(false);
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
  const nativeFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getFullscreenServerSnapshot,
  );

  const { fullscreen: isFullscreen, fullscreenLayout, widgetRows, hideControls } = dashboardPresentation(searchParams, nativeFullscreen, windowFullscreen);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setWindowFullscreen(false);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('fullscreen');
        return next;
      }, { replace: true });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, setSearchParams]);

  async function toggleFullscreen() {
    if (isFullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      setWindowFullscreen(false);
      if (searchParams.get('fullscreen') === 'true') {
        const next = new URLSearchParams(searchParams);
        next.delete('fullscreen');
        setSearchParams(next, { replace: true });
      }
      return;
    }
    try {
      if (!dashboardRef.current?.requestFullscreen) {
        setWindowFullscreen(true);
        return;
      }
      await dashboardRef.current.requestFullscreen();
    } catch {
      // Browsers may deny native fullscreen; the dashboard still fills the window.
      setWindowFullscreen(true);
    }
  }

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Dashboard"
        description={t('dashboard.seoDescription')}
        canonicalPath="/dashboard"
      />
      <h1 className="sr-only">Oxy · {t('dashboard.platformActivity')}</h1>
      {!isFullscreen && <Navbar />}
      <main className="flex-1">
        <div ref={dashboardRef} data-dashboard-fullscreen={isFullscreen} data-fullscreen-layout={fullscreenLayout} className={isFullscreen ? "fixed inset-0 z-[100] h-dvh overflow-y-auto bg-background" : undefined}>
        <div className={`container relative isolate font-mono flex flex-col bg-background ${isFullscreen ? "h-dvh" : "min-h-[calc(100dvh-var(--site-header-height))]"} ${fullscreenLayout ? "max-w-none px-8" : ""}`}>
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
            {!hideControls && <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={isGlobe ? t('dashboard.flatMap') : t('dashboard.globe')}
                aria-pressed={!isGlobe}
                onClick={() => setIsGlobe((current) => !current)}
                className="min-w-12 cursor-pointer rounded-full border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring"
              >
                {isGlobe ? "2D" : "3D"}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? t('dashboard.exitFullscreen') : t('dashboard.enterFullscreen')}
                className="p-2 m-0 bg-transparent text-muted-foreground border border-solid border-border hover:text-foreground hover:bg-accent transition-colors duration-150 flex items-center justify-center outline-none focus-visible:ring cursor-pointer rounded-full"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>}
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
              <LiveOrigins events={activityEvents} />
            </div>
          </div>

          <section className={`relative z-10 shrink-0 transform-gpu ${fullscreenLayout ? "pb-6 pt-4" : "pb-12 pt-8 md:pb-16"}`}>
            <ReferenceMetricsGrid stats={displayedStats} compact={widgetRows === 1} />
          </section>
        </div>
        </div>
      </main>
      {!isFullscreen && <Footer />}
    </div>
  );
}
