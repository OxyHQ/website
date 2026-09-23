import { Badge } from '@oxy.so/bloom/badge'
import { Card } from '@oxy.so/bloom/card'
import { Meter } from '@oxy.so/bloom/stat-bar'
import { RiBookOpenLine } from '@oxy.so/bloom/icons/RiBookOpenLine'
import { RiTimeLine } from '@oxy.so/bloom/icons/RiTimeLine'
import { Link } from '../../lib/navigation'
import { useTranslation } from '../../lib/i18n'
import type { CourseLevel } from '../../content/academy-courses'
import type { CourseWithLessons } from '../../content/academy-loader'
import type { CourseProgress } from './progressStorage'
import { coursePath, isCourseAvailable, summarizeCourse } from './academyModel'
import { lessonCountLabel } from './academyLabels'

/* ──────────────────────────────────────────────
 * Pieces the index and the course page share: the level badge, the meta row,
 * the labelled progress bar and the catalog card.
 * ──────────────────────────────────────────── */

export function LevelBadge({ level }: { level: CourseLevel }) {
  const { t } = useTranslation()
  const label =
    level === 'beginner'
      ? t('academy.levelBeginner')
      : level === 'intermediate'
        ? t('academy.levelIntermediate')
        : t('academy.levelAdvanced')
  return <Badge content={label} variant="subtle" color={level === 'beginner' ? 'success' : level === 'intermediate' ? 'info' : 'warning'} size="label-small" />
}


/** Level, duration and lesson count, on one wrapping line. */
export function CourseMeta({ course }: { course: CourseWithLessons }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
      <LevelBadge level={course.level} />
      {course.duration ? (
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-flex">
            <RiTimeLine width={14} height={14} fill="currentColor" />
          </span>
          {course.duration}
        </span>
      ) : null}
      {course.lessons.length > 0 ? (
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-flex">
            <RiBookOpenLine width={14} height={14} fill="currentColor" />
          </span>
          {lessonCountLabel(t, course.lessons.length)}
        </span>
      ) : null}
    </div>
  )
}

/** A course's bar with its reading beside it: "2 of 3 lessons completed". */
export function CourseProgressBar({
  completed,
  total,
  className = '',
  decorative = false,
}: {
  completed: number
  total: number
  className?: string
  /** Inside a link that already says the progress in words. */
  decorative?: boolean
}) {
  const { t } = useTranslation()
  const reading = t('academy.courseProgress', { done: completed, total })
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="min-w-0 flex-1">
        {decorative ? (
          <Meter value={completed} max={Math.max(total, 1)} height={6} transitionMs={300} decorative />
        ) : (
          <Meter value={completed} max={Math.max(total, 1)} height={6} transitionMs={300} accessibilityLabel={t('academy.yourProgress')} valueText={reading} />
        )}
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden="true">
        {completed}/{total}
      </span>
    </div>
  )
}

/** The catalog card. The whole card is the link; a course without lessons yet is shown, muted, without one. */
export function CourseCard({ course, progress }: { course: CourseWithLessons; progress: CourseProgress | undefined }) {
  const { t } = useTranslation()
  const available = isCourseAvailable(course)
  const summary = summarizeCourse(course, progress)

  const body = (
    <Card appearance="outline" radius="radius-16" style={{ height: '100%' }}>
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary">{course.title}</h3>
          {!available ? (
            <Badge content={t('academy.comingSoon')} variant="subtle" color="default" size="label-small" />
          ) : summary.status === 'completed' ? (
            <Badge content={t('academy.statusCompleted')} variant="subtle" color="success" size="label-small" />
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.summary}</p>
        <div className="mt-auto flex flex-col gap-3 pt-1">
          <CourseMeta course={course} />
          {available && summary.status === 'in-progress' ? (
            <CourseProgressBar completed={summary.completed} total={summary.total} decorative />
          ) : null}
        </div>
      </div>
    </Card>
  )

  if (!available) {
    return (
      <div className="h-full opacity-60" aria-disabled="true">
        {body}
      </div>
    )
  }
  return (
    <Link
      to={coursePath(course.slug)}
      className="group block h-full rounded-2xl outline-offset-2 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {body}
      {/* Completion is already on the card as a badge; the other states are only drawn. */}
      {summary.status === 'completed' ? null : (
        <span className="sr-only">
          ,{' '}
          {summary.status === 'in-progress'
            ? t('academy.courseProgress', { done: summary.completed, total: summary.total })
            : t('academy.statusNotStarted')}
        </span>
      )}
    </Link>
  )
}
