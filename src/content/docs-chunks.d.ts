declare module 'virtual:docs-chunks' {
  export const fileBuckets: Record<string, number>;
  export const pageChunks: Record<
    number,
    () => Promise<{
      default: Record<string, import('react').ComponentType<Record<string, unknown>>>;
    }>
  >;
  export const sourceChunks: Record<number, () => Promise<{ default: Record<string, string> }>>;
}
