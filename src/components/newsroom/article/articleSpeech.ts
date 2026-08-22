/** Strip Markdown and typed article-fence JSON before handing prose to TTS. */
export function articleSpeechText(title: string, resume: string, content: string): string {
  const prose = (typeof content === 'string' ? content : '')
    .replace(/^---\s*[\s\S]*?\s*---/u, ' ')
    .replace(/```article-[\w-]+\s*[\s\S]*?```/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    // MDX article furniture is visual context rather than prose. Remove
    // self-closing blocks entirely, but keep the children of wrappers such as
    // `<Takeaways>` by stripping only their opening and closing tags.
    .replace(/<[A-Z][\w.]*\b[\s\S]*?\/>/g, ' ')
    .replace(/<\/?[A-Z][\w.]*\b[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~`>|]/g, '')
    .replace(/\[\[cite:[^\]]+\]\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return [title, resume, prose].filter(Boolean).join('. ')
}

export function estimatedSpeechDuration(text: string): string {
  const seconds = Math.max(1, Math.round((text.split(/\s+/).filter(Boolean).length / 180) * 60))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}
