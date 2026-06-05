import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Code2,
  GraduationCap,
  PlayCircle,
  Radio,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { loadCourses, type CourseWithLessons } from '../content/academy-loader'
import { courseGradient, courseInitials, COURSE_LEVELS } from '../components/academy/courseVisual'
import { useAcademyAllProgress } from '../components/academy/useAcademyProgress'
import type { CourseProgress } from '../components/academy/progressStorage'

/* ──────────────────────────────────────────────
 * /academy — Oxy Academy
 *
 * A course app, not a brochure: a searchable hero, a "continue learning"
 * resume card, ecosystem learning tracks, and a filterable catalog of polished
 * course cards that surface real progress. Compact, dense spacing throughout so
 * it reads like an app surface rather than a marketing page.
 * ──────────────────────────────────────────── */

/* ── Learning tracks (the Oxy ecosystem) ──────────────────── */

interface TrackDef {
  key: string
  label: string
  blurb: string
  tags: string[]
  Icon: LucideIcon
  accent: string
}

const TRACKS: TrackDef[] = [
  {
    key: 'foundations',
    label: 'Foundations',
    blurb: 'Set up your account and ship your first project on Oxy.',
    tags: ['intro', 'onboarding'],
    Icon: Rocket,
    accent: 'from-indigo-500 to-violet-600',
  },
  {
    key: 'identity',
    label: 'Identity & security',
    blurb: 'Own your Oxy ID — keys, sessions and account recovery.',
    tags: ['identity', 'security'],
    Icon: ShieldCheck,
    accent: 'from-sky-500 to-cyan-600',
  },
  {
    key: 'social',
    label: 'Social & publishing',
    blurb: 'Grow your audience with Mention and the fediverse.',
    tags: ['mention', 'publishing', 'fediverse'],
    Icon: Radio,
    accent: 'from-rose-500 to-orange-500',
  },
  {
    key: 'developer',
    label: 'Build on Oxy',
    blurb: 'APIs, SDKs and the developer platform — coming soon.',
    tags: ['developer', 'api', 'sdk'],
    Icon: Code2,
    accent: 'from-emerald-500 to-teal-600',
  },
]

const courseInTrack = (course: CourseWithLessons, track: TrackDef) =>
  course.tags.some((t) => track.tags.includes(t))

const ALL = '__all__'

/* ── Progress helpers ─────────────────────────────────────── */

interface ProgressSummary {
  completed: number
  total: number
  pct: number
  status: 'not-started' | 'in-progress' | 'completed'
}

function summarize(course: CourseWithLessons, progress: CourseProgress): ProgressSummary {
  const total = course.lessons.length
  let completed = 0
  for (const lesson of course.lessons) {
    if (progress[lesson.lessonSlug]?.status === 'completed') completed += 1
  }
  let status: ProgressSummary['status'] = 'not-started'
  if (total > 0 && completed === total) status = 'completed'
  else if (completed > 0 || Object.values(progress).some((l) => l.status === 'in-progress'))
    status = 'in-progress'
  return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0, status }
}

function lastActivityTime(progress: CourseProgress): number {
  let latest = 0
  for (const lesson of Object.values(progress)) {
    if (!lesson.completedAt) continue
    const t = Date.parse(lesson.completedAt)
    if (Number.isFinite(t) && t > latest) latest = t
  }
  return latest
}

/* ── Course cover (image or gradient monogram) ────────────── */

function CourseCover({ course, className }: { course: CourseWithLessons; className: string }) {
  if (course.coverImage) {
    return <img src={course.coverImage} alt="" loading="lazy" decoding="async" className={`${className} object-cover`} />
  }
  const g = courseGradient(course.slug)
  return (
    <div className={`${className} relative overflow-hidden bg-gradient-to-br ${g.from} ${g.via} ${g.to}`} aria-hidden="true">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.22),transparent_55%)]" />
      <span className="absolute -right-3 -bottom-5 select-none text-[6rem] font-bold leading-none tracking-tighter text-white/15">
        {courseInitials(course.title)}
      </span>
    </div>
  )
}

/* ── Meta row ─────────────────────────────────────────────── */

function CourseMeta({ course }: { course: CourseWithLessons }) {
  const lvl = COURSE_LEVELS[course.level]
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className={`size-2 rounded-full ${lvl.dot}`} aria-hidden="true" />
        {lvl.label}
      </span>
      {course.duration ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          {course.duration}
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

/* ── Course card (catalog) ────────────────────────────────── */

function CourseCard({ course, progress }: { course: CourseWithLessons; progress: CourseProgress }) {
  const s = summarize(course, progress)
  const cta =
    s.status === 'completed' ? 'Review' : s.status === 'in-progress' ? 'Resume' : 'Start course'
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-input hover:shadow-lg"
      aria-label={`${course.title} — ${course.summary}`}
    >
      <div className="relative">
        <CourseCover course={course} className="aspect-[16/9] w-full" />
        {course.featured ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-2.5 text-primary" aria-hidden="true" />
            Featured
          </span>
        ) : null}
        {s.status === 'completed' ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
            <Check className="size-2.5" aria-hidden="true" />
            Done
          </span>
        ) : null}
        {s.status === 'in-progress' ? (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
            <div className="h-full bg-primary" style={{ width: `${s.pct}%` }} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug text-foreground md:text-lg">{course.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">{course.summary}</p>
        <div className="mt-3.5">
          <CourseMeta course={course} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
          <span className="text-xs font-medium text-muted-foreground">
            {s.status === 'in-progress' ? `${s.completed}/${s.total} · ${s.pct}%` : 'Free · self-paced'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {cta}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Track card (browse by path) ──────────────────────────── */

function TrackCard({
  track,
  count,
  active,
  onSelect,
}: {
  track: TrackDef
  count: number
  active: boolean
  onSelect: () => void
}) {
  const empty = count === 0
  return (
    <button
      type="button"
      onClick={empty ? undefined : onSelect}
      disabled={empty}
      aria-pressed={active}
      className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300 ${
        empty
          ? 'cursor-default border-dashed border-border bg-background opacity-60'
          : active
            ? 'border-foreground bg-surface shadow-md'
            : 'border-border bg-background hover:-translate-y-1 hover:border-input hover:shadow-lg'
      }`}
    >
      <span className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${track.accent} text-white shadow-sm`}>
        <track.Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{track.label}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{track.blurb}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {empty ? 'Coming soon' : `${count} ${count === 1 ? 'course' : 'courses'}`}
        {empty ? null : (
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
        )}
      </span>
    </button>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

const VALUE_PROPS: { Icon: LucideIcon; title: string; description: string }[] = [
  { Icon: Zap, title: 'Practical, not academic', description: 'Every lesson ends with code you can paste and run. No theory dumps.' },
  { Icon: Sparkles, title: 'Always current', description: 'Courses are versioned next to the platform. When Oxy ships, the lesson updates.' },
  { Icon: Code2, title: 'Open-source friendly', description: 'Examples link to public repos so you can clone, fork, and remix.' },
]

export default function AcademyPage() {
  const locale = useCurrentLocale()
  const allCourses = useMemo(() => loadCourses(locale), [locale])
  const { data: allProgress } = useAcademyAllProgress()

  const [query, setQuery] = useState('')
  const [activeTrack, setActiveTrack] = useState<string>(ALL)

  const progressFor = (slug: string): CourseProgress => allProgress[slug] ?? {}

  const totalLessons = useMemo(() => allCourses.reduce((n, c) => n + c.lessons.length, 0), [allCourses])

  const trackCounts = useMemo(
    () => new Map(TRACKS.map((t) => [t.key, allCourses.filter((c) => courseInTrack(c, t)).length])),
    [allCourses],
  )

  const visibleCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    const track = TRACKS.find((t) => t.key === activeTrack)
    return allCourses.filter((c) => {
      if (track && !courseInTrack(c, track)) return false
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [allCourses, query, activeTrack])

  // Continue learning — most-recently-touched in-progress course.
  const resume = useMemo(() => {
    let best: { course: CourseWithLessons; touched: number } | null = null
    for (const course of allCourses) {
      const summary = summarize(course, progressFor(course.slug))
      if (summary.status !== 'in-progress') continue
      const touched = lastActivityTime(progressFor(course.slug))
      if (!best || touched > best.touched) best = { course, touched }
    }
    if (!best) return null
    const progress = progressFor(best.course.slug)
    const next =
      best.course.lessons.find((l) => progress[l.lessonSlug]?.status !== 'completed') ?? best.course.lessons[0]
    return { course: best.course, lessonSlug: next?.lessonSlug ?? null, summary: summarize(best.course, progress) }
    // progressFor/summarize derive from allProgress + allCourses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProgress, allCourses])

  const searching = query.trim().length > 0 || activeTrack !== ALL

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Academy"
        description="Oxy Academy — hands-on courses, guides and templates that teach you how to build across the Oxy ecosystem."
        canonicalPath="/academy"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] bg-gradient-to-b from-surface via-surface/50 to-background"
          />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-24 pb-10 text-center lg:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm">
              <GraduationCap className="size-3.5 text-primary" aria-hidden="true" />
              Oxy Academy
            </span>
            <h1 className="text-balance text-heading-responsive-lg text-foreground">Learn the whole Oxy ecosystem.</h1>
            <p className="max-w-xl text-balance leading-relaxed text-muted-foreground">
              Hands-on, self-paced courses that take you from your first account to shipping real work — across identity,
              social, and the developer platform.
            </p>

            {/* Search */}
            <div className="relative mt-1 w-full max-w-lg">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to learn?"
                aria-label="Search courses"
                className="h-12 w-full rounded-full border border-border bg-background pl-12 pr-5 text-[15px] text-foreground shadow-md outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
            </div>

            <dl className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <dd className="font-semibold text-foreground">{allCourses.length}</dd>
                <span>{allCourses.length === 1 ? 'course' : 'courses'}</span>
              </div>
              <span aria-hidden="true" className="h-3.5 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <dd className="font-semibold text-foreground">{totalLessons}</dd>
                <span>{totalLessons === 1 ? 'lesson' : 'lessons'}</span>
              </div>
              <span aria-hidden="true" className="h-3.5 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <dd className="font-semibold text-foreground">Free</dd>
                <span>for everyone</span>
              </div>
            </dl>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          {/* ═══ Continue learning ═══ */}
          {resume && resume.lessonSlug ? (
            <Link
              to={`/academy/${resume.course.slug}/${resume.lessonSlug}`}
              className="group grid overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:shadow-md sm:grid-cols-[minmax(0,180px)_1fr]"
              aria-label={`Resume ${resume.course.title}`}
            >
              <CourseCover course={resume.course} className="aspect-[16/9] w-full sm:aspect-auto sm:h-full" />
              <div className="flex flex-col gap-2.5 p-5 lg:p-6">
                <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <PlayCircle className="size-4" aria-hidden="true" />
                  Continue learning
                </span>
                <h2 className="text-balance text-lg font-semibold text-foreground md:text-xl">{resume.course.title}</h2>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${resume.summary.pct}%` }} />
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {resume.summary.completed}/{resume.summary.total} · {resume.summary.pct}%
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  Resume next lesson
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ) : null}

          {/* ═══ Learning tracks ═══ */}
          <section className="py-10 lg:py-14">
            <h2 className="text-balance text-heading-responsive-sm text-foreground">Pick a path through the ecosystem.</h2>
            <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Every Oxy product has its own track. Start with the foundations or jump straight to what you&rsquo;re building.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {TRACKS.map((track) => (
                <TrackCard
                  key={track.key}
                  track={track}
                  count={trackCounts.get(track.key) ?? 0}
                  active={activeTrack === track.key}
                  onSelect={() => {
                    setActiveTrack((cur) => (cur === track.key ? ALL : track.key))
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ═══ Catalog ═══ */}
        <section id="catalog" className="scroll-mt-20 border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-heading-responsive-sm text-foreground">
                  {activeTrack === ALL ? 'All courses' : (TRACKS.find((t) => t.key === activeTrack)?.label ?? 'Courses')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'}
                  {query.trim() ? ` for “${query.trim()}”` : ''}
                </p>
              </div>
              {searching ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setActiveTrack(ALL)
                  }}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {/* Track chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              <FilterChip active={activeTrack === ALL} onClick={() => setActiveTrack(ALL)}>
                All topics
              </FilterChip>
              {TRACKS.filter((t) => (trackCounts.get(t.key) ?? 0) > 0).map((t) => (
                <FilterChip key={t.key} active={activeTrack === t.key} onClick={() => setActiveTrack(t.key)}>
                  {t.label}
                </FilterChip>
              ))}
            </div>

            {visibleCourses.length > 0 ? (
              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => (
                  <CourseCard key={course.slug} course={course} progress={progressFor(course.slug)} />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed border-border bg-background px-6 py-14 text-center">
                <p className="text-sm text-muted-foreground">
                  No courses match that yet. Try{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setActiveTrack(ALL)
                    }}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    clearing the filters
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Why ═══ */}
        <section className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <h2 className="text-balance text-heading-responsive-sm text-foreground">Built for builders.</h2>
          <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            Every course is written by the team behind the product. Short lessons, real examples, zero filler.
          </p>
          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-surface text-primary ring-1 ring-border">
                  <prop.Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold tracking-tight text-foreground">{prop.title}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{prop.description}</p>
              </div>
            ))}
          </div>
        </section>

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}

/* ── Filter chip ──────────────────────────────────────────── */

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-muted-foreground hover:border-input hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
