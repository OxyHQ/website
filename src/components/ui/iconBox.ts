/**
 * The style that makes a Bloom icon fill the box around it. Bloom's icons take
 * no `className` (Bloom 23), so a page sizes an icon from CSS (`size-[7cqw]`,
 * a viewport unit) by sizing a plain wrapper and filling it with the glyph.
 */
export const FILL_BOX = { width: '100%', height: '100%' } as const;
