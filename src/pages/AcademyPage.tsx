import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, Clock, GraduationCap, Sparkles } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import PageSection from '../components/layout/PageSection'
import SectionHeading from '../components/layout/SectionHeading'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { loadCourses, ACADEMY_COURSES, type CourseWithLessons } from '../content/academy-loader'
import { courseGradient, courseInitials } from '../components/academy/courseVisual'
import { useAcademyAllProgress } from '../components/academy/useAcademyProgress'
import type { CourseProgress } from '../components/academy/progressStorage'

/* ──────────────────────────────────────────────
 * /academy
 *
 * Public Oxy Academy landing. Hero introduces the program, a feature card
 * spotlights the first featured course, and a grid surfaces the rest of the
 * catalog. When a course author hasn't provided a `coverImage`, each card
 * falls back to a deterministic gradient + monogram derived from the slug
 * so the listing reads visually rich instead of a wall of identical placeholders.
 * ──────────────────────────────────────────── */

const HERO_BADGE = 'Oxy Academy'
const HERO_TITLE = 'Learn to build on Oxy.'
const HERO_SUBTITLE =
  "Hands-on courses, deep guides and practical templates — everything you need to understand the platform and ship real work on top of it."
const COURSES_HEADING = 'All courses'
const COURSES_SUB =
  'Self-paced lessons that walk you from first principles to production. Start with the basics or jump to whichever topic you need.'
const SPOTLIGHT_HEADING = 'Start here'
const SPOTLIGHT_SUB = "If you're new to Oxy, this is the path we recommend."
const WHY_HEADING = 'Built for builders.'
const WHY_SUB = 'Every course is written by the team behind the product. Short lessons, real examples, zero filler.'

/* ── Course cover ─────────────────────────────────────────── */

function CourseCover({
  course,
  className,
}: {
  course: CourseWithLessons
  className: string
}) {
  const cover = course.coverImage ?? ''
  if (cover) {
    return (
      <img
        src={cover}
        alt=""
        loading="lazy"
        decoding="async"
        className={`${className} object-cover`}
      />
    )
  }
  const gradient = courseGradient(course.slug)
  const initials = courseInitials(course.title)
  return (
    <div
      className={`${className} relative overflow-hidden bg-gradient-to-br ${gradient.from} ${gradient.via} ${gradient.to}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
      <span className="absolute -right-4 -bottom-4 text-[8rem] font-semibold leading-none text-white/15 tracking-tighter select-none">
        {initials}
      </span>
      <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white/90 backdrop-blur">
        <GraduationCap className="size-3" aria-hidden="true" />
        Course
      </span>
    </div>
  )
}

/* ── Spotlight (large feature card) ───────────────────────── */

function CourseSpotlight({ course }: { course: CourseWithLessons }) {
  const firstLesson = course.lessons[0]
  return (
    <Link
      to={firstLesson ? `/academy/${course.slug}/${firstLesson.lessonSlug}` : `/academy/${course.slug}`}
      className="group grid overflow-hidden rounded-3xl border border-border bg-background transition-colors hover:bg-surface lg:grid-cols-5"
      aria-label={`${course.title} — start the first lesson`}
    >
      <CourseCover course={course} className="aspect-[16/10] w-full lg:col-span-3 lg:aspect-auto lg:h-full" />
      <div className="flex flex-col gap-5 p-8 lg:col-span-2 lg:p-10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Featured course
        </div>
        <h3 className="text-balance text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {course.title}
        </h3>
        <p className="text-pretty text-base leading-relaxed text-muted-foreground">{course.summary}</p>
        <CourseMeta course={course} />
        <div className="mt-auto pt-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            {firstLesson ? 'Start the first lesson' : 'Open course'}
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Standard course card ─────────────────────────────────── */

function CourseMeta({ course }: { course: CourseWithLessons }) {
  const duration = course.duration ?? ''
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 capitalize">
        <GraduationCap className="size-3.5" aria-hidden="true" />
        {course.level}
      </span>
      {duration ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          {duration}
        </span>
      ) : null}
      {course.lessons.length > 0 ? (
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5" aria-hidden="true" />
          {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'}
        </span>
      ) : null}
    </div>
  )
}

/* ── Per-course progress chip ─────────────────────────────── */

interface ProgressSummary {
  completed: number
  total: number
  status: 'not-started' | 'in-progress' | 'completed'
}

function summarize(course: CourseWithLessons, progress: CourseProgress): ProgressSummary {
  const total = course.lessons.length
  let completed = 0
  for (const lesson of course.lessons) {
    if (progress[lesson.lessonSlug]?.status === 'completed') completed += 1
  }
  let status: ProgressSummary['status'] = 'not-started'
  if (completed > 0 && completed === total) {
    status = 'completed'
  } else if (completed > 0 || Object.values(progress).some((l) => l.status === 'in-progress')) {
    status = 'in-progress'
  }
  return { completed, total, status }
}

function ProgressChip({ summary }: { summary: ProgressSummary }) {
  if (summary.status === 'not-started') return null
  if (summary.status === 'completed') {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
        <Check className="size-3" aria-hidden="true" />
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
      In progress · {summary.completed}/{summary.total}
    </span>
  )
}

function CourseCard({
  course,
  progress,
}: {
  course: CourseWithLessons
  progress: CourseProgress
}) {
  const summary = summarize(course, progress)
  const ctaLabel =
    summary.status === 'completed'
      ? 'Review course'
      : summary.status === 'in-progress'
        ? 'Resume course'
        : 'Start course'
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background transition-colors duration-300 hover:bg-surface"
      aria-label={`${course.title} — ${course.summary}`}
    >
      <span
        className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-foreground/80 transition-transform duration-300 ease-out group-hover:scale-x-100"
        aria-hidden="true"
      />

      <CourseCover course={course} className="aspect-[16/10] w-full" />

      <div className="flex flex-1 flex-col p-7 lg:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {course.featured ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
              <Sparkles className="size-3" aria-hidden="true" />
              Featured
            </span>
          ) : null}
          <ProgressChip summary={summary} />
        </div>

        <h3 className="text-xl font-medium text-foreground md:text-2xl">{course.title}</h3>

        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{course.summary}</p>

        <div className="mt-5">
          <CourseMeta course={course} />
        </div>

        <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          {ctaLabel}
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

const ALL_TAGS = '__all__'

const VALUE_PROPS: { title: string; description: string }[] = [
  {
    title: 'Practical, not academic.',
    description: 'Every lesson ends with code you can paste and run. No theory dumps.',
  },
  {
    title: 'Stays current.',
    description: 'Courses are versioned next to the platform. When Oxy ships, the lesson updates.',
  },
  {
    title: 'Open source friendly.',
    description: 'Examples link to public repos so you can clone, fork, and remix.',
  },
]

function lastActivityTime(progress: CourseProgress): number {
  let latest = 0
  for (const lesson of Object.values(progress)) {
    if (!lesson.completedAt) continue
    const t = Date.parse(lesson.completedAt)
    if (Number.isFinite(t) && t > latest) latest = t
  }
  return latest
}

export default function AcademyPage() {
  const [activeTag, setActiveTag] = useState<string>(ALL_TAGS)
  const locale = useCurrentLocale()
  const allCourses = useMemo(() => loadCourses(locale), [locale])

  const { data: allProgress } = useAcademyAllProgress()

  const progressFor = (slug: string): CourseProgress => allProgress[slug] ?? {}

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const course of ACADEMY_COURSES) {
      for (const tag of course.tags) set.add(tag)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [])

  const filteredCourses = useMemo(() => {
    if (activeTag === ALL_TAGS) return allCourses
    return allCourses.filter((c) => c.tags.includes(activeTag))
  }, [activeTag, allCourses])

  const spotlight = useMemo(
    () => allCourses.find((c) => c.featured && c.lessons.length > 0) ?? allCourses[0] ?? null,
    [allCourses],
  )
  const gridCourses = useMemo(
    () => filteredCourses.filter((c) => c.slug !== spotlight?.slug),
    [filteredCourses, spotlight],
  )
  const showSpotlight = activeTag === ALL_TAGS && spotlight !== null

  const totalLessons = useMemo(
    () => allCourses.reduce((sum, c) => sum + c.lessons.length, 0),
    [allCourses],
  )

  // "Continue learning" — the most-recently-touched in-progress course
  // (anywhere across the catalog). Skips completed courses; only shows when
  // the user has actually started something.
  const continueLearningCourse = useMemo(() => {
    let chosen: { course: CourseWithLessons; touched: number } | null = null
    for (const course of allCourses) {
      const progress = progressFor(course.slug)
      const summary = summarize(course, progress)
      if (summary.status !== 'in-progress') continue
      const touched = lastActivityTime(progress)
      if (!chosen || touched > chosen.touched) {
        chosen = { course, touched }
      }
    }
    return chosen?.course ?? null
    // progressFor and summarize depend on allProgress + allCourses; we list
    // those as deps so the rail re-evaluates when either changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProgress, allCourses])

  const continueLearningLessonSlug = useMemo(() => {
    if (!continueLearningCourse) return null
    const progress = progressFor(continueLearningCourse.slug)
    for (const lesson of continueLearningCourse.lessons) {
      if (progress[lesson.lessonSlug]?.status !== 'completed') return lesson.lessonSlug
    }
    return continueLearningCourse.lessons[0]?.lessonSlug ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueLearningCourse, allProgress])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Academy"
        description="Oxy Academy — hands-on courses, guides and templates that teach you how to build on the Oxy platform."
        canonicalPath="/academy"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-gradient-to-b from-surface to-background"
          />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pt-32 pb-16 text-center lg:px-8 lg:pt-40 lg:pb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <GraduationCap className="size-3.5 text-primary" aria-hidden="true" />
              {HERO_BADGE}
            </span>
            <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {HERO_TITLE}
            </h1>
            <p className="max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
              {HERO_SUBTITLE}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href="#all-courses">
                Explore courses
              </Button>
              <Button variant="outline" size="md" responsive href="/developers/docs">
                Developer docs
              </Button>
            </div>
            {(allCourses.length > 0 || totalLessons > 0) && (
              <dl className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Courses</dt>
                  <dd className="text-base font-semibold text-foreground">{allCourses.length}</dd>
                  <span>{allCourses.length === 1 ? 'course' : 'courses'}</span>
                </div>
                <span aria-hidden="true" className="hidden h-4 w-px bg-border md:inline-block" />
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Lessons</dt>
                  <dd className="text-base font-semibold text-foreground">{totalLessons}</dd>
                  <span>{totalLessons === 1 ? 'lesson' : 'lessons'}</span>
                </div>
                <span aria-hidden="true" className="hidden h-4 w-px bg-border md:inline-block" />
                <div className="flex items-center gap-2">
                  <dd className="text-base font-semibold text-foreground">Free</dd>
                  <span>for everyone</span>
                </div>
              </dl>
            )}
          </div>
        </section>

        {/* ═══ Continue learning ═══ */}
        {continueLearningCourse && continueLearningLessonSlug ? (
          <PageSection spacing="sm" id="continue-learning">
            <SectionHeading
              eyebrow="Continue learning"
              title="Pick up where you left off."
              description="The most recent course you started — jump straight back into the next lesson."
            />
            <div className="mt-8">
              <Link
                to={`/academy/${continueLearningCourse.slug}/${continueLearningLessonSlug}`}
                className="group grid overflow-hidden rounded-3xl border border-border bg-background transition-colors hover:bg-surface lg:grid-cols-5"
                aria-label={`${continueLearningCourse.title} — resume`}
              >
                <CourseCover
                  course={continueLearningCourse}
                  className="aspect-[16/10] w-full lg:col-span-2 lg:aspect-auto lg:h-full"
                />
                <div className="flex flex-col gap-4 p-8 lg:col-span-3 lg:p-10">
                  <ProgressChip
                    summary={summarize(
                      continueLearningCourse,
                      progressFor(continueLearningCourse.slug),
                    )}
                  />
                  <h3 className="text-balance text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                    {continueLearningCourse.title}
                  </h3>
                  <p className="text-pretty text-base leading-relaxed text-muted-foreground">
                    {continueLearningCourse.summary}
                  </p>
                  <CourseMeta course={continueLearningCourse} />
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    Resume next lesson
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </div>
          </PageSection>
        ) : null}

        {/* ═══ Spotlight ═══ */}
        {showSpotlight && (
          <PageSection spacing="sm" id="spotlight">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow={SPOTLIGHT_HEADING}
                title="Your first hour on Oxy."
                description={SPOTLIGHT_SUB}
              />
            </div>
            <CourseSpotlight course={spotlight} />
          </PageSection>
        )}

        {/* ═══ Tag filter row ═══ */}
        {tags.length > 1 && (
          <PageSection spacing="sm" tone="surface" id="all-courses">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading title={COURSES_HEADING} description={COURSES_SUB} />
              {activeTag !== ALL_TAGS && (
                <button
                  type="button"
                  onClick={() => setActiveTag(ALL_TAGS)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTag(ALL_TAGS)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTag === ALL_TAGS
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-input hover:text-foreground'
                }`}
              >
                All topics
              </button>
              {tags.map((tag) => {
                const isActive = activeTag === tag
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                      isActive
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground hover:border-input hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </PageSection>
        )}

        {/* ═══ Courses grid ═══ */}
        {(gridCourses.length > 0 || (!showSpotlight && filteredCourses.length > 0)) && (
          <PageSection
            spacing={tags.length > 1 ? 'md' : 'lg'}
            tone={tags.length > 1 ? 'surface' : 'default'}
            id={tags.length > 1 ? undefined : 'all-courses'}
            innerClassName={tags.length > 1 ? 'pt-0 md:pt-0 lg:pt-0' : ''}
          >
            {tags.length <= 1 && (
              <SectionHeading title={COURSES_HEADING} description={COURSES_SUB} />
            )}
            <div
              className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 ${
                tags.length > 1 ? '' : 'mt-12'
              }`}
            >
              {(showSpotlight ? gridCourses : filteredCourses).map((course) => (
                <CourseCard
                  key={course.slug}
                  course={course}
                  progress={progressFor(course.slug)}
                />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="mt-12 rounded-3xl border border-dashed border-border bg-background px-6 py-16 text-center">
                <p className="text-base text-muted-foreground">
                  No courses match that tag yet. Try{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTag(ALL_TAGS)}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    clearing the filter
                  </button>
                  .
                </p>
              </div>
            )}
          </PageSection>
        )}

        {/* ═══ Value props ═══ */}
        <PageSection spacing="lg">
          <SectionHeading eyebrow="Why Academy" title={WHY_HEADING} description={WHY_SUB} />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-background p-7 lg:p-8"
              >
                <h3 className="text-lg font-medium tracking-tight text-foreground">{prop.title}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{prop.description}</p>
              </div>
            ))}
          </div>
        </PageSection>

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
