import { useParams } from 'react-router-dom'
import { Card } from '@oxy.so/bloom/card'
import { Item } from '@oxy.so/bloom/item'
import { Badge } from '@oxy.so/bloom/badge'
import { EmptyState } from '@oxy.so/bloom/empty-state'
import { RiArrowRightSLine } from '@oxy.so/bloom/icons/RiArrowRightSLine'
import { RiCompass3Line } from '@oxy.so/bloom/icons/RiCompass3Line'
import { Link, useNavigate } from '../lib/navigation'
import Button from '../components/ui/Button'
import ShareWithMention from '../components/social/ShareWithMention'
import AcademyShell from '../components/academy/AcademyShell'
import { AcademyBreadcrumb } from '../components/academy/AcademyBreadcrumb'
import { lessonCountLabel, useStatusLabel, useTrackLabels } from '../components/academy/academyLabels'
import { CourseMeta, CourseProgressBar } from '../components/academy/CourseParts'
import { LessonStatusMark } from '../components/academy/ProgressMarks'
import { useAcademyProgress } from '../components/academy/useAcademyProgress'
import {
  academyPath,
  coursePath,
  groupByTrack,
  lessonPath,
  lessonStatus,
  summarizeCourse,
} from '../components/academy/academyModel'
import { useCurrentLocale, useTranslation } from '../lib/i18n'
import { brandConfig } from '../lib/seo'
import { loadCourse } from '../content/academy-loader'

/* ──────────────────────────────────────────────
 * /academy/:slug/ — a course.
 *
 * Breadcrumb, the course header with its one primary action (start, continue
 * at the next lesson, or review), the course's progress, and the curriculum:
 * every lesson a row that is its own link, with its status said in words as
 * well as drawn.
 * ──────────────────────────────────────────── */

function CourseNotFound({ slug }: { slug: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <AcademyShell
      seo={{
        title: t('academy.notFoundCourse'),
        description: t('academy.notFoundCourseBody'),
        canonicalPath: `/academy/${slug}`,
        noIndex: true,
      }}
      context={t('academy.title')}
    >
      <EmptyState
        icon={RiCompass3Line}
        media="circle"
        title={t('academy.notFoundCourse')}
        description={t('academy.notFoundCourseBody')}
        action={{ label: t('academy.backToAcademy'), onPress: () => navigate(academyPath) }}
      />
    </AcademyShell>
  )
}

export default function CourseDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const trackLabels = useTrackLabels()
  const statusLabel = useStatusLabel()
  const course = loadCourse(slug, locale)
  // Hooks run before the not-found return.
  const { data: progress } = useAcademyProgress(slug)
  const { origin } = brandConfig(typeof window === 'undefined' ? undefined : window.location.hostname)

  if (!course) return <CourseNotFound slug={slug} />

  const summary = summarizeCourse(course, progress)
  const track = groupByTrack([course]).find((group) => group.courses.length > 0)?.track
  const firstLesson = course.lessons[0]
  const cta =
    summary.status === 'completed'
      ? firstLesson && { label: t('academy.reviewCourse'), to: lessonPath(course.slug, firstLesson.lessonSlug) }
      : summary.status === 'in-progress' && summary.nextLesson
        ? {
            label: t('academy.continueLesson', { lesson: summary.nextLesson.frontmatter.title }),
            to: lessonPath(course.slug, summary.nextLesson.lessonSlug),
          }
        : firstLesson && { label: t('academy.startCourse'), to: lessonPath(course.slug, firstLesson.lessonSlug) }

  return (
    <AcademyShell
      seo={{
        title: course.title,
        // Course titles and summaries are content, not chrome; only the
        // fallback sentence is a dictionary string (prerender uses it too).
        description: course.summary || t('academy.seoCourseDescription', { course: course.title }),
        canonicalPath: `/academy/${course.slug}`,
        ogImage: course.coverImage || undefined,
        ogType: 'article',
      }}
      activeCourse={course.slug}
      context={course.title}
    >
      <AcademyBreadcrumb items={[{ label: t('academy.title'), to: academyPath }, { label: course.title }]} />

      <header className="mt-6 flex flex-col gap-3">
        {track ? <span className="text-xs font-semibold text-primary">{trackLabels(track).label}</span> : null}
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{course.title}</h1>
        {course.summary ? <p className="max-w-2xl text-pretty text-base text-muted-foreground">{course.summary}</p> : null}
        <div className="mt-1">
          <CourseMeta course={course} />
        </div>
      </header>

      <div className="mt-7 flex flex-col gap-5">
        {summary.status !== 'not-started' ? (
          <CourseProgressBar completed={summary.completed} total={summary.total} className="max-w-md" />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {cta ? (
            <Button href={cta.to} variant="primary" size="md" className="max-w-full">
              <span className="truncate">{cta.label}</span>
            </Button>
          ) : null}
          <ShareWithMention
            title={course.title}
            url={`${origin}${coursePath(course.slug)}`}
            hashtags={['oxyacademy']}
            via="oxy"
          />
        </div>
      </div>

      {course.lessons.length > 0 ? (
        <section aria-labelledby="academy-curriculum" className="mt-12">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="academy-curriculum" className="text-lg font-semibold tracking-tight text-foreground">
              {t('academy.curriculum')}
            </h2>
            <span className="text-sm text-muted-foreground">
              {summary.status === 'not-started'
                ? lessonCountLabel(t, summary.total)
                : t('academy.courseProgress', { done: summary.completed, total: summary.total })}
            </span>
          </div>
          <Card appearance="outline" radius="radius-16">
            <ol className="flex flex-col p-1.5">
              {course.lessons.map((lesson, index) => {
                const status = lessonStatus(progress, lesson.lessonSlug)
                const isNext = summary.status === 'in-progress' && summary.nextLesson?.lessonSlug === lesson.lessonSlug
                return (
                  <li key={lesson.lessonSlug} className={index > 0 ? 'border-t border-border' : undefined}>
                    <Link
                      to={lessonPath(course.slug, lesson.lessonSlug)}
                      className="group block rounded-lg outline-offset-1 hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Item
                        leading={<LessonStatusMark status={status} size={20} />}
                        trailing={
                          <span className="flex items-center gap-3">
                            {isNext ? <Badge content={t('academy.upNext')} variant="subtle" color="primary" size="label-small" /> : null}
                            {lesson.frontmatter.duration ? (
                              <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{lesson.frontmatter.duration}</span>
                            ) : null}
                            <span aria-hidden="true" className="inline-flex text-muted-foreground">
                              <RiArrowRightSLine width={18} height={18} fill="currentColor" />
                            </span>
                          </span>
                        }
                        style={{ paddingTop: 12, paddingBottom: 12 }}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground group-hover:text-primary">
                            <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                            {lesson.frontmatter.title}
                          </span>
                          {lesson.frontmatter.description ? (
                            <span className="line-clamp-1 text-[13px] text-muted-foreground">{lesson.frontmatter.description}</span>
                          ) : null}
                        </span>
                      </Item>
                      <span className="sr-only">, {statusLabel(status)}</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </Card>
        </section>
      ) : null}
    </AcademyShell>
  )
}
