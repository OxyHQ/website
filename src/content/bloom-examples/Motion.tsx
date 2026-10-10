import { ScreenTransition } from '@oxy.so/bloom/motion';

export default function MotionExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ScreenTransition direction="forward">
        <div className="rounded-xl border border-border p-6">A new screen comes into view.</div>
      </ScreenTransition>
    </div>
  );
}
