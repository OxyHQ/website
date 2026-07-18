/**
 * Parse an rgb/rgba color string into [r, g, b] number strings, ready to splice
 * back into an `rgba(...)` fill. Shared by the canvas animations, which all read
 * their draw color from the element's computed `color`.
 */
export function parseRgb(color: string): [string, string, string] {
  const m = color.match(/(\d+)/g)
  return [m?.[0] ?? '255', m?.[1] ?? '255', m?.[2] ?? '255']
}
