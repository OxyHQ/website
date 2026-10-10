import { LyricsPreviewCard } from '@oxy.so/bloom/lyrics';

export default function LyricsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <LyricsPreviewCard
        text={
          'A little room to begin\nA little light coming in\nWe make the day our own\nAnd find a way back home'
        }
      />
    </div>
  );
}
