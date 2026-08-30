import { describe, expect, test } from 'bun:test'
import { hasPrerenderedNewsroomPost, matchNewsroomPostPath } from './newsroom-status'

describe('Newsroom edge status helpers', () => {
  test('matches default and localized article paths only', () => {
    expect(matchNewsroomPostPath('/newsroom/a-post')).toEqual({ slug: 'a-post' })
    expect(matchNewsroomPostPath('/es/newsroom/a-post/')).toEqual({ locale: 'es', slug: 'a-post' })
    expect(matchNewsroomPostPath('/newsroom')).toBeNull()
    expect(matchNewsroomPostPath('/newsroom/a-post/comments')).toBeNull()
  })

  test('recognizes either build-time article marker', () => {
    expect(hasPrerenderedNewsroomPost('<template id="newsroom-post-bootstrap"></template>')).toBe(true)
    expect(hasPrerenderedNewsroomPost('<meta data-prerender-kind="newsroom-post">')).toBe(true)
    expect(hasPrerenderedNewsroomPost('<div id="root"></div>')).toBe(false)
  })
})
