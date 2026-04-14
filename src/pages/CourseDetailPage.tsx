import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import {
  useCourse,
  resolveCourseCategoryLabel,
  type CourseRecord,
  type CourseLesson,
} from '../api/hooks'

/* ── Canonical-layout helpers ── */

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function DashedVLines({ height = 'h-5' }: { height?: string }) {
  return (
    <div className={`grid w-full grid-cols-12 overflow-hidden ${height}`}>
      <div className="col-[2/-2] flex justify-between">
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function coverImageUrl(field: CourseRecord['coverImage']): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field.url || field.thumbnails?.lg || field.thumbnails?.md || ''
}

function LessonAccordion({ lessons }: { lessons: CourseLesson[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border">
      {lessons.map((lesson, index) => {
        const isOpen = openIndex === index
        const duration = formatDuration(lesson.durationMinutes)
        return (
          <div key={`${lesson.slug}-${index}`}>
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
                    {lesson.title}
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
                {lesson.videoUrl && (
                  <div className="mb-4">
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    >
                      Watch video
                    </a>
                  </div>
                )}
                {lesson.content && (
                  <article className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-[1.8] prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
                  </article>
                )}
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
  const { data: course, isLoading } = useCourse(slug ?? '')

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading…</div>
        </main>
        <Footer />
      </div>
    )
  }

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

  const cover = coverImageUrl(course.coverImage)
  const categoryLabel = resolveCourseCategoryLabel(course)
  const duration = formatDuration(course.durationMinutes)
  const metaBits = [
    course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : '',
    duration,
    course.lessons.length ? `${course.lessons.length} lessons` : '',
  ].filter(Boolean)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
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
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <DashedHLine />
            <DashedVLines />

            <div className="grid grid-cols-12 pt-28 pb-16 max-xl:pt-24 max-lg:pt-20">
              <div className="col-[2/-2]">
                <Link
                  to="/academy"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to Academy
                </Link>

                <div className="mt-8 flex flex-col items-start gap-4">
                  {categoryLabel && (
                    <span className="inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-muted-foreground">
                      {categoryLabel}
                    </span>
                  )}
                  <h1 className="max-w-[18em] text-balance text-heading-responsive-lg">
                    {course.title}
                  </h1>
                  {course.summary && (
                    <p className="max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl">
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
                </div>
              </div>
            </div>

            {cover && (
              <div className="grid grid-cols-12 pb-12">
                <div className="col-[2/-2]">
                  <img
                    src={cover}
                    alt=""
                    className="w-full rounded-2xl object-cover"
                    style={{ aspectRatio: '16 / 7' }}
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            )}

            <DashedVLines />
          </div>
        </section>

        {/* ═══ Description ═══ */}
        {course.description && (
          <section className="container">
            <div className="border-border border-x">
              <DashedHLine />
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-16 max-lg:py-12">
                  <article className="prose prose-neutral dark:prose-invert mx-auto max-w-[720px] prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-[1.8] prose-p:text-secondary-foreground prose-li:text-secondary-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{course.description}</ReactMarkdown>
                  </article>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Lessons ═══ */}
        {course.lessons.length > 0 && (
          <section className="container">
            <div className="border-border border-x">
              <DashedHLine />
              <header className="grid grid-cols-12 pt-16 pb-6 max-lg:pt-12 justify-items-start">
                <div className="col-[2/-2] max-w-[32em] text-pretty text-heading-responsive-sm text-start">
                  <h2 className="text-pretty inline">Lessons.</h2>{' '}
                  <p className="inline text-pretty font-medium text-muted-foreground">
                    Click a lesson to expand the notes and playback links.
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-12 pb-16">
                <div className="col-[2/-2]">
                  <LessonAccordion lessons={course.lessons} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Continue CTA ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <h2 className="text-balance text-heading-responsive-md">
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
              </div>
            </div>
          </div>
        </section>

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
