import { HoverCard, HoverCardTrigger, HoverCardContent } from '@oxy.so/bloom/hover-card';
import { Button } from '@oxy.so/bloom/button';

export default function HoverCardExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button>About this workspace</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="p-4">A shared place for your next idea.</div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
