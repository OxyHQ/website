import { useState } from 'react';
import { PlayButton, LikeButton } from '@oxy.so/bloom/media-controls';

export default function MediaControlsExample() {
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex items-center gap-4">
        <PlayButton playing={playing} onPress={() => setPlaying(!playing)} />
        <LikeButton liked={liked} onLikedChange={setLiked} />
      </div>
    </div>
  );
}
