import { PeableScope } from './PeableTheme';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { peableImages as images, peableVideos } from './assets';
import { PeableActions, PeableVideo } from './PeableShared';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
const tiles = [
  images.tile0,
  images.tile1,
  images.tile2,
  images.tile3,
  images.tile4,
  images.tile5,
  images.tile6,
  images.tile7,
  images.tile8,
  images.tile9,
  images.tile10,
  images.tile11,
  images.tile12,
  images.tile13,
  images.tile14,
  images.tile15,
  images.tile16,
  images.tile17,
];
const positions = [
  [2, 1],
  [4, 1],
  [6, 1],
  [8, 1],
  [1, 2],
  [3, 2],
  [5, 2],
  [7, 2],
  [9, 2],
  [1, 4],
  [3, 4],
  [5, 4],
  [7, 4],
  [9, 4],
  [2, 5],
  [4, 5],
  [6, 5],
  [8, 5],
];

export default function PeableHero() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        element.dataset.motion = 'true';
        const stage = element.querySelector<HTMLElement>('.peable-hero-stage');
        const target = element.querySelector<HTMLElement>('[data-tile="11"]');
        const primaryHeading = element.querySelector('h1');
        const secondaryHeading = element.querySelector('h2');
        if (!stage || !target || !primaryHeading || !secondaryHeading) return;
        const title = SplitText.create(primaryHeading, {
          type: 'words',
          aria: 'auto',
        });
        const secondary = SplitText.create(secondaryHeading, {
          type: 'words',
          aria: 'auto',
        });
        const tileElements = element.querySelectorAll('[data-tile]:not([data-tile="11"])');
        const bounds = () => {
          const a = stage.getBoundingClientRect();
          const b = target.getBoundingClientRect();
          return {
            scale: b.width / Math.min(a.width, a.height),
            x: b.left + b.width / 2 - a.left - a.width / 2,
            y: b.top + b.height / 2 - a.top - a.height / 2,
            insetX: Math.max(0, (1 - a.height / a.width) * 50),
            insetY: Math.max(0, (1 - a.width / a.height) * 50),
          };
        };
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: element,
            start: 'top top',
            end: () => `+=${stage.clientHeight * 0.6}`,
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        });
        timeline
          .to(
            title.words,
            { y: -70, opacity: 0, stagger: 0.015, duration: 0.25, ease: 'power2.in' },
            0,
          )
          .to('.peable-hero-actions', { opacity: 0, duration: 0.18, pointerEvents: 'none' }, 0)
          .to(
            '.peable-hero-media',
            {
              scale: () => bounds().scale,
              x: () => bounds().x,
              y: () => bounds().y,
              clipPath: () =>
                `inset(${bounds().insetY}% ${bounds().insetX}% round ${16 / bounds().scale}px)`,
              duration: 1,
              ease: 'power3.out',
            },
            0,
          )
          .fromTo(
            tileElements,
            { scale: 0.25, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.75,
              stagger: { amount: 0.18, from: 'center' },
              ease: 'power3.out',
            },
            0.12,
          )
          .fromTo(
            secondary.words,
            { y: 90, opacity: 0.2 },
            { y: 0, opacity: 1, stagger: 0.025, duration: 0.65, ease: 'power3.out' },
            0.22,
          )
          .to({}, { duration: 0.8 });
        return () => {
          timeline.revert();
          title.revert();
          secondary.revert();
          delete element.dataset.motion;
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="peable-hero" aria-label="Peable for every kind of business">
      <div className="peable-hero-stage">
        <PeableScope mode="dark">
          <div className="peable-hero-primary peable-dark relative isolate h-[calc(100svh-var(--site-header-height))] min-h-[660px] text-foreground">
            <div className="peable-hero-media absolute inset-0 overflow-hidden bg-background">
              <PeableVideo
                src={peableVideos.hero}
                poster={images.hero}
                label="Independent businesses and their neighbourhoods"
                className="absolute inset-0"
              />
              <div className="pointer-events-none absolute inset-0 bg-background/20" />
            </div>
            <div className="peable-hero-content container pointer-events-none relative flex h-full min-h-[660px] flex-col items-center justify-center pb-24 text-center">
              <h1 className="peable-display max-w-[1080px] text-[48px] md:text-[72px] lg:text-[88px]">
                Your business. Your ambition.
                <br className="hidden md:block" />
                Make it happen with Peable.
              </h1>
            </div>
            <div className="peable-hero-actions container pointer-events-auto absolute inset-x-0 bottom-12">
              <PeableActions centered hero />
            </div>
          </div>
        </PeableScope>
        <>
          <div className="peable-hero-mosaic relative grid min-h-[650px] grid-cols-9 grid-rows-5 items-center justify-items-center gap-x-3 gap-y-6 bg-card px-5 py-8 md:min-h-[1000px] md:gap-x-5">
            {tiles.map((src, index) => (
              <div
                key={src}
                data-tile={index}
                className="aspect-square w-full max-w-[138px] overflow-hidden rounded-xl md:rounded-2xl"
                style={{ gridColumn: positions[index][0], gridRow: positions[index][1] }}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </div>
            ))}
            <h2 className="peable-display col-span-full row-start-3 max-w-[1200px] px-2 text-center text-[28px] md:text-[44px]">
              Whatever you’re building, make it your own.
            </h2>
          </div>
        </>
      </div>
    </section>
  );
}
