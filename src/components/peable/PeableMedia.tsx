import { useRef, useState } from 'react';

export function PeableProductPreview({
  image,
  video,
  title,
}: {
  image: string;
  video?: string;
  title: string;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  function start() {
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setActive(true);
    const element = player.current;
    if (!element) return;
    if (!element.src) element.src = video;
    void element.play().catch(() => {
      /* The static product image is the fallback. */
    });
  }
  function stop() {
    setActive(false);
    player.current?.pause();
  }
  return (
    <div onPointerEnter={start} onPointerLeave={stop} className="relative min-h-0 flex-1">
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="size-full object-contain transition-transform duration-500 group-hover:scale-105"
      />
      {video && (
        <video
          ref={player}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={() => setLoaded(true)}
          className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300 ${active && loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
