import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Scoped to a page, so route changes and HMR remove every trigger and listener. */
export function usePeableMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let disposed = false;
    const media = gsap.matchMedia();
    void document.fonts.ready.then(() => {
      if (disposed || !root.current) return;
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const context = gsap.context(() => {
          root.current?.querySelectorAll<HTMLElement>('h1, h2').forEach((heading) => {
            if (heading.closest('.peable-hero')) return;
            const split = SplitText.create(heading, {
              type: 'lines,words',
              mask: 'lines',
              aria: 'auto',
              autoSplit: true,
              onSplit(instance) {
                // The display face's descenders extend beyond its tight line box.
                // Leave room for that ink during the reveal, then restore native
                // text so no clipping wrappers remain after the animation.
                for (const mask of instance.masks) {
                  (mask as HTMLElement).style.overflowClipMargin = '0.2em';
                }
                return gsap.from(instance.words, {
                  yPercent: 110,
                  opacity: 0.2,
                  duration: 0.85,
                  stagger: 0.035,
                  ease: 'power3.out',
                  onComplete: () => instance.revert(),
                  scrollTrigger: { trigger: heading, start: 'top 90%', once: true },
                });
              },
            });
            // SplitText owns its resize observer; reverting the context tears it down.
            gsap.context(() => () => split.revert());
          });
          root.current?.querySelectorAll<HTMLElement>('[data-motion-media]').forEach((element) => {
            gsap.from(element, {
              clipPath: 'inset(22% round 20px)',
              opacity: 0,
              duration: 1.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: element, start: 'top 90%', once: true },
            });
          });
          root.current
            ?.querySelectorAll<HTMLElement>('[data-motion-stagger]')
            .forEach((element) => {
              gsap.from(element.children, {
                y: 45,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: { trigger: element, start: 'top 90%', once: true },
              });
            });
          const closing = root.current?.querySelector<HTMLElement>('[data-image-trail]');
          if (closing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            const pictures = Array.from(
              closing.querySelectorAll<HTMLImageElement>('[data-trail-image]'),
            );
            gsap.set(pictures, { opacity: 0, left: 0, top: 0 });
            let previous = { x: -1000, y: -1000 };
            let index = 0;
            const move = (event: PointerEvent) => {
              const bounds = closing.getBoundingClientRect();
              const x = event.clientX - bounds.left;
              const y = event.clientY - bounds.top;
              if (Math.hypot(x - previous.x, y - previous.y) < 90) return;
              previous = { x, y };
              const picture = pictures[index % pictures.length];
              if (!picture) return;
              gsap.killTweensOf(picture);
              gsap.set(picture, {
                x: x - picture.width / 2,
                y: y - picture.height / 2,
                zIndex: index,
                rotation: ((index % 5) - 2) * 5,
              });
              gsap.fromTo(
                picture,
                { opacity: 0, scale: 0.7 },
                { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' },
              );
              gsap.to(picture, {
                opacity: 0,
                scale: 0.85,
                y: '+=30',
                delay: 0.5,
                duration: 0.45,
                ease: 'power2.in',
              });
              index++;
            };
            closing.addEventListener('pointermove', move);
            gsap.context(() => () => {
              closing.removeEventListener('pointermove', move);
              gsap.killTweensOf(pictures);
            });
          }
          ScrollTrigger.refresh();
        }, root);
        return () => context.revert();
      });
    });
    return () => {
      disposed = true;
      media.revert();
    };
  }, [root]);
}
