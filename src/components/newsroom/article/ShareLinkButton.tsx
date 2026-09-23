import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { RiLinkM } from '@oxy.so/bloom/icons/RiLinkM'
import { useTranslation } from '../../../lib/i18n'
import { useCopyToClipboard } from '../../../lib/useCopyToClipboard'

/**
 * Copies the article's URL. The label stays put and only the icon swaps, so the
 * button does not resize under the cursor at the moment it is clicked.
 */
export default function ShareLinkButton({ url }: { url: string }) {
  const { t } = useTranslation()
  const { copied, copy } = useCopyToClipboard()

  return (
    <button
      type="button"
      onClick={() => void copy(url, t('common.linkCopied'))}
      aria-live="polite"
      className="flex min-h-10 items-center justify-between gap-2 rounded-full px-2 py-2 text-body-sm text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span>{copied ? 'Copied' : 'Share'}</span>
      {copied ? (
        <RiCheckLine width={16} height={16} fill="currentColor" aria-hidden />
      ) : (
        <RiLinkM width={16} height={16} fill="currentColor" aria-hidden />
      )}
    </button>
  )
}
