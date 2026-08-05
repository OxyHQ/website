import { useEffect, useState } from 'react'
import { Check, LinkSimple } from '@phosphor-icons/react'

/**
 * Copies the article's URL. The label stays put and only the icon swaps, so the
 * button does not resize under the cursor at the moment it is clicked.
 */
export default function ShareLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch (error) {
      // A denied clipboard permission is the user's answer, not a failure to
      // report — but swallowing it silently would hide a real breakage.
      console.warn('Could not copy the article link', error)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="flex h-10 items-center justify-between gap-2 rounded-radius-8 bg-fill-inverse px-3 text-bg transition-opacity hover:opacity-90"
    >
      <span className="text-sm font-semibold">{copied ? 'Link copied' : 'Share this post'}</span>
      {copied ? <Check size={16} weight="bold" /> : <LinkSimple size={16} weight="bold" />}
    </button>
  )
}
