import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

// Matches Commons' auth intro and staggered-text/rotating-text animation.
const greetings = [
  { text: 'Human', lang: 'en' },
  { text: 'Humano', lang: 'es' },
  { text: 'Humain', lang: 'fr' },
  { text: 'Mensch', lang: 'de' },
  { text: '人类', lang: 'zh' },
  { text: '人間', lang: 'ja' },
  { text: 'إنسان', lang: 'ar' },
] as const;

export default function CommonsGreeting({ playing }: { playing: boolean }) {
  const [index, setIndex] = useState(0);
  const started = useRef(false);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );

  useEffect(() => {
    if (!playing || reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      started.current = true;
      setIndex((value) => (value + 1) % greetings.length);
      timer = setTimeout(next, 3000);
    };
    timer = setTimeout(next, started.current ? 3000 : 6000);
    return () => clearTimeout(timer);
  }, [playing, reduced]);

  const greeting = greetings[reduced ? 0 : index];
  return (
    <h1
      id="commons-heading"
      className="commons-hero-title commons-greeting"
      aria-label="Hello Human"
    >
      <motion.span
        className="commons-greeting-hello"
        aria-hidden="true"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.2, ease: 'easeInOut' }}
      >
        {Array.from('Hello').map((letter, position) => (
          <span className="commons-greeting-letter" key={position}>
            {!reduced && (
              <motion.span
                className="commons-greeting-letter-copy"
                initial={{ opacity: 1, y: 0, rotateX: 0 }}
                animate={{ opacity: 0, y: '-.573em', rotateX: 90 }}
                transition={{
                  type: 'spring',
                  duration: 0.35,
                  bounce: 0,
                  delay: 0.4 + position * 0.04,
                }}
              >
                {letter}
              </motion.span>
            )}
            <motion.span
              className="commons-greeting-letter-copy"
              initial={reduced ? false : { opacity: 0, y: '.573em', rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                type: 'spring',
                duration: 0.35,
                bounce: 0,
                delay: reduced ? 0 : 0.4 + position * 0.04,
              }}
            >
              {letter}
            </motion.span>
          </span>
        ))}
      </motion.span>
      <motion.span
        className="commons-greeting-window"
        aria-hidden="true"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.8, duration: 0.6 }}
      >
        <AnimatePresence initial={false}>
          <motion.span
            key={greeting.text}
            lang={greeting.lang}
            dir={greeting.lang === 'ar' ? 'rtl' : 'ltr'}
            className="commons-greeting-word"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: reduced ? 0 : 0.6, ease: 'linear' }}
          >
            <motion.span
              className="commons-greeting-word-face"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: [0, 0, 1] }}
              exit={{
                rotateX: 90,
                opacity: [1, 0, 0],
                transition: {
                  duration: reduced ? 0 : 0.6,
                  ease: 'linear',
                  opacity: { times: [0, 0.4, 1] },
                },
              }}
              transition={{
                duration: reduced ? 0 : 0.6,
                ease: 'linear',
                opacity: { times: [0, 0.6, 1] },
              }}
            >
              {greeting.text}
            </motion.span>
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </h1>
  );
}
