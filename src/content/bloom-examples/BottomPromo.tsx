import { useState } from 'react';
import { Text } from 'react-native';
import { BottomPromo } from '@oxy.so/bloom/bottom-promo';

export default function BottomPromoExample() {
  const [taken, setTaken] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <BottomPromo
        title="Try Oxy AI free"
        description="Ask a question and see how it answers."
        actionLabel="Get started"
        onAction={() => setTaken(true)}
      />
      {taken ? <Text className="text-sm text-muted-foreground">Action pressed.</Text> : null}
    </div>
  );
}
