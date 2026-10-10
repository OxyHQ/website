import { TrackList } from '@oxy.so/bloom/track-list';

export default function TrackListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <TrackList
        tracks={[
          {
            id: '1',
            title: 'Morning light',
            artists: [{ name: 'Studio Sessions' }],
            duration: 184,
          },
          { id: '2', title: 'Open windows', artists: [{ name: 'Studio Sessions' }], duration: 216 },
        ]}
        columns={['index', 'title', 'duration']}
      />
    </div>
  );
}
