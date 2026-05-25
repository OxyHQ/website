import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import PageSection from '../components/layout/PageSection'
import SectionHeading from '../components/layout/SectionHeading'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../contexts/LocaleContext'
import { loadCourse, type LessonEntry } from '../content/academy-loader'

/* ──────────────────────────────────────────────
 * /academy/:slug
 *
 * Course landing page — title, summary, accordion of lessons. Each lesson
 * row links to `/academy/:slug/:lesson` (rendered by LessonPage). Data
 * comes from the MDX loader, locale-aware via LocaleContext.
 * ──────────────────────────────────────────── */

function LessonAccordion({ courseSlug, lessons }: { courseSlug: string; lessons: LessonEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border">
      {lessons.map((lesson, index) => {
        const isOpen = openIndex === index
        const duration = lesson.frontmatter.duration ?? ''
        return (
          <div key={`${lesson.lessonSlug}-${index}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-base font-medium text-foreground">
                    {lesson.frontmatter.title}
                  </h3>
                </div>
                {duration && (
                  <div className="mt-1 pl-10 text-xs text-muted-foreground">{duration}</div>
                )}
              </div>
              <ChevronDown
                className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="pb-6 pl-10">
                <p className="text-sm text-muted-foreground">{lesson.frontmatter.description}</p>
                <Link
                  to={`/academy/${courseSlug}/${lesson.lessonSlug}`}
                  className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Open lesson →
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const locale = useCurrentLocale()
  const course = loadCourse(slug ?? '', locale)

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
  const metaBits = [
    course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : '',
    duration,
    course.lessons.length ? `${course.lessons.length} lessons` : '',
  ].filter(Boolean)
  const cover = course.coverImage ?? ''
  const firstLesson = course.lessons[0]

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
        <section className="relative">
          <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-4 px-6 pt-28 pb-12 lg:px-8 lg:pt-40">
            <Link
              to="/academy"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Academy
            </Link>

            <h1 className="max-w-[18em] text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {course.title}
            </h1>
            {course.summary && (
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                {course.summary}
              </p>
            )}
            {metaBits.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-muted-foreground">
                {metaBits.map((bit, i) => (
                  <span key={bit + i} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden="true">·</span>}
                    {bit}
                  </span>
                ))}
              </div>
            )}
            {course.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
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
            {firstLesson && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  responsive
                  href={`/academy/${course.slug}/${firstLesson.lessonSlug}`}
                >
                  Start first lesson
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Cover ═══ */}
        {cover && (
          <PageSection spacing="sm">
            <img
              src={cover}
              alt=""
              className="w-full rounded-3xl object-cover"
              style={{ aspectRatio: '16 / 7' }}
              loading="eager"
              decoding="async"
            />
          </PageSection>
        )}

        {/* ═══ Lessons ═══ */}
        {course.lessons.length > 0 && (
          <PageSection spacing="md" tone="surface">
            <SectionHeading
              title="Lessons."
              description="Click a lesson to see what it covers, then open it to read."
            />
            <div className="mt-12">
              <LessonAccordion courseSlug={course.slug} lessons={course.lessons} />
            </div>
          </PageSection>
        )}

        {/* ═══ Continue CTA ═══ */}
        <PageSection spacing="lg" width="narrow">
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Keep learning.
            </h2>
            <p className="max-w-xl text-pretty text-muted-foreground">
              Browse the rest of Oxy Academy for more courses, guides and templates.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href="/academy">
                Continue in Academy
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
