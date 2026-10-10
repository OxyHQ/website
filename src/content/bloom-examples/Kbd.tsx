import { Kbd } from '@oxy.so/bloom/kbd';

export default function KbdExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex gap-2">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </div>
    </div>
  );
}
