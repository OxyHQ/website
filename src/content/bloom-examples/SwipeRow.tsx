import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';
import { useState } from 'react';
import { SwipeRow } from '@oxy.so/bloom/swipe-row';

export default function SwipeRowExample() {
  const [archived, setArchived] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <SwipeRow
        actions={{
          right: [
            { key: 'archive', icon: RiAddLine, label: 'Archive', onPress: () => setArchived(true) },
          ],
        }}
      >
        <div className="p-6">{archived ? 'Archived' : 'Swipe to archive this conversation'}</div>
      </SwipeRow>
    </div>
  );
}
