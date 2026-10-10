import { QueuePanel } from '@oxy.so/bloom/queue-panel';

export default function QueuePanelExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <QueuePanel
        nowPlaying={{ id: '1', title: 'Morning light', artists: 'Studio Sessions' }}
        queue={[
          { id: '2', title: 'Open windows', artists: 'Studio Sessions' },
          { id: '3', title: 'On the way', artists: 'Studio Sessions' },
        ]}
      />
    </div>
  );
}
