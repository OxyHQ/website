import { useEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';

/** Visibility and Pause stop the existing clock; neither rewinds its frame. */
export function usePausableLoop(
  initial: number,
  keyframes: readonly number[],
  duration: number,
  paused: boolean,
  delay = 0,
  times?: readonly number[],
) {
  const value = useMotionValue(initial);
  const playback = useRef<ReturnType<typeof animate> | null>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) playback.current?.pause();
    else playback.current?.play();
  }, [paused]);
  useEffect(() => {
    const animation = animate(value, [...keyframes], {
      duration,
      delay,
      times: times ? [...times] : undefined,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    if (pausedRef.current) animation.pause();
    playback.current = animation;
    return () => {
      animation.stop();
      playback.current = null;
    };
  }, [value, keyframes, duration, delay, times]);
  return value;
}
