import { useState } from 'react';
import { BottomPromo } from '@oxy.so/bloom/bottom-promo';
import { useColorTokens } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

export default function BottomPromoExample() {
  const [taken, setTaken] = useState(false);
  const tokens = useColorTokens();
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <BottomPromo
        title="Try Oxy AI free"
        description="Ask a question and see how it answers."
        actionLabel="Get started"
        onAction={() => setTaken(true)}
      />
      {taken ? (
        <Text variant="body-2-regular" style={{ color: tokens.mutedForeground }}>
          Action pressed.
        </Text>
      ) : null}
    </div>
  );
}
