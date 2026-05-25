import { Suspense, createElement } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PageSection from '../components/layout/PageSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { loadLesson, loadCourse } from '../content/academy-loader'
import { mdxContentComponents } from '../content/_components'
import ShareWithMention from '../components/social/ShareWithMention'

/* ──────────────────────────────────────────────
 * /academy/:slug/:lesson
 *
 * Single lesson view inside a course. Reads the MDX module via
 * `loadLesson(courseSlug, lessonSlug, locale)` and renders it inside the
 * shared MDX provider. Prev/next nav comes from the loader (computed
 * across the course's ordered lesson list).
 * ──────────────────────────────────────────── */

export default function LessonPage() {
  const params = useParams<{ slug: string; lesson: string }>()
  const locale = useCurrentLocale()
  const courseSlug = params.slug ?? ''
  const lessonSlug = params.lesson ?? ''
  const data = loadLesson(courseSlug, lessonSlug, locale)

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
  const totalLessons = fullCourse?.lessons.length ?? 0

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
        <section className="relative">
          <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-4 px-6 pt-28 pb-12 lg:px-8 lg:pt-40">
            <Link
              to={`/academy/${course.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {course.title}
            </Link>

            <nav className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/academy" className="transition-colors hover:text-foreground">Academy</Link>
              <span aria-hidden="true">/</span>
              <Link to={`/academy/${course.slug}`} className="transition-colors hover:text-foreground">{course.title}</Link>
              <span aria-hidden="true">/</span>
              <span className="truncate text-foreground">{lesson.frontmatter.title}</span>
            </nav>

            <span className="mt-4 inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-muted-foreground">
              Lesson {position + 1}
              {totalLessons > 0 ? ` of ${totalLessons}` : ''}
              {lesson.frontmatter.duration ? ` · ${lesson.frontmatter.duration}` : ''}
            </span>
            <h1 className="max-w-[18em] text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {lesson.frontmatter.title}
            </h1>
            {lesson.frontmatter.description && (
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                {lesson.frontmatter.description}
              </p>
            )}
          </div>
        </section>

        {/* ═══ Body (MDX) ═══ */}
        <PageSection spacing="md" width="narrow">
          <article className="text-foreground">
            <MDXProvider components={mdxContentComponents}>
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
                {createElement(lesson.Component)}
              </Suspense>
            </MDXProvider>
          </article>
        </PageSection>

        {/* ═══ Share ═══ */}
        <PageSection spacing="sm" width="narrow">
          <ShareWithMention
            title={`${lesson.frontmatter.title} — ${course.title}`}
            url={`https://oxy.so/academy/${course.slug}/${lesson.lessonSlug}`}
            hashtags={['oxyacademy', 'learn']}
            via="oxy"
          />
        </PageSection>

        {/* ═══ Prev / Next ═══ */}
        {(prev || next) && (
          <PageSection spacing="md" width="narrow">
            <div className="grid gap-4 sm:grid-cols-2">
              {prev ? (
                <Link
                  to={`/academy/${prev.course}/${prev.lessonSlug}`}
                  className="group flex flex-col gap-1 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-input hover:bg-surface"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Previous lesson
                  </span>
                  <span className="text-base font-semibold text-foreground">{prev.title}</span>
                </Link>
              ) : (
                <div aria-hidden="true" />
              )}
              {next ? (
                <Link
                  to={`/academy/${next.course}/${next.lessonSlug}`}
                  className="group flex flex-col items-end gap-1 rounded-2xl border border-border bg-background p-5 text-right transition-colors hover:border-input hover:bg-surface sm:col-start-2"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Next lesson
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-base font-semibold text-foreground">{next.title}</span>
                </Link>
              ) : (
                <div aria-hidden="true" />
              )}
            </div>
          </PageSection>
        )}

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
