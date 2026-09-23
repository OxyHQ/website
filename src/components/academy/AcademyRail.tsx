import type { ReactNode } from 'react'
import { Search } from '@oxy.so/bloom/search'
import { Item } from '@oxy.so/bloom/item'
import { Card } from '@oxy.so/bloom/card'
import { Meter } from '@oxy.so/bloom/stat-bar'
import { Button } from '@oxy.so/bloom/button'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { RiBookOpenLine } from '@oxy.so/bloom/icons/RiBookOpenLine'
import { Link } from '../../lib/navigation'
import { useTranslation } from '../../lib/i18n'
import type { CourseWithLessons } from '../../content/academy-loader'
import type { CourseProgress } from './progressStorage'
import {
  academyPath,
  academyTotals,
  coursePath,
  groupByTrack,
  isCourseAvailable,
  lessonPath,
  lessonStatus,
  searchAcademy,
  summarizeCourse,
} from './academyModel'
import { CourseProgressRing, LessonStatusMark } from './ProgressMarks'
import { useStatusLabel, useTrackLabels } from './academyLabels'

/* ──────────────────────────────────────────────
 * The Academy rail: search, the learner's progress, and the catalog grouped
 * by track — each course with its own progress, the active one expanded into
 * its lessons with their status.
 *
 * Rendered twice by `AcademyShell` — pinned beside the page on lg+, inside the
 * course-menu sheet below it — so it owns no layout of its own beyond the
 * column it stacks.
 * ──────────────────────────────────────────── */

export interface AcademyRailProps {
  courses: CourseWithLessons[]
  progress: Record<string, CourseProgress>
  query: string
  onQueryChange: (query: string) => void
  activeCourse?: string
  activeLesson?: string
  /** Called when a link in the rail is followed — the sheet closes itself with it. */
  onNavigate?: () => void
  /** In the sheet: closes it. Draws the close button beside the title. */
  onClose?: () => void
}


/** Rail titles wrap rather than truncate: a course name cut to "Getting started with…" says nothing. */
function RailTitle({ children, strong = false, small = false }: { children: ReactNode; strong?: boolean; small?: boolean }) {
  return (
    <span
      className={`min-w-0 flex-1 text-pretty leading-snug text-foreground ${small ? 'text-[13px]' : 'text-sm'} ${strong ? 'font-semibold' : 'font-medium'}`}
    >
      {children}
    </span>
  )
}

/** A rail row: the whole row is the link; `Item` draws it. */
function RailLink({
  to,
  current,
  onNavigate,
  srStatus,
  children,
}: {
  to: string
  current?: 'page' | 'true'
  onNavigate?: () => void
  srStatus?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      aria-current={current}
      onClick={onNavigate}
      className="block rounded-lg outline-offset-1 hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-ring"
    >
      {children}
      {srStatus ? <span className="sr-only">, {srStatus}</span> : null}
    </Link>
  )
}

function ProgressSummary({ courses, progress }: { courses: CourseWithLessons[]; progress: Record<string, CourseProgress> }) {
  const { t } = useTranslation()
  const totals = academyTotals(courses, progress)
  return (
    <Card appearance="outline" radius="radius-16">
      <div className="flex flex-col gap-2.5 p-4">
        <h2 className="text-xs font-semibold text-muted-foreground">{t('academy.yourProgress')}</h2>
        {totals.coursesStarted === 0 ? (
          <p className="text-sm text-muted-foreground">{t('academy.progressNone')}</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {t('academy.progressLessons', { done: totals.lessonsCompleted, total: totals.lessonsTotal })}
              </span>
            </div>
            <Meter
              value={totals.lessonsCompleted}
              max={Math.max(totals.lessonsTotal, 1)}
              height={4}
              accessibilityLabel={t('academy.yourProgress')}
              valueText={t('academy.progressLessons', { done: totals.lessonsCompleted, total: totals.lessonsTotal })}
            />
            <p className="text-xs text-muted-foreground">
              {t('academy.progressCourses', { started: totals.coursesStarted, total: totals.courseCount })}
              {totals.coursesCompleted > 0 ? ` · ${t('academy.progressCompleted', { count: totals.coursesCompleted })}` : ''}
            </p>
          </>
        )}
      </div>
    </Card>
  )
}

export function AcademyRail({
  courses,
  progress,
  query,
  onQueryChange,
  activeCourse,
  activeLesson,
  onNavigate,
  onClose,
}: AcademyRailProps) {
  const { t } = useTranslation()
  const trackLabels = useTrackLabels()
  const statusLabel = useStatusLabel()
  const searching = query.trim().length > 0
  const hits = searching ? searchAcademy(courses, query) : null
  const visible = hits ? hits.map((hit) => hit.course) : courses
  const lessonHits = new Map(hits?.map((hit) => [hit.course.slug, hit.lessons]) ?? [])
  const groups = groupByTrack(visible).filter((group) => !searching || group.courses.length > 0)
  const isIndex = !activeCourse

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          to={academyPath}
          aria-current={isIndex ? 'page' : undefined}
          onClick={onNavigate}
          className="flex w-fit items-center gap-2 rounded-lg px-1 text-lg font-semibold tracking-tight text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span aria-hidden="true" className="inline-flex text-primary">
            <RiBookOpenLine width={20} height={20} fill="currentColor" />
          </span>
          {t('academy.title')}
        </Link>
        {onClose ? (
          <Button
            iconOnly
            size="sm"
            appearance="plain"
            tone="neutral"
            leadingIcon={RiCloseLine}
            accessibilityLabel={t('common.close')}
            onPress={onClose}
          />
        ) : null}
      </div>

      <Search value={query} onChangeText={onQueryChange} onClearText={() => onQueryChange('')} label={t('academy.searchLabel')} />

      <ProgressSummary courses={courses} progress={progress} />

      <nav aria-label={t('academy.navLabel')} className="flex flex-col gap-5">
        {groups.map(({ track, courses: trackCourses }) => {
          const { label } = trackLabels(track)
          return (
            <section key={track.key} aria-labelledby={`academy-rail-${track.key}`}>
              <h2 id={`academy-rail-${track.key}`} className="mb-1 px-3 text-xs font-semibold text-muted-foreground">
                {label}
              </h2>
              {trackCourses.length === 0 ? (
                <p className="px-3 py-1.5 text-sm text-muted-foreground">{t('academy.comingSoon')}</p>
              ) : (
                <ul className="flex flex-col gap-px">
                  {trackCourses.map((course) => {
                    if (!isCourseAvailable(course)) {
                      return (
                        <li key={course.slug} className="opacity-60">
                          <Item
                            density="compact"
                            leading={<CourseProgressRing completed={0} total={0} />}
                            title={<RailTitle>{course.title}</RailTitle>}
                            trailing={<span className="text-xs text-muted-foreground">{t('academy.comingSoon')}</span>}
                          />
                        </li>
                      )
                    }
                    const courseProgress = progress[course.slug]
                    const summary = summarizeCourse(course, courseProgress)
                    const isActive = course.slug === activeCourse
                    const matched = lessonHits.get(course.slug) ?? []
                    const lessons = isActive && !searching ? course.lessons : matched
                    return (
                      <li key={course.slug}>
                        <RailLink
                          to={coursePath(course.slug)}
                          current={isActive ? (activeLesson ? 'true' : 'page') : undefined}
                          onNavigate={onNavigate}
                          srStatus={statusLabel(summary.status)}
                        >
                          <Item
                            density="compact"
                            active={isActive && !activeLesson}
                            leading={<CourseProgressRing completed={summary.completed} total={summary.total} />}
                            title={<RailTitle strong={isActive}>{course.title}</RailTitle>}
                            trailing={
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {summary.completed}/{summary.total}
                              </span>
                            }
                          />
                        </RailLink>
                        {lessons.length > 0 ? (
                          <ol className="mt-px mb-1 ml-[1.35rem] flex flex-col gap-px border-l border-border pl-1.5">
                            {lessons.map((lesson) => {
                              const status = lessonStatus(courseProgress, lesson.lessonSlug)
                              const isCurrent = isActive && lesson.lessonSlug === activeLesson
                              return (
                                <li key={lesson.lessonSlug}>
                                  <RailLink
                                    to={lessonPath(course.slug, lesson.lessonSlug)}
                                    current={isCurrent ? 'page' : undefined}
                                    onNavigate={onNavigate}
                                    srStatus={statusLabel(status)}
                                  >
                                    <Item
                                      density="compact"
                                      active={isCurrent}
                                      leading={<LessonStatusMark status={status} size={16} />}
                                      title={<RailTitle small>{lesson.frontmatter.title}</RailTitle>}
                                      style={{ paddingLeft: 10, paddingRight: 10 }}
                                    />
                                  </RailLink>
                                </li>
                              )
                            })}
                          </ol>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
        {searching && groups.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">{t('academy.noResultsTitle', { query: query.trim() })}</p>
        ) : null}
      </nav>
    </div>
  )
}
