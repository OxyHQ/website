const NEWSROOM_POST_PATH = /^\/(?:([a-z]{2})\/)?newsroom\/([a-z0-9-]+)\/?$/i

export interface NewsroomPathMatch {
  locale?: string
  slug: string
}

export function matchNewsroomPostPath(pathname: string): NewsroomPathMatch | null {
  const match = NEWSROOM_POST_PATH.exec(pathname)
  if (!match?.[2]) return null
  return { locale: match[1]?.toLowerCase(), slug: match[2] }
}

/** Marker emitted only for a build-time-known Newsroom post. */
export function hasPrerenderedNewsroomPost(html: string): boolean {
  return (
    html.includes('id="newsroom-post-bootstrap"') ||
    html.includes('data-prerender-kind="newsroom-post"')
  )
}
