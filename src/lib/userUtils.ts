export function formatDisplayName(name: { first?: string; last?: string } | undefined, fallback: string): string {
  return [name?.first, name?.last].filter(Boolean).join(' ') || fallback
}

export function readTime(content?: string): string {
  if (!content) return '1 min read'
  const words = content.trim().split(/\s+/).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}
