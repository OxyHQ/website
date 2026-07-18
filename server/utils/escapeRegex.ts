/**
 * Escapes regular-expression metacharacters so a client-supplied string can be
 * used as a literal inside a MongoDB `$regex` without letting the caller inject
 * their own pattern (catastrophic backtracking, unintended matches).
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
