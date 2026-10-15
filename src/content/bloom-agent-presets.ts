import type { AvatarCharacter } from '@oxy.so/bloom/agent-avatar';

/** App-owned creation templates, passed through Bloom's public character API. */
export const BLOOM_AGENT_PRESETS = [
  {
    name: 'Todd',
    character: {
      preset: 'lime_frog',
      eyes: 'clippo',
      eyewear: 'none',
      accessory: 'bow',
      color: 'coral',
    },
  },
  {
    name: 'Alfred',
    character: {
      preset: 'alfred',
      eyes: 'cyclops',
      eyewear: 'monocle',
      accessory: 'bow',
      color: 'cyan',
    },
  },
  {
    name: 'Iris',
    character: {
      preset: 'coral_monocle',
      eyes: 'clippo',
      eyewear: 'round_sunglasses',
      accessory: 'none',
    },
  },
  {
    name: 'Felipe',
    character: {
      eyes: 'sleepy_lids',
      eyewear: 'none',
      accessory: 'felipe_beret',
      shape: 'six_lobed_flower',
      color: 'blue',
      bodyColor: '#ff9547',
    },
  },
  { name: 'Jojo', character: { preset: 'purple_heart' } },
  { name: 'Thelma', character: { preset: 'gus' } },
  { name: 'Josh', character: { preset: 'blue_spectacles' } },
  { name: 'Iggy', character: { preset: 'lime_headphones' } },
  { name: 'Clippo', character: { preset: 'clippo' } },
] satisfies { name: string; character: AvatarCharacter }[];
