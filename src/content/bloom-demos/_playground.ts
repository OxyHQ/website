/**
 * Shared types for `<BloomPlayground>` knob descriptors. Each demoed
 * component may sit next to a `<Name>.props.ts` file exporting an array of
 * these — the playground reads them to render its prop controls.
 */

export interface SelectPlaygroundProp {
  name: string
  kind: 'select'
  options: string[]
  default: string
}

export interface BooleanPlaygroundProp {
  name: string
  kind: 'boolean'
  default: boolean
}

export interface TextPlaygroundProp {
  name: string
  kind: 'text'
  default: string
}

export interface NumberPlaygroundProp {
  name: string
  kind: 'number'
  default: number
  min?: number
  max?: number
  step?: number
}

export type PlaygroundProp =
  | SelectPlaygroundProp
  | BooleanPlaygroundProp
  | TextPlaygroundProp
  | NumberPlaygroundProp

/** Value type each knob produces. */
export type PlaygroundValue = string | number | boolean

/** Map of knob name → current value. */
export type PlaygroundValues = Record<string, PlaygroundValue>

/** Build the initial values map from a list of props. */
export function defaultValues(props: readonly PlaygroundProp[]): PlaygroundValues {
  const out: PlaygroundValues = {}
  for (const p of props) {
    out[p.name] = p.default
  }
  return out
}
