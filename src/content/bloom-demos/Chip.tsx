import { Chip } from '@oxy.so/bloom/chip';
import type { ChipSize } from '@oxy.so/bloom/chip';
import type { BloomAppearance, BloomTone } from '@oxy.so/bloom/appearance';
import type { PlaygroundValues } from './_playground';

export const meta = {
  description: 'Compact, optionally interactive tags with semantic tones.',
};

export default function ChipDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>Neutral</Chip>
      <Chip appearance="solid" tone="accent">
        Solid
      </Chip>
      <Chip appearance="subtle" tone="success">
        Subtle
      </Chip>
      <Chip appearance="outline" tone="warning">
        Outline
      </Chip>
      <Chip appearance="plain" tone="info">
        Plain
      </Chip>
      <Chip tone="danger" onClose={() => undefined}>
        Closable
      </Chip>
      <Chip checked onPress={() => undefined}>
        Checked
      </Chip>
      <Chip disabled>Disabled</Chip>
    </div>
  );
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const appearance = values.appearance as BloomAppearance;
  const tone = values.tone as BloomTone;
  const size = values.size as ChipSize;
  const checked = values.checked === true;
  const disabled = values.disabled === true;
  const label = typeof values.children === 'string' ? values.children : 'Chip';
  return (
    <Chip appearance={appearance} tone={tone} size={size} checked={checked} disabled={disabled}>
      {label}
    </Chip>
  );
}
