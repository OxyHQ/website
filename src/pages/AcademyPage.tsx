import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import PageSection from '../components/layout/PageSection'
import SectionHeading from '../components/layout/SectionHeading'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../contexts/LocaleContext'
import { loadCourses, ACADEMY_COURSES, type CourseWithLessons } from '../content/academy-loader'

/* ──────────────────────────────────────────────
 * /academy
 *
 * Public Oxy Academy landing — featured courses + topic filter. Data comes
 * from the MDX loader (build-time, locale-aware). Layout uses the canonical
 * PageSection / SectionHeading primitives. Cards are bespoke (cover image
 * + meta row) rather than the generic Card primitive — they need the
 * image-led shell.
 * ──────────────────────────────────────────── */

const HERO_BADGE = 'Oxy Academy'
const HERO_TITLE = 'Learn to build on Oxy.'
const HERO_SUBTITLE =
  'Hands-on courses, deep guides and practical templates — everything you need to understand the platform and ship real work on top of it.'
const COURSES_HEADING = 'Featured courses'
const COURSES_SUB = 'Self-paced lessons that walk you from first principles to production.'
const CATEGORIES_HEADING = 'Browse by tag'
const CTA_HEADING = 'Ready to start learning?'
const CTA_SUBTITLE = 'Open a course and start building on the Oxy platform today.'

/* ── Course card ── */

function CourseCard({ course }: { course: CourseWithLessons }) {
  const cover = course.coverImage ?? ''
  const duration = course.duration ?? ''
  const mark = course.title.charAt(0).toUpperCase() || 'O'
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group relative flex h-full flex-col rounded-3xl border border-border bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10"
      aria-label={`${course.title} — ${course.summary}`}
    >
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-3xl bg-foreground/80 transition-transform duration-300 ease-out group-hover:scale-x-100"
        aria-hidden="true"
      />

      {/* Cover / fallback brand-square */}
      <div className="relative overflow-hidden rounded-2xl">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div
            className="flex aspect-[16/10] w-full items-center justify-center text-4xl font-semibold tracking-tight text-white"
            style={{ backgroundColor: '#0f172a' }}
            aria-hidden="true"
          >
            {mark}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-6 text-2xl font-medium text-foreground">{course.title}</h3>

      {/* Summary */}
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        {course.summary}
      </p>

      {/* Meta row */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
        <span className="capitalize">{course.level}</span>
        {duration && (
          <>
            <span aria-hidden="true">·</span>
            <span>{duration}</span>
          </>
        )}
        {course.lessons.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{course.lessons.length} lessons</span>
          </>
        )}
      </div>

      {/* CTA */}
      <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        Start course
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}

/* ── Page ── */

const ALL_TAGS = '__all__'

export default function AcademyPage() {
  const [activeTag, setActiveTag] = useState<string>(ALL_TAGS)
  const locale = useCurrentLocale()
  const allCourses = useMemo(() => loadCourses(locale), [locale])

  // Build the tag set from registered courses (not from MDX) so the filter
  // row is stable even when a course has no lessons yet.
  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const course of ACADEMY_COURSES) {
      for (const tag of course.tags) set.add(tag)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [])

  const coursesToShow = useMemo(() => {
    if (activeTag === ALL_TAGS) return allCourses
    return allCourses.filter((c) => c.tags.includes(activeTag))
  }, [activeTag, allCourses])

  const featuredCourses = useMemo(() => allCourses.filter((c) => c.featured), [allCourses])
  const displayCourses = activeTag === ALL_TAGS && featuredCourses.length > 0
    ? featuredCourses
    : coursesToShow

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
        <section className="relative">
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pt-32 pb-20 text-center lg:px-8 lg:pt-40 lg:pb-28">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {HERO_BADGE}
            </p>
            <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {HERO_TITLE}
            </h1>
            <p className="max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
              {HERO_SUBTITLE}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href="#featured-courses">
                Explore courses
              </Button>
              <Button variant="outline" size="md" responsive href="/developers/docs">
                Developer docs
              </Button>
            </div>
          </div>
        </section>

        {/* ═══ Tag filter row ═══ */}
        {tags.length > 0 && (
          <PageSection spacing="sm" tone="surface">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                {CATEGORIES_HEADING}
              </h2>
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
        {displayCourses.length > 0 && (
          <PageSection spacing="lg" id="featured-courses">
            <SectionHeading title={COURSES_HEADING} description={COURSES_SUB} />
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {displayCourses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          </PageSection>
        )}

        {/* ═══ Closing CTA ═══ */}
        <PageSection spacing="lg" width="narrow">
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Oxy Academy
            </p>
            <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {CTA_HEADING}
            </h2>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">{CTA_SUBTITLE}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href="#featured-courses">
                Browse courses
              </Button>
              <Button variant="outline" size="md" responsive href="/developers/docs">
                Developer docs
              </Button>
            </div>
          </div>
        </PageSection>

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
