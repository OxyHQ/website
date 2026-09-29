import * as Skeleton from '@oxy.so/bloom/skeleton'
import PageShell from '../layout/PageShell'

/** A stable editorial frame for a cold SPA navigation while the route loads. */
export default function NewsroomRouteFallback() {
  return (
    <PageShell
      seo={{
        title: 'Newsroom',
        description: 'Announcements, product updates and engineering posts from across the Oxy ecosystem.',
        canonicalPath: '/newsroom',
      }}
      className="slice-theme bg-background text-foreground"
      mainClassName="flex-1"
    >
      <div className="container grid grid-cols-8 gap-x-2.5 pb-24 pt-20 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6">
        <div className="col-span-full mx-auto h-5 w-40"><Skeleton.Box width="100%" height="100%" borderRadius={9999} /></div>
        <div className="col-span-full mx-auto mt-8 h-12 w-full max-w-3xl"><Skeleton.Box width="100%" height="100%" borderRadius={12} /></div>
        <div className="col-span-full mx-auto mt-4 h-7 w-full max-w-2xl"><Skeleton.Box width="100%" height="100%" borderRadius={12} /></div>
        <div className="col-span-full mt-16 aspect-video md:col-start-2 md:col-span-10"><Skeleton.Box width="100%" height="100%" borderRadius={12} /></div>
      </div>
    </PageShell>
  )
}
