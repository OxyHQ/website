import { Suspense, createElement, useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { Card } from '@oxy.so/bloom/card'
import { Badge } from '@oxy.so/bloom/badge'
import { Button as BloomButton } from '@oxy.so/bloom/button'
import { EmptyState } from '@oxy.so/bloom/empty-state'
import { RiArrowLeftLine } from '@oxy.so/bloom/icons/RiArrowLeftLine'
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine'
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { RiCompass3Line } from '@oxy.so/bloom/icons/RiCompass3Line'
import { RiMedalLine } from '@oxy.so/bloom/icons/RiMedalLine'
import { RiTimeLine } from '@oxy.so/bloom/icons/RiTimeLine'
import { useNavigate } from '../lib/navigation'
import Button from '../components/ui/Button'
import AcademyShell from '../components/academy/AcademyShell'
import { AcademyBreadcrumb } from '../components/academy/AcademyBreadcrumb'
import { LessonOutline } from '../components/academy/LessonOutline'
import { LessonStatusMark } from '../components/academy/ProgressMarks'
import { useAcademyProgress } from '../components/academy/useAcademyProgress'
import {
  academyPath,
  coursePath,
  lessonPath,
  nextStep,
  summarizeCourse,
} from '../components/academy/academyModel'
import { useContentHeadings } from '../hooks/useContentHeadings'
import { useCurrentLocale, useTranslation } from '../lib/i18n'
import { loadCourses, loadLesson } from '../content/academy-loader'
import { mdxContentComponents } from '../content/_components'

/* ──────────────────────────────────────────────
 * /academy/:slug/:lesson/ — the lesson reader.
 *
 * Breadcrumb, title and meta, the lesson's MDX exactly as authored, then the
 * end of the lesson: mark it complete, and move on — the next lesson, the
 * next course's first lesson when this was the course's last, or back to the
 * course at the very end. "On this page" sits beside the column on xl+.
 *
 * Reading to the end of the article also completes the lesson — the button is
 * the explicit way, the scroll a nudge for readers who skim past it.
 * ──────────────────────────────────────────── */

function LessonNotFound({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <AcademyShell
      seo={{
        title: t('academy.notFoundLesson'),
        description: t('academy.notFoundLessonBody'),
        canonicalPath: `/academy/${courseSlug}/${lessonSlug}`,
        noIndex: true,
      }}
      context={t('academy.title')}
    >
      <EmptyState
        icon={RiCompass3Line}
        media="circle"
        title={t('academy.notFoundLesson')}
        description={t('academy.notFoundLessonBody')}
        action={{ label: t('academy.backToAcademy'), onPress: () => navigate(academyPath) }}
      />
    </AcademyShell>
  )
}

export default function LessonPage() {
  const params = useParams<{ slug: string; lesson: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  const courseSlug = params.slug ?? ''
  const lessonSlug = params.lesson ?? ''
  const data = loadLesson(courseSlug, lessonSlug, locale)
  const courses = useMemo(() => loadCourses(locale), [locale])

  // Hooks run before the not-found return; an unknown slug is a harmless key.
  const { data: progress, isAuthenticated, markLessonStarted, markLessonCompleted } = useAcademyProgress(courseSlug)
  const isLessonCompleted = progress[lessonSlug]?.status === 'completed'
  const { headings, contentRef } = useContentHeadings()

  // The scroll listener outlives the render that installed it, so it calls the
  // latest progress actions through a ref — a closure over the first render's
  // actions would write over progress saved since.
  const actionsRef = useRef({ markLessonStarted, markLessonCompleted })
  useEffect(() => {
    actionsRef.current = { markLessonStarted, markLessonCompleted }
  })

  // Reading a quarter of the article marks the lesson in progress; reading
  // past 90% completes it. Opening a lesson marks nothing: a page view is not
  // reading, and the Academy's "started" must not count one.
  const articleRef = useRef<HTMLElement | null>(null)
  const setArticle = useCallback(
    (node: HTMLElement | null) => {
      articleRef.current = node
      contentRef(node)
    },
    [contentRef],
  )
  useEffect(() => {
    if (!data || isLessonCompleted || typeof window === 'undefined') return
    const article = articleRef.current
    if (!article) return
    let markedStarted = false
    const onScroll = () => {
      const height = article.offsetHeight
      if (height <= 0) return
      const read = -article.getBoundingClientRect().top / height
      if (read >= 0.9) {
        actionsRef.current.markLessonCompleted(lessonSlug)
        window.removeEventListener('scroll', onScroll)
      } else if (read >= 0.25 && !markedStarted) {
        markedStarted = true
        actionsRef.current.markLessonStarted(lessonSlug)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [data, isLessonCompleted, lessonSlug])

  if (!data) return <LessonNotFound courseSlug={courseSlug} lessonSlug={lessonSlug} />

  const { course: courseMeta, lesson, position, prev } = data
  const course = courses.find((c) => c.slug === courseMeta.slug)
  const total = course?.lessons.length ?? 0
  const summary = course ? summarizeCourse(course, progress) : null
  const courseDone = summary?.status === 'completed'
  const next = nextStep(courses, courseMeta.slug, lessonSlug)
  const nextIsNewCourse = next !== null && next.course.slug !== courseMeta.slug
  const nextCourseAfterThis = nextStep(courses, courseMeta.slug, course?.lessons[total - 1]?.lessonSlug ?? lessonSlug)

  return (
    <AcademyShell
      seo={{
        title: t('academy.seoLessonTitle', { lesson: lesson.frontmatter.title, course: courseMeta.title }),
        description: lesson.frontmatter.description,
        canonicalPath: `/academy/${courseMeta.slug}/${lesson.lessonSlug}`,
        ogType: 'article',
      }}
      activeCourse={courseMeta.slug}
      activeLesson={lesson.lessonSlug}
      context={
        <>
          <span className="font-medium text-foreground">{courseMeta.title}</span>
          {total > 0 ? ` · ${t('academy.lessonOf', { n: position + 1, total })}` : ''}
        </>
      }
      aside={<LessonOutline headings={headings} />}
    >
      <AcademyBreadcrumb
        items={[
          { label: t('academy.title'), to: academyPath },
          { label: courseMeta.title, to: coursePath(courseMeta.slug) },
          { label: lesson.frontmatter.title },
        ]}
      />

      <header className="mt-6 mb-8 flex flex-col gap-3 border-b border-border pb-8">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {lesson.frontmatter.title}
        </h1>
        {lesson.frontmatter.description ? (
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground">{lesson.frontmatter.description}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {total > 0 ? <span>{t('academy.lessonOf', { n: position + 1, total })}</span> : null}
          {lesson.frontmatter.duration ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-flex">
                <RiTimeLine width={16} height={16} fill="currentColor" />
              </span>
              {lesson.frontmatter.duration}
            </span>
          ) : null}
          {isLessonCompleted ? (
            <Badge content={t('academy.statusCompleted')} variant="subtle" color="success" size="label-small" icon={RiCheckLine} />
          ) : null}
        </div>
      </header>

      <article ref={setArticle} className="min-w-0 text-foreground">
        <MDXProvider components={mdxContentComponents}>
          <Suspense fallback={<div className="text-sm text-muted-foreground">{t('common.loading')}</div>}>
            {createElement(lesson.Component)}
          </Suspense>
        </MDXProvider>
      </article>

      <footer className="mt-12 flex flex-col gap-6 border-t border-border pt-8">
        {courseDone && position === total - 1 ? null : (
          <Card appearance="subtle" radius="radius-16">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex">
                  <LessonStatusMark status={isLessonCompleted ? 'completed' : 'not-started'} size={22} />
                </span>
                <div role="status">
                  <p className="text-sm font-semibold text-foreground">
                    {isLessonCompleted ? t('academy.lessonDone') : t('academy.lessonPrompt')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isLessonCompleted
                      ? isAuthenticated
                        ? t('academy.savedToAccount')
                        : t('academy.savedOnDevice')
                      : t('academy.lessonPromptHint')}
                  </p>
                </div>
              </div>
              {isLessonCompleted ? null : (
                <BloomButton variant="primary" size="md" leadingIcon={RiCheckLine} onPress={() => markLessonCompleted(lessonSlug)}>
                  {t('academy.markComplete')}
                </BloomButton>
              )}
            </div>
          </Card>
        )}

        {courseDone && position === total - 1 ? (
          <Card appearance="outline" radius="radius-20">
            <EmptyState
              icon={RiMedalLine}
              media="circle"
              title={t('academy.courseCompleteTitle', { course: courseMeta.title })}
              description={t('academy.courseCompleteBody')}
              action={
                nextCourseAfterThis
                  ? {
                      label: `${t('academy.nextCourse')}: ${nextCourseAfterThis.course.title}`,
                      onPress: () => navigate(coursePath(nextCourseAfterThis.course.slug)),
                    }
                  : { label: t('academy.browseCourses'), onPress: () => navigate(academyPath) }
              }
              secondaryAction={{ label: t('academy.developerDocs'), onPress: () => navigate('/developers/docs/') }}
            />
          </Card>
        ) : null}

        <nav aria-label={t('academy.lessons')} className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col items-start gap-2">
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {prev ? prev.title : courseMeta.title}
            </span>
            <Button
              href={prev ? lessonPath(prev.course, prev.lessonSlug) : coursePath(courseMeta.slug)}
              variant="outline"
              size="md"
              rel={prev ? 'prev' : undefined}
            >
              <span aria-hidden="true" className="inline-flex">
                <RiArrowLeftLine width={16} height={16} fill="currentColor" />
              </span>
              {prev ? t('academy.previous') : t('academy.courseOverview')}
              {prev ? <span className="sr-only">: {prev.title}</span> : null}
            </Button>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {next ? (nextIsNewCourse ? `${next.course.title} · ${next.lesson.frontmatter.title}` : next.lesson.frontmatter.title) : courseMeta.title}
            </span>
            <Button
              href={next ? lessonPath(next.course.slug, next.lesson.lessonSlug) : coursePath(courseMeta.slug)}
              variant={isLessonCompleted ? 'primary' : 'outline'}
              size="md"
              rel={next && !nextIsNewCourse ? 'next' : undefined}
            >
              {next ? (nextIsNewCourse ? t('academy.nextCourse') : t('academy.next')) : t('academy.courseOverview')}
              {next ? <span className="sr-only">: {next.lesson.frontmatter.title}</span> : null}
              <span aria-hidden="true" className="inline-flex">
                <RiArrowRightLine width={16} height={16} fill="currentColor" />
              </span>
            </Button>
          </div>
        </nav>
      </footer>
    </AcademyShell>
  )
}
