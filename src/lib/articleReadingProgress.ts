/** Progress from the body's top at the reading line to its bottom in view. */
export function articleReadingProgress(top: number, bottom: number, viewportHeight: number, headerHeight = 0): number {
  const height = bottom - top
  if (height <= 0 || top >= viewportHeight) return 0
  const availableHeight = Math.max(1, viewportHeight - headerHeight)
  const distance = height - availableHeight
  if (distance <= 0) return bottom <= viewportHeight ? 100 : 0
  return Math.max(0, Math.min(100, Math.round(((headerHeight - top) / distance) * 100)))
}
