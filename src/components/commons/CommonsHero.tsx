import CommonsIcon from './CommonsIcon';
import CommonsGreeting from './CommonsGreeting';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { RiKey2Line } from '@oxy.so/bloom/icons/RiKey2Line';
import { COMMONS_PROMPTS } from './commonsData';
import { LANDING_FILM } from '../../data/landingMedia';

export default function CommonsHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const backgroundVideo = useRef<HTMLVideoElement>(null);
  const inView = useInView(root, { amount: 0.2 });
  const scene = COMMONS_PROMPTS[index];
  const playing = !paused && !reduced;

  useEffect(() => {
    const video = backgroundVideo.current;
    if (!video) return;
    if (playing && inView && visible) void video.play().catch(() => {});
    else video.pause();
  }, [playing, inView, visible]);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!playing || interacting || !inView || !visible) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % COMMONS_PROMPTS.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [playing, interacting, inView, visible]);

  return (
    <section
      ref={root}
      className="commons-hero relative isolate flex flex-col items-center justify-center"
      aria-labelledby="commons-heading"
    >
      <div className="commons-hero-wash" aria-hidden="true">
        <video
          ref={backgroundVideo}
          src={reduced ? undefined : LANDING_FILM.src}
          poster={LANDING_FILM.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="commons-hero-film"
        />
      </div>
      <div className="commons-hero-inner flex flex-col items-center">
        <div className="flex w-full flex-col items-center gap-5 px-6 text-center md:px-0">
          <CommonsGreeting playing={playing && inView && visible} />
          <p className="commons-supporting text-muted-foreground" data-commons-enter>
            Your digital life. One identity. Yours to keep.
          </p>
        </div>
        <div
          className="commons-composer relative z-20 w-full px-4"
          data-commons-enter
          onMouseEnter={() => setInteracting(true)}
          onMouseLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement)) setInteracting(false);
          }}
        >
          <a
            href={scene.target}
            className="commons-ask-pill flex items-center gap-3"
            onFocus={() => setInteracting(true)}
            onBlur={() => setInteracting(false)}
            aria-label={`Explore Commons: ${scene.prompt}`}
          >
            <span className="relative min-w-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  className="block"
                  key={scene.prompt}
                  initial={{
                    y: reduced ? 0 : 22,
                    opacity: reduced ? 1 : 0,
                    filter: reduced ? 'none' : 'blur(6px)',
                  }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{
                    y: reduced ? 0 : -22,
                    opacity: 0,
                    filter: reduced ? 'none' : 'blur(6px)',
                  }}
                  transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {scene.prompt}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="hidden shrink-0 sm:block">
              <RiKey2Line fill="currentColor" width={21} height={21} />
            </span>
            <span className="commons-send grid shrink-0 place-items-center">
              <CommonsIcon name="arrow" size={22} />
            </span>
          </a>
        </div>
      </div>
      {!reduced && (
        <button
          type="button"
          className="commons-control absolute bottom-6 right-6"
          aria-label={playing ? 'Pause hero animations' : 'Play hero animations'}
          onClick={() => setPaused(!paused)}
        >
          <CommonsIcon name={playing ? 'pause' : 'play'} size={20} />
        </button>
      )}
    </section>
  );
}
