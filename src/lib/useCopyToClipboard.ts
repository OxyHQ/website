import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from '@oxy.so/bloom'
import { useTranslation } from './i18n'

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

/** What `copy` accepts: the text, or a promise of it (a lazily loaded source). */
export type CopySource = string | null | undefined | Promise<string | null | undefined>

/**
 * The site's one clipboard flow. `copy(text, message?)` writes the text and
 * says so in a toast — `message`, or "Copied to clipboard" — and a failure
 * (a refused permission, an insecure context, nothing to copy) says so too,
 * rather than leaving a button that silently did nothing. `copied` is true for
 * `resetMs` after a success, for callers that also swap a label or an icon;
 * the timer restarts on every copy and is cleared on unmount.
 *
 * `copy` resolves to whether the write succeeded.
 */
export function useCopyToClipboard(resetMs = 2000): {
  copied: boolean
  copy: (text: CopySource, message?: string) => Promise<boolean>
} {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: CopySource, message?: string) => {
      try {
        const value = await text
        if (!value) throw new Error('nothing to copy')
        // `navigator.clipboard` is undefined outside a secure context; the
        // TypeError lands in the same catch as a refused permission.
        await navigator.clipboard.writeText(value)
      } catch (error) {
        console.warn('[useCopyToClipboard] clipboard write failed:', error)
        toast.error(t('common.copyFailed'))
        return false
      }
      toast.success(message ?? t('common.copiedToClipboard'))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), resetMs)
      return true
    },
    [t, resetMs],
  )

  return { copied, copy }
}
