// CSS minification may serialize rgba(..., 0.13) as #rrggbb21. Compare
// both representations in the same 8-bit RGBA space, including opaque alpha.
export function normalizeColor(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'transparent') return '0,0,0,0';
  const hex = normalized.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/)?.[1];
  if (hex) {
    const expanded = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join('') : hex;
    const rgba = expanded.length === 6 ? `${expanded}ff` : expanded;
    return [0, 2, 4, 6]
      .map((offset) => Number.parseInt(rgba.slice(offset, offset + 2), 16))
      .join(',');
  }
  const rgb = normalized.match(/^rgba?\(([^)]+)\)$/)?.[1];
  if (rgb) {
    const channels = rgb.trim().split(/[\s,/]+/);
    if (channels.length === 3 || channels.length === 4) {
      const bytes = channels.map((channel, index) => {
        const scale = channel.endsWith('%') ? 255 / 100 : index === 3 ? 255 : 1;
        return Math.round(Math.min(255, Math.max(0, Number.parseFloat(channel) * scale)));
      });
      if (bytes.every(Number.isFinite)) {
        if (bytes.length === 3) bytes.push(255);
        return bytes.join(',');
      }
    }
  }
  // Preserve unsupported/non-colour values so missing or invalid tokens never
  // accidentally compare equal after discarding their text.
  return normalized;
}
