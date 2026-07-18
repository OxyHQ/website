import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, PlayCircle, Sparkles } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { brandConfig } from '../lib/seo'
import { loadCourse, loadCourses, type LessonEntry } from '../content/academy-loader'
import type { CourseLevel } from '../content/academy-courses'
import ShareWithMention from '../components/social/ShareWithMention'
import { courseGradient, courseInitials, COURSE_LEVELS } from '../components/academy/courseVisual'
import { useAcademyProgress } from '../components/academy/useAcademyProgress'
import type { CourseProgress } from '../components/academy/progressStorage'

/* ──────────────────────────────────────────────
 * /academy/:slug
 *
 * Compact course page: a tight two-column hero (cover + title/meta/CTA), the
 * curriculum as a dense numbered checklist, and a sticky enrol/share card.
 * Spacing is app-dense, not marketing-loose, and the visual language (level
 * dot, progress bar, monogram cover) matches the Academy catalog.
 * ──────────────────────────────────────────── */

/* ── Cover / gradient artwork ─────────────────────────────── */

function CourseArtwork({ slug, title, cover, className }: { slug: string; title: string; cover: string; className: string }) {
  if (cover) {
    return <img src={cover} alt="" className={`${className} object-cover`} loading="eager" decoding="async" />
  }
  const g = courseGradient(slug)
  return (
    <div className={`${className} relative overflow-hidden bg-gradient-to-br ${g.from} ${g.via} ${g.to}`} aria-hidden="true">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_55%)]" />
      <span className="absolute -right-5 -bottom-8 select-none text-[9rem] font-bold leading-none tracking-tighter text-white/15">
        {courseInitials(title)}
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
      aria-label={`${lesson.frontmatter.title}${isCompleted ? ' — completed' : ''}${isResumeTarget ? ' — resume here' : ''}`}
      className={`group flex items-center gap-4 rounded-xl border p-4 transition-colors ${
        isResumeTarget ? 'border-foreground bg-surface' : 'border-border bg-background hover:bg-surface'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg font-mono text-xs font-semibold ${
          isCompleted ? 'bg-emerald-500 text-white' : 'border border-border bg-surface text-foreground'
        }`}
        aria-hidden="true"
      >
        {isCompleted ? <Check className="size-4" /> : String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <h3 className="text-[15px] font-medium text-foreground">{lesson.frontmatter.title}</h3>
          {duration ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              {duration}
            </span>
          ) : null}
          {isResumeTarget ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
              Resume
            </span>
          ) : null}
        </div>
        {lesson.frontmatter.description ? (
          <p className="mt-0.5 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground">{lesson.frontmatter.description}</p>
        ) : null}
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  )
}

/* ── More-courses card ────────────────────────────────────── */

function RelatedCourseCard({
  course,
}: {
  course: { slug: string; title: string; summary: string; coverImage?: string; level: CourseLevel }
}) {
  const lvl = COURSE_LEVELS[course.level]
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-input hover:shadow-lg"
    >
      <CourseArtwork slug={course.slug} title={course.title} cover={course.coverImage ?? ''} className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={`size-2 rounded-full ${lvl.dot}`} aria-hidden="true" />
          {lvl.label}
        </span>
        <h3 className="mt-2 text-base font-semibold text-foreground md:text-lg">{course.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">{course.summary}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          Open course
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

function pickResumeLessonSlug(lessons: LessonEntry[], progress: CourseProgress): string | null {
  if (lessons.length === 0) return null
  for (const lesson of lessons) {
    if (progress[lesson.lessonSlug]?.status !== 'completed') return lesson.lessonSlug
  }
  return null
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const locale = useCurrentLocale()
  const course = loadCourse(slug ?? '', locale)
  const { origin } = brandConfig(typeof window === 'undefined' ? undefined : window.location.hostname)
  const allCourses = useMemo(() => loadCourses(locale), [locale])
  const related = useMemo(() => allCourses.filter((c) => c.slug !== course?.slug).slice(0, 3), [allCourses, course])

  // Hook must run before the early `if (!course)` return.
  const { data: progress } = useAcademyProgress(slug ?? course?.slug ?? 'unknown')

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEO title="Course not found" description="The course you are looking for does not exist." canonicalPath={`/academy/${slug ?? ''}`} noIndex />
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
  const lvl = COURSE_LEVELS[course.level]
  const firstLesson = course.lessons[0]

  const resumeLessonSlug = pickResumeLessonSlug(course.lessons, progress)
  const completedCount = course.lessons.reduce(
    (acc, l) => (progress[l.lessonSlug]?.status === 'completed' ? acc + 1 : acc),
    0,
  )
  const completionPct = course.lessons.length > 0 ? Math.round((completedCount / course.lessons.length) * 100) : 0
  const isStarted = completedCount > 0 || resumeLessonSlug !== firstLesson?.lessonSlug
  const heroCtaLessonSlug = resumeLessonSlug ?? course.lessons[course.lessons.length - 1]?.lessonSlug ?? null
  const heroCtaLabel =
    completedCount === 0 ? 'Start first lesson' : completedCount === course.lessons.length ? 'Review course' : 'Resume course'

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
        {/* ═══ Hero ═══ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-gradient-to-b from-surface to-background"
          />
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-8 lg:pt-28 lg:pb-10">
            <Link
              to="/academy"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Academy
            </Link>

            <div className="mt-5 grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-12">
              {/* Text */}
              <div className="flex flex-col gap-4 lg:order-1">
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.16em] text-primary">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Course
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${lvl.dot}`} aria-hidden="true" />
                    {lvl.label}
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

                <h1 className="text-balance text-heading-responsive-lg text-foreground">{course.title}</h1>
                {course.summary && (
                  <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">{course.summary}</p>
                )}

                {isStarted && course.lessons.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${completionPct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {completedCount}/{course.lessons.length} · {completionPct}%
                    </span>
                  </div>
                ) : null}

                <div className="mt-1 flex flex-wrap items-center gap-2.5">
                  {heroCtaLessonSlug ? (
                    <Button variant="primary" size="md" href={`/academy/${course.slug}/${heroCtaLessonSlug}`}>
                      <PlayCircle className="size-4" aria-hidden="true" />
                      {heroCtaLabel}
                    </Button>
                  ) : null}
                  {course.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cover */}
              <div className="overflow-hidden rounded-2xl border border-border shadow-sm lg:order-2">
                <CourseArtwork slug={course.slug} title={course.title} cover={cover} className="aspect-[16/10] w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Curriculum + sticky aside ═══ */}
        {course.lessons.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-10">
              {/* Curriculum */}
              <div>
                <div className="mb-5 flex items-baseline justify-between gap-3">
                  <h2 className="text-heading-responsive-sm text-foreground">Curriculum</h2>
                  <span className="text-sm text-muted-foreground">
                    {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                </div>
                <ol className="flex flex-col gap-2.5">
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
              <aside>
                <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
                  <dl className="grid grid-cols-1 gap-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Level</dt>
                      <dd className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <span className={`size-2 rounded-full ${lvl.dot}`} aria-hidden="true" />
                        {lvl.label}
                      </dd>
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
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="font-medium text-foreground">Free</dd>
                    </div>
                  </dl>

                  {isStarted && course.lessons.length > 0 ? (
                    <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${completionPct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{completionPct}% complete</p>
                    </div>
                  ) : null}

                  {heroCtaLessonSlug ? (
                    <Button variant="primary" size="md" href={`/academy/${course.slug}/${heroCtaLessonSlug}`} className="w-full">
                      {heroCtaLabel}
                    </Button>
                  ) : null}

                  <div className="border-t border-border pt-4">
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Share this course</p>
                    <ShareWithMention
                      title={course.title}
                      url={`${origin}/academy/${course.slug}`}
                      hashtags={['oxyacademy']}
                      via="oxy"
                    />
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* ═══ More courses ═══ */}
        {related.length > 0 && (
          <section className="border-t border-border bg-surface/40">
            <div className="mx-auto max-w-6xl px-6 py-12 lg:py-14">
              <div className="mb-6 flex items-end justify-between gap-3">
                <h2 className="text-heading-responsive-sm text-foreground">More from Academy</h2>
                <Link to="/academy" className="text-sm font-medium text-primary hover:underline">
                  Browse all
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((c) => (
                  <RelatedCourseCard
                    key={c.slug}
                    course={{ slug: c.slug, title: c.title, summary: c.summary, coverImage: c.coverImage, level: c.level }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
