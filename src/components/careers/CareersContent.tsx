import { useMemo } from 'react'
import { useJobs } from '../../api/hooks'
import { careersHero } from '../../data/careers'
import JobBoard, { type JobListing } from '../slices/JobBoard'
import MediaBlock from '../slices/MediaBlock'
import PageHero from '../slices/PageHero'

export default function CareersContent() {
  const { data: jobs, isPending } = useJobs()

  const listings = useMemo<JobListing[]>(
    () =>
      (jobs ?? [])
        .filter((job) => job.slug)
        .map((job) => ({
          title: job.title,
          team: job.department || 'Other',
          location: job.location,
          href: `/company/careers/${job.slug}`,
        })),
    [jobs],
  )

  return (
    <>
      <PageHero title={careersHero.title} tagline="Explore open roles." variant="listing" />

      <MediaBlock
        variant="bleed"
        src="/images/hero/hero-2.jpg"
        alt="The Oxy team at work"
        ratioClassName="aspect-square sm:aspect-video"
      />

      <JobBoard jobs={listings} isPending={isPending} emptyMessage="No open roles right now. Check back soon." />
    </>
  )
}
