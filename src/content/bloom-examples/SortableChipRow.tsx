import { useState } from 'react';
import { SortableChipRow, type SortableChipItem } from '@oxy.so/bloom/sortable-chip-row';

const initial: SortableChipItem[] = [
  { key: 'research', label: 'Research', node: 'Research' },
  { key: 'privacy', label: 'Privacy', node: 'Privacy' },
  { key: 'ai', label: 'Oxy AI', node: 'Oxy AI' },
  { key: 'community', label: 'Community', node: 'Community' },
];

export default function SortableChipRowExample() {
  const [items, setItems] = useState<SortableChipItem[]>(initial);
  const onReorder = (keys: string[]) => {
    setItems((current) => keys.flatMap((key) => current.filter((item) => item.key === key)));
  };
  return (
    <div className="w-full max-w-lg text-foreground">
      <SortableChipRow items={items} onReorder={onReorder} accessibilityLabel="Topics" />
    </div>
  );
}
