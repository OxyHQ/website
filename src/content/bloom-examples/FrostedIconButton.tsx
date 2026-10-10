import { FrostedIconButton } from '@oxy.so/bloom/frosted-icon-button';
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';

export default function FrostedIconButtonExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <FrostedIconButton accessibilityLabel="Add" icon={RiAddLine} />
    </div>
  );
}
