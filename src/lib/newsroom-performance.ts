const measuredSlugs = new Set<string>()

export interface NewsroomReadyMetric {
  name: 'newsroom_article_ready'
  slug: string
  duration: number
  navigationType?: string
}

/**
 * Emits a standard User Timing measure plus a DOM event that the site's RUM
 * collector can consume without coupling the article to one analytics vendor.
 */
export function markNewsroomArticleReady(slug: string): NewsroomReadyMetric | null {
  if (typeof window === 'undefined' || measuredSlugs.has(slug)) return null
  measuredSlugs.add(slug)

  const duration = performance.now()
  performance.mark('newsroom-article-ready', { detail: { slug } })
  performance.measure('newsroom_article_ready', {
    start: 0,
    end: duration,
    detail: { slug },
  })
  const navigationType = performance.getEntriesByType('navigation')[0]
    ? (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type
    : undefined
  const metric: NewsroomReadyMetric = {
    name: 'newsroom_article_ready',
    slug,
    duration,
    navigationType,
  }
  window.dispatchEvent(new CustomEvent('oxy:performance', { detail: metric }))
  return metric
}
