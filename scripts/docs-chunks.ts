/** Stable, bounded buckets for compiled documents and their raw source. */
export function docsChunkIndex(file: string): number {
  let hash = 0x811c9dc5;
  for (const character of file) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 0x01000193) >>> 0;
  }
  return hash % 128;
}
