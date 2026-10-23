import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { magneticScroll } from './magneticScroll';

gsap.registerPlugin(ScrollTrigger);

const PHONE_MASK = 'url("/faircoin/phone-mask.svg")';
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** One viewport to enter, one to leave. The media stays fixed while its full-size
 * phone mask moves over it; only the wallet and portrait also wipe on exit.
 */
export function useLandingMotion(
  root: RefObject<HTMLDivElement | null>,
  paused: boolean,
  ready: boolean,
  onToneChange: (dark: boolean) => void,
) {
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const sections = [...element.querySelectorAll<HTMLElement>('[data-section-tone]')];
    const syncHeader = () => {
      const active = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom > 100;
      });
      onToneChange(active?.dataset.sectionTone === 'dark');
    };
    const media = gsap.matchMedia();
    media.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
      window.addEventListener('scroll', syncHeader, { passive: true });
      syncHeader();
      return () => window.removeEventListener('scroll', syncHeader);
    });
    // Pause controls ambient playback and magnetic input below. The structural
    // masks keep their geometry: reverting them here moves fixed phones back
    // into document flow, visibly jumping by the current section scroll offset.
    // The intro reveals this already-rendered hero. Do not replay its entrance
    // or rebuild the scroll timelines when the transparent overlay unmounts.
    media.add(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      () => {
        const canvas = element.querySelector<HTMLElement>('[data-landing-canvas]');
        const light = getComputedStyle(element);
        const dark = getComputedStyle(
          sections.find((s) => s.dataset.sectionTone === 'dark') || element,
        );
        const palettes = {
          light: {
            background: light.getPropertyValue('--card').trim(),
            ink: light.getPropertyValue('--foreground').trim(),
          },
          dark: {
            background: dark.getPropertyValue('--primary-foreground').trim(),
            ink: dark.getPropertyValue('--foreground').trim(),
          },
        };
        gsap.set(sections, { backgroundColor: 'transparent' });
        gsap.set(canvas, { transition: 'background-color 0.6s ease-in-out' });
        // Section themes affect the whole viewport, including the outgoing copy.
        const copy = element.querySelectorAll('[data-stage-copy]');
        gsap.set(copy, { transition: 'color 0.6s ease-in-out', color: 'var(--landing-ink)' });
        const paint = (section: HTMLElement) => {
          const isDark = section.dataset.sectionTone === 'dark';
          const palette = palettes[isDark ? 'dark' : 'light'];
          gsap.set(canvas, { backgroundColor: palette.background });
          gsap.set(element, { '--landing-ink': palette.ink });
          onToneChange(isDark);
        };
        paint(
          sections.find((s) => {
            const rect = s.getBoundingClientRect();
            return rect.top <= innerHeight / 2 && rect.bottom > innerHeight / 2;
          }) || sections[0],
        );
        // Match the reference's visibility thresholds and time-based theme fade.
        const observers = sections.map((section) => {
          const observer = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) if (entry.isIntersecting) paint(section);
            },
            { threshold: [0.51, 0.75, 1] },
          );
          observer.observe(section);
          return observer;
        });
        const hero = element.querySelector<HTMLElement>('[data-faircoin-hero]');
        const background = element.querySelector<HTMLElement>('[data-hero-background]');
        if (hero && background) {
          const scale = () => 2 * Math.max(innerWidth / 337, innerHeight / 724);
          gsap.set(background, {
            top: -160,
            maskImage: PHONE_MASK,
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskMode: 'alpha',
            maskSize: `${scale() * 337}px ${scale() * 724}px`,
            transition: 'opacity 0.1s linear',
          });
          gsap
            .timeline({
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
              defaults: { ease: 'none' },
            })
            .fromTo(
              background,
              { maskSize: () => `${scale() * 337}px ${scale() * 724}px`, yPercent: 0 },
              { maskSize: '337px 724px', yPercent: 92, duration: 1 },
              0,
            )
            // The original moves and fades the whole composition, not just the device.
            .to(
              element.querySelector('[data-hero-content]'),
              { yPercent: 50, opacity: 0, duration: 0.5 },
              0,
            )
            .to(element.querySelector('[data-hero-device]'), { opacity: 0, duration: 0.6 }, 0)
            // Keep the mask solid as it shrinks, then use the reference's 100ms
            // opacity transition so the final green silhouette dissolves.
            .set(background, { opacity: 0 }, 0.99);
        }
        element.querySelectorAll<HTMLElement>('[data-phone-stage]').forEach((section) => {
          const anchor = section.querySelector<HTMLElement>('[data-phone-anchor]');
          const phone = section.querySelector<HTMLElement>('[data-scroll-phone]');
          const mask = section.querySelector<HTMLElement>('[data-phone-mask]');
          if (!anchor || !phone || !mask) return;
          gsap.set(mask, {
            maskImage: PHONE_MASK,
            maskRepeat: 'no-repeat',
            maskSize: '100% 100%',
            maskMode: 'alpha',
          });
          gsap.set(phone, {
            filter:
              'drop-shadow(0 4px 100px color-mix(in srgb, var(--foreground) 15%, transparent))',
          });
          const update = () => {
            const rect = anchor.getBoundingClientRect();
            const height = rect.height;
            const width = height * 0.462141;
            const top = (innerHeight - height) / 2;
            const delta = rect.top - top;
            const sectionTop = section.getBoundingClientRect().top;
            const entering = clamp(1 - sectionTop / innerHeight);
            const leaving = clamp(-sectionTop / innerHeight);
            const wipeExit = section.dataset.phoneExit === 'wipe';
            const opacity =
              sectionTop > 0
                ? clamp((entering - 0.02) / 0.03)
                : wipeExit
                  ? 1 - clamp((leaving - 0.95) / 0.03)
                  : 1 - leaving;
            // Hide fully off-mask media too: Chromium can retain a filtered layer's
            // previous pixels when its SVG mask moves completely outside the box.
            const visible = opacity > 0 && delta < height && (!wipeExit || delta > -height);
            gsap.set(phone, {
              position: 'fixed',
              top,
              left: (innerWidth - width) / 2,
              width,
              height,
              visibility: visible ? 'visible' : 'hidden',
              opacity: visible ? opacity : 0,
            });
            gsap.set(mask, { maskPosition: `0px ${wipeExit ? delta : Math.max(0, delta)}px` });
          };
          ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: update,
            onRefresh: update,
          });
          update();
        });
        element.querySelectorAll<HTMLElement>('[data-parallax-grid]').forEach((section) => {
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
            defaults: { ease: 'none' },
          });
          section.querySelectorAll('[data-parallax-card]').forEach((card, i) => {
            const distance = ((i - 0.2) / 3) * 280;
            timeline.fromTo(card, { y: distance }, { y: -distance, duration: 2 }, 0);
          });
        });
        return () => {
          for (const observer of observers) observer.disconnect();
        };
      },
      element,
    );
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });
    return () => {
      active = false;
      media.revert();
    };
  }, [root, onToneChange]);

  // Input becomes available after the intro, independently of the visual state.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || paused || !ready) return;
    const media = gsap.matchMedia();
    media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () =>
      magneticScroll(element, [...element.querySelectorAll<HTMLElement>('[data-section-tone]')]),
    );
    return () => media.revert();
  }, [root, paused, ready]);
}
