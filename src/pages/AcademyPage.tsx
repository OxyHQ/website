import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Film, Wrench, LayoutTemplate, LinkIcon } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import {
  useCourses,
  useResources,
  useCategories,
  usePage,
  resolveCourseCategoryLabel,
  type CourseRecord,
  type ResourceRecord,
  type ResourceType,
  type PageSection,
} from '../api/hooks'

/* ── Canonical-layout helpers (mirror CompanyPage / TechnologiesPage) ── */

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

/* ── Copy fallbacks when /pages/academy hasn't been populated ── */

const DEFAULT_HERO_BADGE = 'Oxy Academy'
const DEFAULT_HERO_TITLE = 'Learn to build on Oxy.'
const DEFAULT_HERO_SUBTITLE = 'Hands-on courses, deep guides and practical templates — everything you need to understand the platform and ship real work on top of it.'
const DEFAULT_COURSES_HEADING = 'Featured courses'
const DEFAULT_COURSES_SUB = 'Self-paced lessons that walk you from first principles to production.'
const DEFAULT_RESOURCES_HEADING = 'All resources'
const DEFAULT_RESOURCES_SUB = 'Guides, papers, videos and ready-to-use templates curated by the Oxy team.'
const DEFAULT_CATEGORIES_HEADING = 'Browse by topic'
const DEFAULT_CTA_HEADING = 'Ready to start learning?'
const DEFAULT_CTA_SUBTITLE = 'Open a course and start building on the Oxy platform today.'

function sectionHeading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.heading || fallback
}

function sectionSubheading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.subheading || fallback
}

function sectionContent(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.content || fallback
}

/* ── Shared helpers ── */

function coverImageUrl(field: CourseRecord['coverImage'] | ResourceRecord['coverImage']): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field.url || field.thumbnails?.lg || field.thumbnails?.md || ''
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function capitalize(input: string): string {
  if (!input) return input
  return input.charAt(0).toUpperCase() + input.slice(1)
}

/* ── Course card (matches ProductCard grid styling) ── */

function CourseCard({ course }: { course: CourseRecord }) {
  const cover = coverImageUrl(course.coverImage)
  const categoryLabel = resolveCourseCategoryLabel(course)
  const duration = formatDuration(course.durationMinutes)
  const mark = course.title.charAt(0).toUpperCase() || 'O'
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group relative flex h-full flex-col bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10"
      aria-label={`${course.title} — ${course.summary}`}
    >
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-foreground/80 transition-transform duration-300 ease-out group-hover:scale-x-100"
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

      {/* Category eyebrow */}
      {categoryLabel && (
        <span className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {categoryLabel}
        </span>
      )}

      {/* Title */}
      <h3 className={`${categoryLabel ? 'mt-2' : 'mt-6'} text-2xl font-medium text-foreground`}>
        {course.title}
      </h3>

      {/* Summary */}
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        {course.summary}
      </p>

      {/* Meta row */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
        <span className="capitalize">{course.level}</span>
        {duration && <><span aria-hidden="true">·</span><span>{duration}</span></>}
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

/* ── Resource card ── */

function ResourceIcon({ type, className = '' }: { type: ResourceType; className?: string }) {
  switch (type) {
    case 'guide':
      return <BookOpen className={className} aria-hidden="true" />
    case 'paper':
      return <FileText className={className} aria-hidden="true" />
    case 'video':
      return <Film className={className} aria-hidden="true" />
    case 'tool':
      return <Wrench className={className} aria-hidden="true" />
    case 'template':
      return <LayoutTemplate className={className} aria-hidden="true" />
    case 'link':
      return <LinkIcon className={className} aria-hidden="true" />
  }
}

function ResourceCardInner({ resource }: { resource: ResourceRecord }) {
  return (
    <>
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-foreground/80 transition-transform duration-300 ease-out group-hover:scale-x-100"
        aria-hidden="true"
      />
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface text-foreground">
          <ResourceIcon type={resource.type} className="size-4.5" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {capitalize(resource.type)}
        </span>
      </div>

      <h3 className="mt-6 text-xl font-medium text-foreground">
        {resource.title}
      </h3>

      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        {resource.summary}
      </p>

      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        {resource.external ? 'Open resource' : 'Read now'}
        {resource.external
          ? <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          : <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        }
      </span>
    </>
  )
}

function ResourceCard({ resource }: { resource: ResourceRecord }) {
  const classes = 'group relative flex h-full flex-col bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10'
  if (resource.external || !resource.href.startsWith('/')) {
    return (
      <a
        href={resource.href}
        target={resource.external ? '_blank' : undefined}
        rel={resource.external ? 'noopener noreferrer' : undefined}
        className={classes}
        aria-label={`${resource.title} — ${resource.summary}`}
      >
        <ResourceCardInner resource={resource} />
      </a>
    )
  }
  return (
    <Link
      to={resource.href}
      className={classes}
      aria-label={`${resource.title} — ${resource.summary}`}
    >
      <ResourceCardInner resource={resource} />
    </Link>
  )
}

/* ── Page ── */

const ALL_CATEGORIES = '__all__'

export default function AcademyPage() {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES)

  const { data: pageData } = usePage('academy')
  const { data: featuredCoursesData } = useCourses({ featured: true, limit: 6 })
  const coursesOptions = useMemo(
    () => (activeCategory === ALL_CATEGORIES ? { limit: 6 } : { category: activeCategory, limit: 12 }),
    [activeCategory],
  )
  const { data: coursesData } = useCourses(coursesOptions)
  const resourcesOptions = useMemo(
    () => (activeCategory === ALL_CATEGORIES ? { limit: 12 } : { category: activeCategory, limit: 12 }),
    [activeCategory],
  )
  const { data: resourcesData } = useResources(resourcesOptions)
  const { data: categoriesData } = useCategories('generic')

  const featuredCourses = featuredCoursesData?.courses ?? []
  const allCourses = coursesData?.courses ?? []
  const allResources = resourcesData?.resources ?? []
  const categories = categoriesData ?? []

  const coursesToShow = activeCategory === ALL_CATEGORIES && featuredCourses.length > 0
    ? featuredCourses
    : allCourses

  const sections = pageData?.sections ?? []
  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)
  const coursesHeading = sectionHeading(sections, 'courses', DEFAULT_COURSES_HEADING)
  const coursesSub = sectionSubheading(sections, 'courses', DEFAULT_COURSES_SUB)
  const resourcesHeading = sectionHeading(sections, 'resources', DEFAULT_RESOURCES_HEADING)
  const resourcesSub = sectionSubheading(sections, 'resources', DEFAULT_RESOURCES_SUB)
  const categoriesHeading = sectionHeading(sections, 'categories', DEFAULT_CATEGORIES_HEADING)
  const ctaHeading = sectionHeading(sections, 'cta', DEFAULT_CTA_HEADING)
  const ctaSubtitle = sectionSubheading(sections, 'cta', DEFAULT_CTA_SUBTITLE)

  const hasCourses = coursesToShow.length > 0
  const hasResources = allResources.length > 0
  const hasCategories = categories.length > 0

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Academy"
        description="Oxy Academy — hands-on courses, guides and templates that teach you how to build on the Oxy platform."
        canonicalPath="/academy"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                <div className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground">
                  {heroBadge}
                </div>
                <h1 className="max-w-[18em] text-balance text-heading-responsive-lg">
                  {heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-balance text-lg text-muted-foreground lg:text-xl">
                  {heroSubtitle}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="#featured-courses">
                    Explore courses
                  </Button>
                  <Button variant="outline" size="md" responsive href="#all-resources">
                    Browse resources
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ Browse by category chip row ═══ */}
        {hasCategories && (
          <section className="container">
            <div className="border-border border-x">
              <DashedHLine />
              <DashedVLines />
              <header className="grid grid-cols-12 pt-14 pb-6 max-lg:pt-12 justify-items-start">
                <div className="col-[2/-2] flex flex-wrap items-end justify-between gap-4">
                  <h2 className="text-heading-responsive-sm">{categoriesHeading}</h2>
                  {activeCategory !== ALL_CATEGORIES && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory(ALL_CATEGORIES)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </header>
              <div className="grid grid-cols-12 pb-12">
                <div className="col-[2/-2] flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(ALL_CATEGORIES)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeCategory === ALL_CATEGORIES
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground hover:border-input hover:text-foreground'
                    }`}
                  >
                    All topics
                  </button>
                  {categories.map((category) => {
                    const id = category._id ?? ''
                    if (!id) return null
                    const isActive = activeCategory === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveCategory(id)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-muted-foreground hover:border-input hover:text-foreground'
                        }`}
                      >
                        {category.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <DashedVLines />
            </div>
          </section>
        )}

        {/* ═══ Featured courses grid ═══ */}
        {hasCourses && (
          <section className="container" id="featured-courses">
            <div className="border-border border-x">
              <DashedHLine />
              <DashedVLines />

              <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
                <div className="col-[2/-2] max-w-[32em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                  <h2 className="text-pretty inline">{coursesHeading}.</h2>{' '}
                  <p className="inline text-pretty font-medium text-muted-foreground">
                    {coursesSub}
                  </p>
                </div>
              </header>

              <DashedVLines />

              <div className="relative grid grid-cols-12">
                <div
                  className="pointer-events-none absolute inset-0 text-border/30"
                  style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
                  aria-hidden="true"
                />
                <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                  {coursesToShow.map((course) => (
                    <CourseCard key={course._id ?? course.slug} course={course} />
                  ))}
                </div>
              </div>

              <DashedVLines height="h-21 md:h-40" />
            </div>
          </section>
        )}

        {/* ═══ All resources grid ═══ */}
        {hasResources && (
          <section className="container" id="all-resources">
            <div className="border-border border-x">
              <DashedHLine />
              <DashedVLines />

              <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
                <div className="col-[2/-2] max-w-[32em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                  <h2 className="text-pretty inline">{resourcesHeading}.</h2>{' '}
                  <p className="inline text-pretty font-medium text-muted-foreground">
                    {resourcesSub}
                  </p>
                </div>
              </header>

              <DashedVLines />

              <div className="relative grid grid-cols-12">
                <div
                  className="pointer-events-none absolute inset-0 text-border/30"
                  style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
                  aria-hidden="true"
                />
                <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                  {allResources.map((resource) => (
                    <ResourceCard key={resource._id ?? resource.slug} resource={resource} />
                  ))}
                </div>
              </div>

              <DashedVLines height="h-21 md:h-40" />
            </div>
          </section>
        )}

        {/* ═══ Closing CTA ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <span className="inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-muted-foreground">
                    Oxy Academy
                  </span>
                  <h2 className="text-balance text-heading-responsive-md">
                    {ctaHeading}
                  </h2>
                  <p className="max-w-xl text-pretty text-muted-foreground">
                    {ctaSubtitle}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="#featured-courses">
                      Browse courses
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

        {/* ═══ Keep up to date ═══ */}
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
