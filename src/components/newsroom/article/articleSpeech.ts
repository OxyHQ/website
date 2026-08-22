/** Strip Markdown and typed article-fence JSON before handing prose to TTS. */
export function articleSpeechText(title: string, resume: string, content: string): string {
  const prose = content
    .replace(/```article-[\w-]+\s*[\s\S]*?```/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
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
