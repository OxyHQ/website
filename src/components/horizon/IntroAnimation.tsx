import { useLottie } from 'lottie-react';
import { useEffect, useState } from 'react';

export default function IntroAnimation() {
  const [data, setData] = useState<object | null>(null);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const controller = new AbortController();
    fetch('/horizon/intro-animation.json', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then(setData)
      .catch(() => {
        /* The map remains usable if the decorative asset fails. */
      });
    return () => controller.abort();
  }, []);
  if (!data || complete) return null;
  return <Animation data={data} onComplete={() => setComplete(true)} />;
}

function Animation({ data, onComplete }: { data: object; onComplete: () => void }) {
  const { View } = useLottie(
    {
      animationData: data,
      loop: false,
      rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      onComplete,
    },
    { width: '100%', height: '100%' },
  );
  return (
    <div
      className="horizon-intro-animation pointer-events-none absolute inset-0 z-1 max-lg:w-[200%] max-lg:-translate-x-1/2"
      aria-hidden="true"
    >
      {View}
    </div>
  );
}
