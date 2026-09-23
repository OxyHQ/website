import { useMemo, useState, type ReactNode } from 'react'
import { ContentPanel } from '@oxy.so/bloom/content-panel'
import { Button } from '@oxy.so/bloom/button'
import { Dialog } from '@oxy.so/bloom/dialog'
import { RiMenuLine } from '@oxy.so/bloom/icons/RiMenuLine'
import PageShell from '../layout/PageShell'
import type { SEOProps } from '../SEO'
import { useCurrentLocale, useTranslation } from '../../lib/i18n'
import { useSiteHeaderBottom } from '../../hooks/useSiteHeaderBottom'
import { loadCourses } from '../../content/academy-loader'
import { useAcademyAllProgress } from './useAcademyProgress'
import { AcademyRail } from './AcademyRail'

/* ──────────────────────────────────────────────
 * The frame every Academy route shares: the site's header and footer
 * (`PageShell`), a rail pinned under the header on lg+, and the reading
 * column as a Bloom `ContentPanel` — framed from lg, full-bleed below it.
 *
 * Below lg the rail moves into a side sheet opened from a compact bar at the
 * top of the column, so a phone gets the whole width for the lesson and is
 * one tap from the catalog. An optional `aside` (the lesson's outline) sits to
 * the right of the panel on xl+.
 * ──────────────────────────────────────────── */

interface AcademyShellProps {
  seo: SEOProps
  activeCourse?: string
  activeLesson?: string
  /** Controlled search, for the index — where the rail's search filters the catalog too. */
  query?: string
  onQueryChange?: (query: string) => void
  /** What the compact bar says beside the course-menu button below lg. */
  context?: ReactNode
  /** Right-hand column on xl+, pinned like the rail. */
  aside?: ReactNode
  children: ReactNode
}

export default function AcademyShell({
  seo,
  activeCourse,
  activeLesson,
  query: controlledQuery,
  onQueryChange,
  context,
  aside,
  children,
}: AcademyShellProps) {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const courses = useMemo(() => loadCourses(locale), [locale])
  const { data: progress } = useAcademyAllProgress()
  const [ownQuery, setOwnQuery] = useState('')
  const query = controlledQuery ?? ownQuery
  const setQuery = onQueryChange ?? setOwnQuery
  const [menuOpen, setMenuOpen] = useState(false)
  const headerBottom = useSiteHeaderBottom()

  const railProps = { courses, progress, query, onQueryChange: setQuery, activeCourse, activeLesson }

  return (
    <PageShell
      seo={seo}
      className="bg-[color-mix(in_srgb,var(--primary)_3%,var(--background))]"
      mainClassName="flex-1"
    >
      <div className={`mx-auto flex w-full ${aside ? 'max-w-[94rem]' : 'max-w-[80rem]'}`}>
        <aside className="hidden w-[19.5rem] shrink-0 lg:block">
          <div
            className="sticky overflow-y-auto overscroll-contain px-4 pt-6 pb-10"
            style={{ top: headerBottom, maxHeight: `calc(100vh - ${headerBottom}px)` }}
          >
            <AcademyRail {...railProps} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-10 lg:py-4 lg:pr-6">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6 lg:hidden">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={RiMenuLine}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel={t('academy.openMenuLabel')}
            >
              {t('academy.openMenu')}
            </Button>
            {context ? <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{context}</div> : null}
          </div>

          <div className="flex w-full gap-8">
            <div className="min-w-0 flex-1 xl:max-w-[57rem]">
              <ContentPanel
                framedFrom={1024}
                overlaySizing="panel"
                chrome="border"
                surfaceClassName="bg-card max-lg:bg-transparent"
                contentClassName="px-4 pt-6 pb-4 sm:px-6 lg:px-12 lg:pt-10 lg:pb-12"
              >
                {children}
              </ContentPanel>
            </div>
            {aside ? (
              <aside className="hidden w-[13.5rem] shrink-0 xl:block">
                <div className="sticky pt-6" style={{ top: headerBottom + 16 }}>
                  {aside}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="left"
        width={336}
        label={t('academy.navLabel')}
      >
        <AcademyRail {...railProps} onNavigate={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} />
      </Dialog>
    </PageShell>
  )
}
