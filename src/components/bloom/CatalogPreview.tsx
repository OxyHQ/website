import { useLayoutEffect, useRef, useState } from 'react';
import BloomPreview from './BloomPreview';
import type { CatalogPreview as Preview } from './catalogPreviews';
import '../../styles/bloom-landing.css';

/** Keep a demo's native layout while fitting the catalog card or detail canvas. */
export default function CatalogPreview({
  preview,
  thumbnail = false,
}: {
  preview: Preview;
  thumbnail?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const widthScale = entry.contentRect.width / preview.width;
      setScale(Math.min(1, widthScale, thumbnail ? 179 / preview.height : 1));
      if (thumbnail && preview.thumbnailScale) {
        setScale(Math.min(widthScale, preview.thumbnailScale));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [preview, thumbnail]);
  return (
    <div
      ref={ref}
      className="relative w-full min-w-0"
      style={{ height: thumbnail ? 197 : preview.height * scale }}
    >
      <div
        className="absolute left-1/2"
        style={{
          width: preview.width,
          top: thumbnail && !preview.thumbnailScale ? '50%' : 0,
          transform: `translate(-50%, ${thumbnail && !preview.thumbnailScale ? '-50%' : '0'}) scale(${scale})`,
          transformOrigin: thumbnail && !preview.thumbnailScale ? 'center' : 'top center',
        }}
      >
        <BloomPreview name={preview.name} />
      </div>
    </div>
  );
}
