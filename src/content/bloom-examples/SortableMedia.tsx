import { useState } from 'react';
import { SortablePhotoGrid } from '@oxy.so/bloom/sortable-media';

export default function SortableMediaExample() {
  const [photos, setPhotos] = useState<import('@oxy.so/bloom/sortable-media').SortablePhoto[]>([
    { id: '1', uri: '/images/pricing/oxy-one-hero.png', alt: 'Oxy artwork' },
    { id: '2', uri: '/images/pricing/oxy-one-hero.png', alt: 'Second artwork' },
  ]);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <SortablePhotoGrid photos={photos} onReorder={setPhotos} columns={2} />
    </div>
  );
}
