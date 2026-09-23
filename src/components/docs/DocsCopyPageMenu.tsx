import { ButtonGroup, ButtonGroupItem } from '@oxy.so/bloom/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu'
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine'
import { RiFileCopyLine } from '@oxy.so/bloom/icons/RiFileCopyLine'
import { RiFileTextLine } from '@oxy.so/bloom/icons/RiFileTextLine'
import { RiLinkM } from '@oxy.so/bloom/icons/RiLinkM'
import { useTheme } from '@oxy.so/bloom/theme'
import { loadDocSource } from '../../content/docs-loader'
import { useTranslation } from '../../lib/i18n'
import { useCopyToClipboard } from '../../lib/useCopyToClipboard'

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n*/

interface DocsCopyPageMenuProps {
  title: string
  /** `SyncedPage.file`; without it there is no Markdown to copy and the row is hidden. */
  sourceFile?: string
}

export function DocsCopyPageMenu({ title, sourceFile }: DocsCopyPageMenuProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  // Two flows so only "Copy page" flips its own label to "Copied"; the menu
  // rows confirm through the toast alone.
  const page = useCopyToClipboard()
  const { copy } = useCopyToClipboard()

  function copyPage() {
    const text = document.querySelector('[data-docs-content]')?.textContent?.trim()
    void page.copy(text, t('docs.pageCopied'))
  }

  function copyMarkdown() {
    if (!sourceFile) return
    const source = loadDocSource(sourceFile)?.then((raw) => {
      const body = raw.replace(FRONTMATTER, '').trim()
      // Most synced docs open with their own H1; only supply one when missing.
      return `${/^#\s/.test(body) ? '' : `# ${title}\n\n`}${body}\n`
    })
    void copy(source, t('docs.markdownCopied'))
  }

  const iconProps = { width: 16, height: 16, fill: colors.textSecondary }

  return (
    <div className="ml-auto hidden shrink-0 sm:flex">
      <ButtonGroup size="sm" accessibilityLabel={t('docs.pageActions')}>
        <ButtonGroupItem leadingIcon={RiFileCopyLine} onPress={copyPage}>
          {page.copied ? t('docs.copied') : t('docs.copyPage')}
        </ButtonGroupItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild label={t('docs.moreActions')}>
            <ButtonGroupItem iconOnly leadingIcon={RiArrowDownSLine} accessibilityLabel={t('docs.moreActions')} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              leading={<RiLinkM {...iconProps} />}
              onPress={() => void copy(window.location.href, t('docs.linkCopied'))}
            >
              {t('docs.copyLink')}
            </DropdownMenuItem>
            {sourceFile ? (
              <DropdownMenuItem leading={<RiFileTextLine {...iconProps} />} onPress={copyMarkdown}>
                {t('docs.copyMarkdown')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </div>
  )
}
