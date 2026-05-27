import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, GraduationCap, Sparkles } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import PageSection from '../components/layout/PageSection'
import SectionHeading from '../components/layout/SectionHeading'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { loadCourse, loadCourses, type LessonEntry } from '../content/academy-loader'
import ShareWithMention from '../components/social/ShareWithMention'
import { courseGradient, courseInitials } from '../components/academy/courseVisual'
import { useAcademyProgress } from '../components/academy/useAcademyProgress'
import type { CourseProgress } from '../components/academy/progressStorage'

/* ──────────────────────────────────────────────
 * /academy/:slug
 *
 * Course landing page. Hero card carries the cover/gradient, summary, level
 * + duration metadata, and a CTA into the first lesson. The body lists every
 * lesson as a numbered card with title, description, and duration — no
 * accordion clicks required. A sticky aside surfaces course metadata and
 * the share action so users always have context while scrolling the
 * lesson list. Finally, a "More courses" rail closes the page with the
 * other courses in the catalog.
 * ──────────────────────────────────────────── */

/* ── Cover / gradient hero artwork ────────────────────────── */

function CourseHeroArtwork({
  slug,
  title,
  cover,
}: {
  slug: string
  title: string
  cover: string
}) {
  if (cover) {
    return (
      <img
        src={cover}
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
    )
  }
  const gradient = courseGradient(slug)
  const initials = courseInitials(title)
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${gradient.from} ${gradient.via} ${gradient.to}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
      <span className="absolute -right-8 -bottom-12 text-[14rem] font-semibold leading-none text-white/15 tracking-tighter select-none">
        {initials}
      </span>
    </div>
  )
}

/* ── Lesson row ───────────────────────────────────────────── */

function LessonRow({
  courseSlug,
  lesson,
  index,
  isCompleted,
  isResumeTarget,
}: {
  courseSlug: string
  lesson: LessonEntry
  index: number
  isCompleted: boolean
  isResumeTarget: boolean
}) {
  const duration = lesson.frontmatter.duration ?? ''
  return (
    <Link
      to={`/academy/${courseSlug}/${lesson.lessonSlug}`}
      aria-label={`${lesson.frontmatter.title}${isCompleted ? ' — completed' : ''}${
        isResumeTarget ? ' — resume here' : ''
      }`}
      className={`group flex items-start gap-5 rounded-2xl border p-5 transition-colors md:p-6 ${
        isResumeTarget
          ? 'border-foreground bg-background hover:bg-surface'
          : 'border-border bg-background hover:bg-surface'
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold transition-colors ${
          isCompleted
            ? 'border border-transparent bg-foreground text-background'
            : 'border border-border bg-surface text-foreground'
        }`}
        aria-hidden="true"
      >
        {isCompleted ? <Check className="size-4" /> : String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-base font-medium text-foreground md:text-lg">
            {lesson.frontmatter.title}
          </h3>
          {duration ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              {duration}
            </span>
          ) : null}
          {isResumeTarget ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
              Resume here
            </span>
          ) : null}
          {isCompleted && !isResumeTarget ? (
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Completed
            </span>
          ) : null}
        </div>
        {lesson.frontmatter.description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {lesson.frontmatter.description}
          </p>
        ) : null}
      </div>
      <ArrowRight
        className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  )
}

/* ── More-courses rail card ───────────────────────────────── */

function RelatedCourseCard({
  course,
}: {
  course: { slug: string; title: string; summary: string; coverImage?: string; level: string }
}) {
  const cover = course.coverImage ?? ''
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background transition-colors hover:bg-surface"
    >
      <div className="aspect-[16/10] w-full">
        <CourseHeroArtwork slug={course.slug} title={course.title} cover={cover} />
      </div>
      <div className="flex flex-1 flex-col p-6 lg:p-7">
        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <GraduationCap className="size-3" aria-hidden="true" />
          {course.level}
        </span>
        <h3 className="mt-3 text-lg font-medium text-foreground md:text-xl">{course.title}</h3>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{course.summary}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          Open course
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

function pickResumeLessonSlug(
  lessons: LessonEntry[],
  progress: CourseProgress,
): string | null {
  if (lessons.length === 0) return null
  // First not-completed lesson; if every lesson is completed, no resume target.
  for (const lesson of lessons) {
    if (progress[lesson.lessonSlug]?.status !== 'completed') {
      return lesson.lessonSlug
    }
  }
  return null
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const locale = useCurrentLocale()
  const course = loadCourse(slug ?? '', locale)
  const allCourses = useMemo(() => loadCourses(locale), [locale])
  const related = useMemo(
    () => allCourses.filter((c) => c.slug !== course?.slug).slice(0, 3),
    [allCourses, course],
  )

  // Hook must run before the early `if (!course)` return — pass an empty
  // slug fallback so it stays inert when no course resolves. The store
  // accepts any kebab-case key, so this is safe.
  const { data: progress } = useAcademyProgress(slug ?? course?.slug ?? 'unknown')

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEO
          title="Course not found"
          description="The course you are looking for does not exist."
          canonicalPath={`/academy/${slug ?? ''}`}
          noIndex
        />
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Course not found</h1>
          <Link to="/academy" className="text-sm text-primary hover:underline">
            Back to Academy
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const duration = course.duration ?? ''
  const cover = course.coverImage ?? ''
  const firstLesson = course.lessons[0]
  const totalDurationText = duration
    ? duration
    : course.lessons.length > 0
      ? `${course.lessons.length} ${course.lessons.length === 1 ? 'lesson' : 'lessons'}`
      : ''

  const resumeLessonSlug = pickResumeLessonSlug(course.lessons, progress)
  const completedCount = course.lessons.reduce(
    (acc, l) => (progress[l.lessonSlug]?.status === 'completed' ? acc + 1 : acc),
    0,
  )
  const completionPct =
    course.lessons.length > 0
      ? Math.round((completedCount / course.lessons.length) * 100)
      : 0
  const isCourseStarted = completedCount > 0 || resumeLessonSlug !== firstLesson?.lessonSlug
  // The hero CTA flips to "Resume" once any lesson is completed (or once we
  // know about an in-progress lesson). When the entire course is finished
  // it stays on the last lesson for re-reads.
  const heroCtaLessonSlug =
    resumeLessonSlug ?? course.lessons[course.lessons.length - 1]?.lessonSlug ?? null
  const heroCtaLabel =
    completedCount === 0
      ? 'Start first lesson'
      : completedCount === course.lessons.length
        ? 'Review course'
        : 'Resume course'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={course.title}
        description={course.summary || `Learn ${course.title} on Oxy Academy.`}
        canonicalPath={`/academy/${course.slug}`}
        ogImage={cover || undefined}
        ogType="article"
      />
      <Navbar />
      <main>
        {/* ═══ Hero (text column + visual column) ═══ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-surface to-background"
          />
          <div className="mx-auto max-w-[1200px] px-6 pt-28 pb-12 lg:px-8 lg:pt-36 lg:pb-16">
            <Link
              to="/academy"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Academy
            </Link>

            <div className="mt-8 grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
              {/* Text column */}
              <div className="flex flex-col gap-5 lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-primary">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Oxy Academy course
                  </span>
                  {course.level ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{course.level}</span>
                    </>
                  ) : null}
                </div>

                <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
                  {course.title}
                </h1>
                {course.summary && (
                  <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                    {course.summary}
                  </p>
                )}

                <dl className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {totalDurationText ? (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" aria-hidden="true" />
                      <dt className="sr-only">Duration</dt>
                      <dd>{totalDurationText}</dd>
                    </div>
                  ) : null}
                  {course.lessons.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4" aria-hidden="true" />
                      <dt className="sr-only">Lessons</dt>
                      <dd>
                        {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4" aria-hidden="true" />
                    <dt className="sr-only">Cost</dt>
                    <dd>Free, self-paced</dd>
                  </div>
                  {isCourseStarted && course.lessons.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Check className="size-4" aria-hidden="true" />
                      <dt className="sr-only">Progress</dt>
                      <dd>
                        {completedCount} / {course.lessons.length} completed ({completionPct}%)
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {course.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {heroCtaLessonSlug ? (
                    <Button
                      variant="primary"
                      size="md"
                      responsive
                      href={`/academy/${course.slug}/${heroCtaLessonSlug}`}
                    >
                      {heroCtaLabel}
                    </Button>
                  ) : null}
                  <Button variant="outline" size="md" responsive href="/academy">
                    Browse all courses
                  </Button>
                </div>
              </div>

              {/* Visual column */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
                  <div className="aspect-[16/11] w-full">
                    <CourseHeroArtwork slug={course.slug} title={course.title} cover={cover} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Curriculum + sticky aside ═══ */}
        {course.lessons.length > 0 && (
          <PageSection spacing="md">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              {/* Curriculum column */}
              <div className="lg:col-span-8">
                <SectionHeading
                  eyebrow="Curriculum"
                  title="What you'll cover."
                  description="Lessons are short, sequenced, and link out to the platform docs when you want to go deeper."
                />
                <ol className="mt-10 flex flex-col gap-3">
                  {course.lessons.map((lesson, index) => (
                    <li key={lesson.lessonSlug}>
                      <LessonRow
                        courseSlug={course.slug}
                        lesson={lesson}
                        index={index}
                        isCompleted={progress[lesson.lessonSlug]?.status === 'completed'}
                        isResumeTarget={lesson.lessonSlug === resumeLessonSlug && completedCount > 0}
                      />
                    </li>
                  ))}
                </ol>
              </div>

              {/* Sticky aside */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6 md:p-7">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      About this course
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {course.summary}
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 border-t border-border pt-5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Level</dt>
                      <dd className="font-medium capitalize text-foreground">{course.level}</dd>
                    </div>
                    {duration ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Duration</dt>
                        <dd className="font-medium text-foreground">{duration}</dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Lessons</dt>
                      <dd className="font-medium text-foreground">{course.lessons.length}</dd>
                    </div>
                    {course.lessons.length > 0 && isCourseStarted ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Progress</dt>
                        <dd className="font-medium text-foreground">
                          {completedCount} / {course.lessons.length}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="font-medium text-foreground">Free</dd>
                    </div>
                  </dl>

                  {isCourseStarted && course.lessons.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-foreground transition-[width] duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{completionPct}% complete</p>
                    </div>
                  ) : null}

                  {heroCtaLessonSlug ? (
                    <Button
                      variant="primary"
                      size="md"
                      href={`/academy/${course.slug}/${heroCtaLessonSlug}`}
                      className="w-full"
                    >
                      {heroCtaLabel}
                    </Button>
                  ) : null}

                  <div className="border-t border-border pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Share this course
                    </p>
                    <ShareWithMention
                      title={course.title}
                      url={`https://oxy.so/academy/${course.slug}`}
                      hashtags={['oxyacademy']}
                      via="oxy"
                    />
                  </div>
                </div>
              </aside>
            </div>
          </PageSection>
        )}

        {/* ═══ More courses ═══ */}
        {related.length > 0 && (
          <PageSection spacing="lg" tone="surface">
            <SectionHeading
              eyebrow="Keep learning"
              title="More from Academy."
              description="Other courses to round out what you just learned."
            />
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {related.map((c) => (
                <RelatedCourseCard
                  key={c.slug}
                  course={{
                    slug: c.slug,
                    title: c.title,
                    summary: c.summary,
                    coverImage: c.coverImage,
                    level: c.level,
                  }}
                />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="md" responsive href="/academy">
                Browse all courses
              </Button>
            </div>
          </PageSection>
        )}

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
