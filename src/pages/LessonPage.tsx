import { Suspense, createElement, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PageSection from '../components/layout/PageSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { loadLesson, loadCourse } from '../content/academy-loader'
import { mdxContentComponents } from '../content/_components'
import ShareWithMention from '../components/social/ShareWithMention'
import { useAcademyProgress } from '../components/academy/useAcademyProgress'
import type { CourseProgress } from '../components/academy/progressStorage'

/* ──────────────────────────────────────────────
 * /academy/:slug/:lesson
 *
 * Lesson reader. Layout is a two-column grid on lg+: a sticky course outline
 * (highlights the active lesson, marks earlier lessons "complete" to give
 * users a sense of progress through the course) and the lesson body itself.
 * Below the body sits a progress bar, share controls, and prev/next pagers.
 * On smaller screens the outline collapses into a top progress strip so the
 * lesson body owns the full viewport width.
 * ──────────────────────────────────────────── */

interface LessonOutlineItem {
  lessonSlug: string
  title: string
  duration?: string
}

interface LessonSidebarProps {
  courseSlug: string
  courseTitle: string
  outline: LessonOutlineItem[]
  activeIndex: number
  progress: CourseProgress
}

function countCompleted(outline: LessonOutlineItem[], progress: CourseProgress): number {
  let n = 0
  for (const item of outline) {
    if (progress[item.lessonSlug]?.status === 'completed') n += 1
  }
  return n
}

function LessonSidebar({
  courseSlug,
  courseTitle,
  outline,
  activeIndex,
  progress,
}: LessonSidebarProps) {
  const total = outline.length
  const completed = countCompleted(outline, progress)
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
      <div className="sticky top-24 flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6">
        <Link
          to={`/academy/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Course overview
        </Link>
        <h3 className="text-base font-semibold tracking-tight text-foreground">{courseTitle}</h3>

        {/* Progress strip — driven by *actual* completion, not lesson position */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completed} / {total} completed
            </span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Lesson list */}
        <nav aria-label={`${courseTitle} lessons`}>
          <ol className="flex flex-col gap-1">
            {outline.map((item, index) => {
              const isActive = index === activeIndex
              const isCompleted = progress[item.lessonSlug]?.status === 'completed'
              return (
                <li key={item.lessonSlug}>
                  <Link
                    to={`/academy/${courseSlug}/${item.lessonSlug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-semibold ${
                        isActive
                          ? 'bg-foreground text-background'
                          : isCompleted
                            ? 'bg-foreground/10 text-foreground'
                            : 'border border-border bg-background text-muted-foreground'
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? <Check className="size-3" /> : String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{item.title}</span>
                      {item.duration ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" aria-hidden="true" />
                          {item.duration}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </aside>
  )
}

/* ── Mobile progress strip ────────────────────────────────── */

function LessonProgressStrip({
  courseSlug,
  courseTitle,
  completed,
  total,
}: {
  courseSlug: string
  courseTitle: string
  completed: number
  total: number
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="lg:hidden">
      <Link
        to={`/academy/${courseSlug}`}
        className="block rounded-2xl border border-border bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" aria-hidden="true" />
            <span className="font-medium uppercase tracking-wider">{courseTitle}</span>
          </span>
          <span>
            {completed} / {total} completed
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Link>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function LessonPage() {
  const params = useParams<{ slug: string; lesson: string }>()
  const locale = useCurrentLocale()
  const courseSlug = params.slug ?? ''
  const lessonSlug = params.lesson ?? ''
  const data = loadLesson(courseSlug, lessonSlug, locale)

  // The progress hook must always run (Rules of Hooks). When the lesson
  // doesn't resolve we just don't *use* the data — passing the URL params is
  // safe because the namespace store happily accepts any kebab-case key.
  const { data: progress, markLessonStarted, markLessonCompleted } =
    useAcademyProgress(courseSlug)
  const isLessonCompleted = progress[lessonSlug]?.status === 'completed'

  // Mark the lesson as started the first time this page mounts for this
  // (course, lesson) pair. Subsequent visits don't downgrade a completed
  // lesson back to "in-progress" — the markLessonStarted helper guards that.
  // We tuck the call in a useEffect because the mutation it issues is a DOM
  // side effect (a network write), not derived state.
  useEffect(() => {
    if (!data) return
    if (typeof window === 'undefined') return
    markLessonStarted(lessonSlug)
    // We deliberately omit `markLessonStarted` from deps — its identity
    // changes on every render (different `data` snapshot inside the
    // closure) and the markLessonStarted helper is idempotent for an
    // already-started lesson, so this re-runs only on lesson-slug changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lessonSlug])

  // Auto-mark-on-scroll: once the user has scrolled past 90% of the article
  // body, we mark the lesson as completed. The button below remains the
  // primary, explicit action — this is just a nudge for readers who skim
  // through the bottom CTA without clicking the button.
  const articleRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!data) return
    if (isLessonCompleted) return
    if (typeof window === 'undefined') return
    const article = articleRef.current
    if (!article) return

    const onScroll = () => {
      const rect = article.getBoundingClientRect()
      // Distance scrolled past the article's top into its body.
      const scrolledIntoArticle = -rect.top
      const articleHeight = article.offsetHeight
      if (articleHeight <= 0) return
      const ratio = scrolledIntoArticle / articleHeight
      if (ratio >= 0.9) {
        markLessonCompleted(lessonSlug)
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLessonCompleted, lessonSlug])

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEO
          title="Lesson not found"
          description="The lesson you are looking for does not exist."
          canonicalPath={`/academy/${courseSlug}/${lessonSlug}`}
          noIndex
        />
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Lesson not found</h1>
          <Link to="/academy" className="text-sm text-primary hover:underline">
            Back to Academy
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const { course, lesson, position, prev, next } = data
  const fullCourse = loadCourse(course.slug, locale)
  const outline: LessonOutlineItem[] = (fullCourse?.lessons ?? []).map((l) => ({
    lessonSlug: l.lessonSlug,
    title: l.frontmatter.title,
    duration: l.frontmatter.duration,
  }))
  const totalLessons = outline.length
  const completedCount = countCompleted(outline, progress)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={`${lesson.frontmatter.title} — ${course.title}`}
        description={lesson.frontmatter.description}
        canonicalPath={`/academy/${course.slug}/${lesson.lessonSlug}`}
        ogType="article"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[320px] bg-gradient-to-b from-surface to-background"
          />
          <div className="mx-auto max-w-[1200px] px-6 pt-28 pb-10 lg:px-8 lg:pt-36">
            <nav
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link to="/academy" className="transition-colors hover:text-foreground">
                Academy
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                to={`/academy/${course.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {course.title}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="truncate text-foreground">{lesson.frontmatter.title}</span>
            </nav>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-muted-foreground">
                <BookOpen className="size-3.5 text-primary" aria-hidden="true" />
                Lesson {position + 1}
                {totalLessons > 0 ? ` of ${totalLessons}` : ''}
              </span>
              {lesson.frontmatter.duration ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {lesson.frontmatter.duration}
                </span>
              ) : null}
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {lesson.frontmatter.title}
            </h1>
            {lesson.frontmatter.description && (
              <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                {lesson.frontmatter.description}
              </p>
            )}
          </div>
        </section>

        {/* ═══ Body + sticky outline ═══ */}
        <section className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Mobile progress strip (shown above body on <lg) */}
            <div className="lg:hidden">
              {totalLessons > 0 ? (
                <LessonProgressStrip
                  courseSlug={course.slug}
                  courseTitle={course.title}
                  completed={completedCount}
                  total={totalLessons}
                />
              ) : null}
            </div>

            {/* Body */}
            <article
              ref={articleRef}
              className="min-w-0 pb-4 text-foreground lg:col-span-8 xl:col-span-9 lg:pb-8"
            >
              <MDXProvider components={mdxContentComponents}>
                <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
                  {createElement(lesson.Component)}
                </Suspense>
              </MDXProvider>

              {/* Mark as completed — primary, explicit completion mechanism.
                  The scroll-based auto-mark above is a nudge, not a replacement. */}
              <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-9 place-items-center rounded-full transition-colors ${
                      isLessonCompleted
                        ? 'bg-foreground text-background'
                        : 'border border-border bg-background text-muted-foreground'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isLessonCompleted ? "You've completed this lesson." : 'Finished this lesson?'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isLessonCompleted
                        ? 'Progress is synced to your Oxy account when signed in.'
                        : 'Mark it complete to track your progress through the course.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => markLessonCompleted(lessonSlug)}
                  disabled={isLessonCompleted}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                    isLessonCompleted
                      ? 'cursor-not-allowed border border-border bg-background text-muted-foreground'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  }`}
                >
                  {isLessonCompleted ? 'Completed' : 'Mark as completed'}
                </button>
              </div>
            </article>

            {/* Sidebar */}
            {totalLessons > 0 ? (
              <LessonSidebar
                courseSlug={course.slug}
                courseTitle={course.title}
                outline={outline}
                activeIndex={position}
                progress={progress}
              />
            ) : null}
          </div>
        </section>

        {/* ═══ Prev / Next — compact secondary pagers ═══
              The sticky outline is the primary navigation. These plain-text
              pagers sit at the end of the article body for keyboard / mobile
              users and to surface lesson titles without duplicating the
              sidebar's card chrome. */}
        {(prev || next) && (
          <PageSection spacing="sm" width="narrow">
            <div className="flex items-stretch justify-between gap-6 border-t border-border pt-6 text-sm">
              {prev ? (
                <Link
                  to={`/academy/${prev.course}/${prev.lessonSlug}`}
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  rel="prev"
                >
                  <ArrowLeft
                    className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wider">
                      Previous
                    </span>
                    <span className="block truncate font-medium text-foreground">
                      {prev.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              {next ? (
                <Link
                  to={`/academy/${next.course}/${next.lessonSlug}`}
                  className="group ml-auto inline-flex items-center gap-2 text-right text-muted-foreground transition-colors hover:text-foreground"
                  rel="next"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wider">
                      Next
                    </span>
                    <span className="block truncate font-medium text-foreground">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          </PageSection>
        )}

        {/* ═══ Share ═══ */}
        <PageSection spacing="sm" width="narrow">
          <ShareWithMention
            title={`${lesson.frontmatter.title} — ${course.title}`}
            url={`https://oxy.so/academy/${course.slug}/${lesson.lessonSlug}`}
            hashtags={['oxyacademy', 'learn']}
            via="oxy"
          />
        </PageSection>

        {/* ═══ Course-complete CTA when no next lesson ═══ */}
        {!next && (
          <PageSection spacing="md" width="narrow">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center md:p-10">
              <span className="grid size-12 place-items-center rounded-full border border-border bg-background text-foreground">
                <Check className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-medium tracking-tight text-foreground">
                You finished the course.
              </h2>
              <p className="max-w-md text-pretty text-muted-foreground">
                Nice work. Pick another course or open the developer docs to keep building.
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/academy"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-foreground px-4 text-[15px] font-medium text-background transition-colors button-primary"
                >
                  Browse more courses
                </Link>
                <Link
                  to="/developers/docs"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium transition-colors button-outline"
                >
                  Developer docs
                </Link>
              </div>
            </div>
          </PageSection>
        )}

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
