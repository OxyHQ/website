import { useLayoutEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import Button from './FairCoinButton';
import LandingPhone from './LandingPhone';

gsap.registerPlugin(CustomEase);
CustomEase.create('faircoinIntroQuartOut', '0.26, 1, 0.48, 1');

const OBJECTS = ['home-key', 'market-tote', 'city-helmet', 'study-headphones'].map(
  (name) => `/faircoin/objects/${name}-small.webp`,
);

function Words({
  children,
  side,
  phase,
}: {
  children: string;
  side: 'left' | 'right';
  phase: number;
}) {
  return (
    <span
      aria-hidden="true"
      data-intro-copy={`${side}-${phase}`}
      className={`${phase === 0 ? 'absolute inset-0' : 'relative'} block whitespace-nowrap ${
        (phase === 0 && side === 'left') || (phase === 1 && side === 'right')
          ? 'text-right'
          : 'text-left'
      }`}
    >
      {[...children].map((letter, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Fixed lettering has immutable positions in the split-text animation.
        <span key={`${letter}-${i}`} className="inline-block whitespace-pre">
          {letter}
        </span>
      ))}
    </span>
  );
}

/** Matches /new's split lettering, object sequence, then its measured phone morph. */
export default function FairCoinIntro({
  target,
  onComplete,
}: {
  target: RefObject<HTMLDivElement | null>;
  onComplete: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.focus({ preventScroll: true });
    let cancelled = false;
    let timeline: gsap.core.Timeline | undefined;
    const context = gsap.context(() => {
      gsap.set('[data-intro-copy] > span', { opacity: 0 });
      gsap.set('[data-intro-spinner]', { scale: 0 });
      gsap.set('[data-intro-object]', { visibility: 'hidden' });
      gsap.set('[data-intro-phone]', { opacity: 0 });
    }, root);
    const finish = () => onComplete();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    // A viewport change invalidates the measured morph destination. Finish cleanly.
    window.addEventListener('resize', finish);
    window.addEventListener('keydown', keydown);
    const assets = [...(root.current?.querySelectorAll('img') ?? [])].map((img) =>
      img.decode().catch(() => undefined),
    );
    void Promise.race([
      Promise.all([...assets, document.fonts.load('16px "FairCoin Editorial"')]),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]).then(() => {
      if (cancelled) return;
      context.add(() => {
        const phone = root.current?.querySelector('[data-intro-phone]');
        const spinnerElement = root.current?.querySelector('[data-intro-spinner]');
        const destination = target.current;
        if (!phone || !spinnerElement || !destination) {
          onComplete();
          return;
        }
        const spinner = spinnerElement.getBoundingClientRect();
        const destinationRect = destination.getBoundingClientRect();
        const initialScale = 120 / destinationRect.height;
        // Lay out the screen once at its final size. Scaling the whole silhouette
        // around its centre avoids reflowing the wallet on every animation frame.
        gsap.set(phone, {
          x: spinner.x + spinner.width / 2,
          y: spinner.y + spinner.height / 2,
          xPercent: -50,
          yPercent: -50,
          width: destinationRect.width,
          height: destinationRect.height,
          scale: initialScale,
          transformOrigin: '50% 50%',
          borderRadius: 10 / initialScale,
        });
        const sequence = gsap.timeline({ onComplete });
        timeline = sequence;
        for (const side of ['left', 'right'] as const) {
          const direction = side === 'left' ? 1 : -1;
          const first = `[data-intro-copy="${side}-0"] > span`;
          const second = `[data-intro-copy="${side}-1"] > span`;
          const stagger = {
            each: 0.008,
            from: side === 'left' ? ('start' as const) : ('end' as const),
          };
          for (const [selector, start, leave] of [
            [first, 1, 1.8],
            [second, 2.5, 5.3],
          ] as const) {
            sequence
              .fromTo(
                selector,
                { x: 300 * direction, opacity: 0 },
                { x: 0, duration: 0.8, stagger, ease: 'faircoinIntroQuartOut' },
                start,
              )
              .to(
                selector,
                {
                  opacity: 1,
                  duration: 0.2,
                  stagger: { each: 0.032, from: stagger.from },
                  ease: 'faircoinIntroQuartOut',
                },
                start + 0.048,
              )
              .to(
                selector,
                { x: -300 * direction, duration: 0.8, stagger, ease: 'power3.in' },
                leave,
              )
              .to(
                selector,
                {
                  opacity: 0,
                  duration: 0.28,
                  stagger: { each: 0.048, from: stagger.from },
                  ease: 'power3.in',
                },
                leave,
              );
          }
        }
        sequence.to(
          '[data-intro-spinner]',
          { scale: 1, duration: 0.4, ease: 'faircoinIntroQuartOut' },
          1.3,
        );
        for (let i = 0; i < 12; i++) {
          sequence
            .set('[data-intro-object]', { visibility: 'hidden' }, 1.3 + i * 0.25)
            .set(
              `[data-intro-object="${i % OBJECTS.length}"]`,
              { visibility: 'visible' },
              1.3 + i * 0.25,
            );
        }
        sequence
          .set('[data-intro-object]', { visibility: 'hidden' }, 4.2)
          .set('[data-intro-spinner]', { autoAlpha: 0 }, 4.2)
          .set(phone, { opacity: 1 }, 4.2)
          .to(
            phone,
            {
              x: () => {
                const rect = destination.getBoundingClientRect();
                return rect.x + rect.width / 2;
              },
              y: () => {
                const rect = destination.getBoundingClientRect();
                return rect.y + rect.height / 2;
              },
              scale: 1,
              borderRadius: () => parseFloat(getComputedStyle(destination).borderTopLeftRadius),
              duration: 0.9,
              ease: 'power3.inOut',
            },
            5.2,
          )
          .to('[data-intro-backdrop]', { opacity: 0, duration: 0.9, ease: 'power1.out' }, 6)
          .to('[data-intro-skip]', { opacity: 0, duration: 0.2 }, 5.8)
          .to(phone, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 6.4);
      });
    });
    return () => {
      cancelled = true;
      timeline?.kill();
      context.revert();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', finish);
      window.removeEventListener('keydown', keydown);
    };
  }, [target, onComplete]);

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to FairCoin"
      tabIndex={-1}
      className="faircoin-editorial fixed inset-0 z-[200] overflow-hidden text-foreground outline-none [font-family:'FairCoin_Editorial',sans-serif]"
    >
      <div data-intro-backdrop className="absolute inset-0 bg-card" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[13.27014svh] p-[15px] min-[1025px]:flex-row min-[1025px]:justify-between min-[1025px]:gap-0 min-[1025px]:p-5">
        <div className="relative text-[42px] leading-[1.2] tracking-[-0.03em] min-[1025px]:flex-1 min-[1025px]:text-[72px]">
          <Words side="left" phase={0}>
            The shape
          </Words>
          <Words side="left" phase={1}>
            FairCoin
          </Words>
        </div>
        <div data-intro-spinner className="relative size-[120px] shrink-0">
          {OBJECTS.map((src, i) => (
            <img
              key={src}
              data-intro-object={i}
              src={src}
              width={120}
              height={120}
              alt=""
              className="absolute inset-0 size-full object-contain"
            />
          ))}
        </div>
        <div className="relative text-[42px] leading-[1.2] tracking-[-0.03em] min-[1025px]:flex-1 min-[1025px]:text-[72px]">
          <Words side="right" phase={0}>
            of money
          </Words>
          <Words side="right" phase={1}>
            For everyone
          </Words>
        </div>
      </div>
      <div
        data-intro-phone
        aria-hidden="true"
        className="faircoin-editorial-green pointer-events-none absolute left-0 top-0 overflow-hidden bg-ring will-change-transform"
      >
        <div
          data-intro-screen
          className="size-full rounded-[inherit] [&>[data-faircoin-phone]]:h-full [&>[data-faircoin-phone]]:rounded-[inherit]"
        >
          <LandingPhone paused />
        </div>
      </div>
      <div data-intro-skip className="absolute right-5 top-5">
        <Button variant="ghost" onClick={onComplete}>
          Skip intro →
        </Button>
      </div>
    </div>
  );
}
