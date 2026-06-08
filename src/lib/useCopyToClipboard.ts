import { useState, type ReactNode } from 'react'

/** Flatten a React node tree to its plain text — used to copy code blocks. */
export function reactNodeToText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(reactNodeToText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    if (props && 'children' in props) return reactNodeToText(props.children)
  }
  return ''
}

/**
 * Copy-to-clipboard with a transient "copied" flag. Shared by the docs code
 * surfaces (`MdxPre`, `CodeBlock`) so the copy UX can't drift between them.
 */
export function useCopyToClipboard(resetMs = 1500): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), resetMs)
      },
      // Surface real failures — clipboard rejections matter, no silent catch.
      (err: unknown) => console.error('[useCopyToClipboard] clipboard write failed:', err),
    )
  }
  return { copied, copy }
}
