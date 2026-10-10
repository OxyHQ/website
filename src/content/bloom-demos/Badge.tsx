import { Badge } from '@oxy.so/bloom/badge';
import type { BadgeSize } from '@oxy.so/bloom/badge';
import type { BloomAppearance, BloomTone } from '@oxy.so/bloom/appearance';
import type { PlaygroundValues } from './_playground';

export const meta = {
  description: 'Status indicator and counter, dot or content-based.',
};

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Badge content="New" appearance="solid" tone="accent" />
      <Badge content={3} tone="danger" />
      <Badge content="Beta" appearance="outline" tone="info" />
      <Badge content="Shipped" appearance="subtle" tone="success" />
      <Badge content="Draft" appearance="plain" tone="neutral" />
      <Badge dot tone="warning" />
    </div>
  );
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const appearance = values.appearance as BloomAppearance;
  const tone = values.tone as BloomTone;
  const size = values.size as BadgeSize;
  const content = typeof values.content === 'string' ? values.content : '';
  const dot = values.dot === true;
  return (
    <Badge
      content={dot ? undefined : content}
      appearance={appearance}
      tone={tone}
      size={size}
      dot={dot}
    />
  );
}
