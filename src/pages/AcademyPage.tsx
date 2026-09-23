import { useMemo, useState, type ComponentProps } from 'react'
import { Card } from '@oxy.so/bloom/card'
import { Badge } from '@oxy.so/bloom/badge'
import { Item } from '@oxy.so/bloom/item'
import { Search } from '@oxy.so/bloom/search'
import { EmptyState } from '@oxy.so/bloom/empty-state'
import { IconCircle } from '@oxy.so/bloom/icon-circle'
import { RiSearchLine } from '@oxy.so/bloom/icons/RiSearchLine'
import { RiArrowRightSLine } from '@oxy.so/bloom/icons/RiArrowRightSLine'
import { Link } from '../lib/navigation'
import Button from '../components/ui/Button'
import AcademyShell from '../components/academy/AcademyShell'
import { useStatusLabel, useTrackLabels } from '../components/academy/academyLabels'
import { CourseCard, CourseProgressBar } from '../components/academy/CourseParts'
import { LessonStatusMark } from '../components/academy/ProgressMarks'
import {
  academyTotals,
  groupByTrack,
  lessonPath,
  lessonStatus,
  pickResume,
  pickStarterCourse,
  searchAcademy,
} from '../components/academy/academyModel'
import { useAcademyAllProgress } from '../components/academy/useAcademyProgress'
import { useCurrentLocale, useTranslation } from '../lib/i18n'
import { loadCourses, type CourseWithLessons } from '../content/academy-loader'
import type { CourseProgress } from '../components/academy/progressStorage'

/* ──────────────────────────────────────────────
 * /academy/ — the catalog.
 *
 * A page header, the learner's next step (resume where they left off, or the
 * course a newcomer starts with), then every course grouped by track. The
 * rail's search filters this page too: a query swaps the catalog for its
 * matching courses and lessons.
 * ──────────────────────────────────────────── */

/** Where a returning learner left off. A new learner gets no card: the catalog marks where to start. */
function ContinueCard({ courses, progress }: { courses: CourseWithLessons[]; progress: Record<string, CourseProgress> }) {
  const { t } = useTranslation()
  const resume = pickResume(courses, progress)
  if (!resume) return null
  const { course, lesson, summary } = resume
  return (
    <Card appearance="solid" radius="radius-20">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold text-primary">{t('academy.continueLearning')}</span>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{course.title}</h2>
          <p className="text-sm text-muted-foreground">{t('academy.nextUp', { lesson: lesson.frontmatter.title })}</p>
          <CourseProgressBar completed={summary.completed} total={summary.total} className="mt-2 max-w-sm" />
        </div>
        <Button href={lessonPath(course.slug, lesson.lessonSlug)} variant="primary" size="md" className="shrink-0 self-start sm:self-center">
          {t('academy.continue')}
        </Button>
      </div>
    </Card>
  )
}

function Catalog({ courses, progress }: { courses: CourseWithLessons[]; progress: Record<string, CourseProgress> }) {
  const { t } = useTranslation()
  // Only a learner with nothing started is pointed at a first course.
  const starter = academyTotals(courses, progress).coursesStarted === 0 ? pickStarterCourse(courses) : null
  const trackLabels = useTrackLabels()
  return (
    <div className="flex flex-col gap-12">
      {groupByTrack(courses).map(({ track, courses: trackCourses }) => {
        const { label, blurb } = trackLabels(track)
        const soon = trackCourses.length === 0
        return (
          <section key={track.key} aria-labelledby={`academy-track-${track.key}`} className={soon ? 'opacity-70' : undefined}>
            <div className="mb-5 flex items-center gap-4">
              <IconCircle icon={track.Icon as ComponentProps<typeof IconCircle>['icon']} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`academy-track-${track.key}`} className="text-lg font-semibold tracking-tight text-foreground">
                    {label}
                  </h2>
                  {soon ? <Badge content={t('academy.comingSoon')} variant="subtle" color="default" size="label-small" /> : null}
                </div>
                <p className="text-sm text-muted-foreground">{blurb}</p>
              </div>
            </div>
            {soon ? null : (
              <ul className="grid gap-3">
                {trackCourses.map((course) => (
                  <li key={course.slug}>
                    <CourseCard course={course} progress={progress[course.slug]} startHere={course.slug === starter?.slug} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

function SearchResults({
  courses,
  progress,
  query,
  onClear,
}: {
  courses: CourseWithLessons[]
  progress: Record<string, CourseProgress>
  query: string
  onClear: () => void
}) {
  const { t } = useTranslation()
  const statusLabel = useStatusLabel()
  const hits = searchAcademy(courses, query)
  const q = query.trim()
  const matchedCourses = hits.map((hit) => hit.course)
  const matchedLessons = hits.flatMap((hit) => hit.lessons.map((lesson) => ({ course: hit.course, lesson })))
  const count = matchedCourses.length + matchedLessons.length

  if (hits.length === 0) {
    return (
      <>
        <p role="status" className="sr-only">
          {t('academy.noResultsTitle', { query: q })}
        </p>
        <EmptyState
        icon={RiSearchLine}
        title={t('academy.noResultsTitle', { query: q })}
        description={t('academy.noResultsBody')}
        action={{ label: t('academy.clearSearch'), onPress: onClear }}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="text-sm text-muted-foreground" role="status">
        {count === 1 ? t('academy.resultsOne', { query: q }) : t('academy.resultsOther', { count, query: q })}
      </p>
      <section aria-labelledby="academy-results-courses">
        <h2 id="academy-results-courses" className="mb-4 text-sm font-semibold text-foreground">
          {t('academy.courses')}
        </h2>
        <ul className="grid gap-3">
          {matchedCourses.map((course) => (
            <li key={course.slug}>
              <CourseCard course={course} progress={progress[course.slug]} />
            </li>
          ))}
        </ul>
      </section>
      {matchedLessons.length > 0 ? (
        <section aria-labelledby="academy-results-lessons">
          <h2 id="academy-results-lessons" className="mb-3 text-sm font-semibold text-foreground">
            {t('academy.lessons')}
          </h2>
          <Card appearance="outline" radius="radius-16">
            <ul className="flex flex-col p-1.5">
              {matchedLessons.map(({ course, lesson }) => {
                const status = lessonStatus(progress[course.slug], lesson.lessonSlug)
                return (
                  <li key={`${course.slug}/${lesson.lessonSlug}`}>
                    <Link
                      to={lessonPath(course.slug, lesson.lessonSlug)}
                      className="block rounded-lg outline-offset-1 hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Item
                        leading={<LessonStatusMark status={status} />}
                        title={lesson.frontmatter.title}
                        subtitle={course.title}
                        trailing={
                          <span aria-hidden="true" className="inline-flex text-muted-foreground">
                            <RiArrowRightSLine width={18} height={18} fill="currentColor" />
                          </span>
                        }
                      />
                      <span className="sr-only">, {statusLabel(status)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  )
}

export default function AcademyPage() {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const courses = useMemo(() => loadCourses(locale), [locale])
  const { data: progress } = useAcademyAllProgress()
  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0

  return (
    <AcademyShell
      seo={{
        title: 'Academy',
        description:
          'Short courses on Oxy ID, building on the platform and running it yourself, from first steps to production patterns.',
        canonicalPath: '/academy',
      }}
      query={query}
      onQueryChange={setQuery}
      context={t('academy.title')}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('academy.title')}</h1>
        <p className="max-w-2xl text-base text-muted-foreground">{t('academy.subtitle')}</p>
      </header>

      {/* The rail — and its search — is a sheet below lg; the catalog's own filter stays on the page. */}
      <div className="mt-6 lg:hidden">
        <Search value={query} onChangeText={setQuery} onClearText={() => setQuery('')} label={t('academy.searchLabel')} />
      </div>

      <div className="mt-8">
        {searching ? (
          <SearchResults courses={courses} progress={progress} query={query} onClear={() => setQuery('')} />
        ) : (
          <div className="flex flex-col gap-12">
            <ContinueCard courses={courses} progress={progress} />
            <Catalog courses={courses} progress={progress} />
          </div>
        )}
      </div>
    </AcademyShell>
  )
}
