import { Suspense, createElement } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { bloomDemos, getBloomDemo } from '../content/bloom-demos/registry'

/**
 * One Bloom demo, alone on a chrome-free canvas, at
 * `/developers/docs/bloom/_demo/:name`.
 *
 * This exists for `scripts/bloom-demos.browser.test.ts`, which renders every
 * demo here and fails the build if one throws. Two things about it are the
 * whole point and must not be "tidied":
 *
 *  - **No error boundary.** The component index wraps every preview in one so
 *    a single broken demo cannot take the page down. That containment is what
 *    the gate has to see past — a boundary here would swallow exactly the
 *    throw the gate is looking for.
 *  - **One demo per page.** The gate could have read the index instead, since
 *    it already renders all sixteen. But the index is free to stop rendering
 *    offscreen previews the day it needs to, and a gate that silently narrows
 *    to whatever is in the viewport is the failure this check exists to
 *    prevent. Isolation also names the culprit without parsing a stack.
 *
 * Without a `:name` it lists what the registry holds. That list is how the gate
 * learns which demos exist: reading the directory instead would re-implement
 * the registry's own glob, and the two could drift apart silently — the gate
 * would go on passing while covering fewer demos than it claims.
 *
 * `?theme=light|dark` renders the demo under either mode; the ONE app-wide
 * provider applies it (see `App.tsx`), so this page never mounts a second
 * provider or touches `<html>`. `scripts/theme-prepaint.browser.test.ts` is
 * what exercises that override. Not linked from anywhere, and excluded from
 * the sitemap.
 */
export default function BloomDemoIsolationPage() {
  const { name } = useParams<{ name: string }>()
  const [searchParams] = useSearchParams()
  const mode: 'light' | 'dark' = searchParams.get('theme') === 'dark' ? 'dark' : 'light'
  const demo = name ? getBloomDemo(name) : undefined

  if (!name) {
    return (
      <ul data-demo-index>
        {bloomDemos.map((registered) => (
          <li key={registered.name} data-demo-name={registered.name}>
            {registered.name}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      data-demo-root
      data-demo-name={name}
      data-demo-mode={mode}
      className="flex min-h-screen items-center justify-center bg-card"
    >
      <div
        data-demo-frame
        className="flex h-[300px] w-[400px] items-center justify-center overflow-hidden p-6"
      >
        {demo ? (
          <Suspense fallback={null}>{createElement(demo.Component)}</Suspense>
        ) : (
          <div data-demo-missing className="text-sm text-muted-foreground">
            Unknown demo: <code className="font-mono">{name}</code>
          </div>
        )}
      </div>
    </div>
  )
}
