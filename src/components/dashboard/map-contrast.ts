import { useCallback } from 'react'

/** Resolve Bloom's foreground/background through the browser, including modern
 * CSS colour formats, and choose the lighter token for the night-map surface. */
export function observeMapContrast(node: HTMLElement, onChange?: () => void): () => void {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const update = () => {
    if (!context) return
    const style = getComputedStyle(node)
    const candidates = ['--foreground', '--background'].map(token => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = style.getPropertyValue(token).trim()
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
    })
    const luminance = (rgb: number[]) => rgb.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
    const [red, green, blue] = candidates.sort((a, b) => luminance(b) - luminance(a))[0]
    const color = `rgb(${red}, ${green}, ${blue})`
    if (node.style.getPropertyValue('--map-internal') === color) return
    node.style.setProperty('--map-internal', color)
    onChange?.()
  }
  update()
  const observer = new MutationObserver(update)
  // Scoped Bloom providers may update an ancestor rather than <html>.
  for (let parent = node.parentElement; parent; parent = parent.parentElement) observer.observe(parent, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  return () => observer.disconnect()
}

export function useMapContrastRef() {
  return useCallback((node: HTMLDivElement | null) => node ? observeMapContrast(node) : undefined, [])
}
