import { RiAccessibilityLine, RiAccountCircleLine, RiAddCircleLine } from '@oxy.so/bloom/icons';

export default function IconsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex gap-6">
        <RiAccessibilityLine width={32} height={32} />
        <RiAccountCircleLine width={32} height={32} />
        <RiAddCircleLine width={32} height={32} />
      </div>
    </div>
  );
}
