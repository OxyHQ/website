import type { AvatarCharacter } from '@oxy.so/bloom/agent-avatar';

/**
 * App-owned creation templates, passed through Bloom's public character API.
 *
 * Each is a character with its parts only and the colour its account would
 * hold: Bloom paints a bot in its account's colour (`avatarCharacterInColor`,
 * `AgentCreatorAgent.color`), never in a paint of the character's own.
 */
export const BLOOM_AGENT_PRESETS = [
  {
    name: 'Todd',
    color: '#ff8066',
    character: { preset: 'lime_frog', eyes: 'clippo', eyewear: 'none', accessory: 'bow' },
  },
  {
    name: 'Alfred',
    color: '#00b1ff',
    character: { preset: 'alfred', eyes: 'cyclops', eyewear: 'monocle', accessory: 'bow' },
  },
  {
    name: 'Iris',
    color: '#ff8066',
    character: {
      preset: 'coral_monocle',
      eyes: 'clippo',
      eyewear: 'round_sunglasses',
      accessory: 'none',
    },
  },
  {
    name: 'Felipe',
    color: '#ff9547',
    character: {
      eyes: 'sleepy_lids',
      eyewear: 'none',
      accessory: 'felipe_beret',
      shape: 'six_lobed_flower',
    },
  },
  { name: 'Jojo', color: '#dd6adc', character: { preset: 'purple_heart' } },
  { name: 'Thelma', color: '#ffd838', character: { preset: 'gus' } },
  { name: 'Josh', color: '#00b1ff', character: { preset: 'blue_spectacles' } },
  { name: 'Iggy', color: '#fa70ab', character: { preset: 'lime_headphones' } },
  { name: 'Clippo', color: '#999b9d', character: { preset: 'clippo' } },
] satisfies { name: string; color: string; character: AvatarCharacter }[];
