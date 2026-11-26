import { useState } from 'react';
import { BloomImage } from '@oxy.so/bloom/image';
import { useColorTokens } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

export default function ImageExample() {
  const tokens = useColorTokens();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  return (
    <div className="w-full max-w-lg space-y-3 text-foreground">
      <BloomImage
        source="/images/pricing/oxy-one-hero.png"
        alt="Oxy One"
        contentFit="cover"
        transition={200}
        onLoad={setSize}
        style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
      />
      <Text variant="body-2-regular" style={{ color: tokens.mutedForeground }}>
        {size ? `Intrinsic size: ${size.width} × ${size.height}` : 'Loading…'}
      </Text>
    </div>
  );
}
