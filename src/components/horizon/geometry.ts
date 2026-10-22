// Polar geometry and sector angles adapted from Climate Tech Map's public SVG.
// https://climatetechmap.com/ — snapshot: 2026-10-22.
export function point(radius: number, angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [radius * Math.cos(radians), radius * Math.sin(radians)];
}

export function arc(radius: number, start: number, end: number): string {
  return `M ${point(radius, start).join(' ')} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${point(radius, end).join(' ')}`;
}

export function sector(inner: number, outer: number, start: number, end: number): string {
  return `${arc(outer, start, end)} L ${point(inner, end).join(' ')} A ${inner} ${inner} 0 ${end - start > 180 ? 1 : 0} 0 ${point(inner, start).join(' ')} Z`;
}

export function sourceAreaUrl(id: string): string {
  return `https://climatetechmap.com/opportunity-area/${id.replace(/-v2$/, '')}`;
}

/** Match the reference: bring the sector midpoint to three o'clock via the shortest turn. */
export function sectorRotation(current: number, start: number, end: number): number {
  const midpoint = (start + end) / 2;
  return current + angleDelta(current, -midpoint);
}

/** Signed shortest movement, including a pointer crossing the ±180° seam. */
export function angleDelta(from: number, to: number): number {
  return ((((to - from + 180) % 360) + 360) % 360) - 180;
}

/** Hover makes that solution area's color the first swatch, radiating outwards. */
export function axisColor(palette: string[], index: number, hoveredIndex: number): string {
  const distance = hoveredIndex < 0 ? index : Math.abs(index - hoveredIndex);
  return palette[distance % palette.length];
}
