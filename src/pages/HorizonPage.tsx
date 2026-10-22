import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import CommonsAppSection from '../components/homepage/CommonsAppSection';
import PathDetail from '../components/ecosystem/PathDetail';
import Wheel, { type Category, type Axis } from '../components/horizon/Wheel';
import {
  ecosystemDomains,
  ecosystemDomainAliases,
  ecosystemMap,
  HORIZON_SEO,
} from '../data/ecosystem/map';
import '../components/horizon/reference.css';

const IntroAnimation = lazy(() => import('../components/horizon/IntroAnimation'));

function MapIntro({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-5 text-center sm:gap-7 sm:px-6 lg:px-14">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--color-sns-grey-1)">
        Horizon by Oxy
      </p>
      <h1 className="text-[clamp(2.6rem,10vw,3rem)] leading-[0.95] tracking-tight text-(--color-sns-blue-1) [font-family:'Horizon_Otto',Georgia,serif] lg:text-[56px]">
        Your life.
        <br />
        Connected.
      </h1>
      <p className="max-w-[360px] text-base sm:text-lg leading-relaxed text-(--color-sns-grey-1)">
        One identity. A shared world of people, knowledge and possibilities for everyday life.
      </p>
      <div className="grid w-full grid-cols-3 gap-4 border-t border-(--color-sns-grey-2) pt-6 text-sm">
        <span>
          Your
          <br />
          identity
        </span>
        <span>
          Everyday
          <br />
          life
        </span>
        <span>
          Shared
          <br />
          possibilities
        </span>
      </div>
      <Button type="button" responsive onClick={onExplore}>
        Start exploring →
      </Button>
    </div>
  );
}

function MapCenter({ item }: { item: Category | Axis | null | undefined }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-7 text-center"
      aria-live="polite"
    >
      <h2 className="text-2xl leading-tight [font-family:'Horizon_Otto',Georgia,serif]">
        {item ? ('axisName' in item ? item.axisName : item.categoryName) : 'Explore your world'}
      </h2>
      <p className="text-sm leading-relaxed text-(--color-sns-grey-1)">
        {item?.description ??
          'Choose an area to discover the people, ideas and possibilities within it.'}
      </p>
    </div>
  );
}

function writeHash(sector: string | null, path?: string | null) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  if (sector) params.set('sector', sector);
  if (path) params.set('path', path);
  url.hash = params.toString();
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

export default function HorizonPage() {
  const reducedMotion = useReducedMotion();
  const [exploring, setExploring] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches,
  );
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [mapBehindHeader, setMapBehindHeader] = useState(true);
  const surfaceRef = useRef<HTMLElement>(null);

  const effectiveSelected = selected ?? (mobile && exploring ? ecosystemDomains[0].id : null);
  const active = ecosystemDomains.find((domain) => domain.id === effectiveSelected);
  const activeIndex = active ? ecosystemDomains.indexOf(active) : 0;
  const detail = active?.areas.find((area) => area.id === selectedArea);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    const readHash = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const rawId = params.get('sector') ?? '';
      const id = ecosystemDomainAliases[rawId] ?? rawId;
      const domain = ecosystemDomains.find((item) => item.id === id);
      setSelected(domain?.id ?? null);
      setExploring(Boolean(domain));
      setSelectedArea(domain?.areas.find((area) => area.id === params.get('path'))?.id ?? null);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('hashchange', readHash);
    };
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMapBehindHeader(entry.isIntersecting),
      { rootMargin: '-60px 0px 0px 0px' },
    );
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  const select = (id: string) => {
    setSelected(id);
    setSelectedArea(null);
    setExploring(true);
    writeHash(id);
  };
  const explore = () => {
    setExploring(true);
    if (mobile && !selected) select(ecosystemDomains[0].id);
  };
  const reset = () => {
    setSelected(null);
    setSelectedArea(null);
    setExploring(false);
    writeHash(null);
    surfaceRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const next = (direction: number) => {
    select(
      ecosystemDomains[
        (activeIndex + direction + ecosystemDomains.length) % ecosystemDomains.length
      ].id,
    );
  };
  const selectArea = (id: string | null) => {
    setSelectedArea(id);
    writeHash(effectiveSelected, id);
  };
  useEffect(() => {
    if (!selectedArea) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedArea(null);
        writeHash(effectiveSelected);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedArea, effectiveSelected]);

  return (
    <PageShell
      seo={HORIZON_SEO}
      hideFooterDivider
      navbar={
        <div className="force-light">
          <Navbar transparent={mapBehindHeader} transparentOnScroll transparentOn="light" />
        </div>
      }
    >
      <section
        ref={surfaceRef}
        aria-label="Explore Horizon"
        lang="en"
        className="oxy-ecosystem force-light relative bg-(--color-sns-off-white) text-(--color-sns-black) antialiased"
      >
        {!exploring && (
          <Suspense fallback={null}>
            <IntroAnimation />
          </Suspense>
        )}
        <AnimatePresence initial={false} mode="wait">
          {mobile && !exploring ? (
            <motion.div
              key="mobile-introduction"
              initial={{ opacity: 0, y: reducedMotion ? 0 : -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -16 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
              className="relative z-2 flex min-h-svh items-center justify-center px-3 pt-[calc(var(--site-header-occlusion-bottom,100px)+32px)] pb-12"
            >
              <MapIntro onExplore={explore} />
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: mobile ? 0 : 1, x: mobile && !reducedMotion ? 48 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mobile && !reducedMotion ? 48 : 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex flex-col ${mobile ? 'h-svh min-h-[560px] pt-[calc(var(--site-header-occlusion-bottom,100px)+12px)]' : 'h-[max(920px,100svh)]'}`}
            >
              {mobile ? (
                <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-(--color-sns-grey-2)/50 px-4 py-2">
                  <Button
                    type="button"
                    responsive
                    variant="ghost"
                    onClick={reset}
                    aria-label="Back to introduction"
                  >
                    ←
                  </Button>
                  <p className="text-center text-xl [font-family:'Horizon_Otto',Georgia,serif]">
                    {active?.name}
                  </p>
                  <span className="font-mono text-xs text-(--color-sns-grey-1)">
                    {activeIndex + 1} / {ecosystemDomains.length}
                  </span>
                </div>
              ) : exploring ? (
                <div className="absolute right-6 top-[calc(var(--site-header-occlusion-bottom,100px)+20px)] z-4">
                  <Button type="button" variant="ghost" onClick={reset}>
                    ← Introduction
                  </Button>
                </div>
              ) : null}
              {mobile && detail && active ? (
                <div className="flex min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <PathDetail
                    area={detail}
                    domain={active.name}
                    onBack={() => selectArea(null)}
                    mobile
                  />
                </div>
              ) : (
                <Wheel
                  map={ecosystemMap}
                  introRadius={330}
                  exploreRadius={detail ? 280 : 180}
                  exploring={exploring}
                  intro={<MapIntro onExplore={explore} />}
                  selected={effectiveSelected}
                  onExplore={explore}
                  onSelect={select}
                  mobile={mobile}
                  label="Interactive map of Horizon"
                  renderCenter={(item) =>
                    detail && active ? (
                      <PathDetail
                        area={detail}
                        domain={active.name}
                        onBack={() => selectArea(null)}
                      />
                    ) : (
                      <MapCenter item={item} />
                    )
                  }
                  onAxisSelect={selectArea}
                />
              )}
              {mobile && active && (
                <nav
                  aria-label="Explore life areas"
                  className="flex min-h-20 shrink-0 items-center justify-between gap-2 border-t border-(--color-sns-grey-2)/50 px-3 py-3 sm:px-6"
                >
                  <Button
                    type="button"
                    responsive
                    variant="ghost"
                    aria-label="Previous area"
                    onClick={() => next(-1)}
                  >
                    ← <span className="hidden min-[360px]:inline">Previous</span>
                  </Button>
                  <span className="min-w-0 text-center text-lg [font-family:'Horizon_Otto',Georgia,serif]">
                    {active.name}
                  </span>
                  <Button
                    type="button"
                    responsive
                    variant="ghost"
                    aria-label="Next area"
                    onClick={() => next(1)}
                  >
                    <span className="hidden min-[360px]:inline">Next</span> →
                  </Button>
                </nav>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <CommonsAppSection />
    </PageShell>
  );
}
