import { useState } from 'react'
import { Link } from 'react-router-dom'
import SliceIcon from './SliceIcon'

export interface DirectoryEntry {
  name: string
  /** The short line under the name. */
  tagline: string
  href: string
  icon?: string
  /** Drawn when there is no icon: the product's letter on its brand colour. */
  mark?: { label: string; background: string; foreground: string }
  external?: boolean
}

export interface DirectoryGroup {
  /** Optional lead-in above this group's grid. */
  intro?: string
  entries: DirectoryEntry[]
}

interface AppDirectoryProps {
  /** Pinned to the left of the groups from `lg` up. */
  heading: string
  groups: DirectoryGroup[]
  /** Height of a collapsed grid — roughly two rows. */
  collapsedHeight?: string
  /** Hides the tagline until the row is hovered, on pointer devices only.
   * On by default, as in the source layout; pass `false` to keep it open. */
  revealTaglineOnHover?: boolean
  className?: string
}

function Entry({ entry, revealTaglineOnHover }: { entry: DirectoryEntry; revealTaglineOnHover: boolean }) {
  const body = (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-4">
      {entry.icon ? (
        <img
          alt=""
          loading="lazy"
          width={72}
          height={72}
          decoding="async"
          className="relative size-18 shrink-0 overflow-hidden rounded-2xl object-cover"
          src={entry.icon}
        />
      ) : (
        <span
          className="relative flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-h5b"
          style={{ backgroundColor: entry.mark?.background, color: entry.mark?.foreground }}
          aria-hidden="true"
        >
          {entry.mark?.label}
        </span>
      )}
      <div className="flex flex-col justify-center pb-1">
        <div className="relative w-full">
          <span className="block truncate pe-4 text-b3 font-medium text-gray-a1 max-sm:pe-8 max-w-[13em] xl:max-w-[10em] 2xl:max-w-[12em]">
            {entry.name}
          </span>
          <SliceIcon
            name={entry.external ? 'arrow-right-top-alt' : 'arrow-right'}
            className="absolute end-0 top-0 size-4 lg:top-1 lg:opacity-0 lg:duration-500 lg:ease-in-out lg:group-hover:opacity-100"
          />
        </div>
        <span
          className={`line-clamp-3 break-words text-b4 text-alt-gray-e2 transition-all duration-500 max-lg:max-w-[16em] lg:max-w-[10em] 2xl:max-w-[13em] ${
            revealTaglineOnHover ? 'lg:max-h-0 lg:opacity-0 lg:group-hover:max-h-10 lg:group-hover:opacity-100' : ''
          }`}
        >
          {entry.tagline}
        </span>
      </div>
    </div>
  )

  const classes = 'group relative grid cursor-pointer gap-3.5'

  return entry.external || !entry.href.startsWith('/') ? (
    <a className={classes} href={entry.href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <Link className={classes} to={entry.href}>
      {body}
    </Link>
  )
}

function Group({
  group,
  collapsedHeight,
  revealTaglineOnHover,
}: {
  group: DirectoryGroup
  collapsedHeight: string
  revealTaglineOnHover: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  /* Only worth a control when there is something still hidden below the fold
   * of the collapsed grid — two rows at the widest column count. */
  const collapsible = group.entries.length > 6

  return (
    <div className="grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 layout-px-large gap-y-12">
      {group.intro && <p className="col-span-full sm:col-span-8 sm:col-start-1 lg:col-start-5 lg:col-span-4 text-h5b text-gray-a1">{group.intro}</p>}
      <div className="col-span-full sm:col-span-12 sm:col-start-1 lg:col-start-5 lg:col-span-8">
        <div
          className="grid gap-x-8 gap-y-10 overflow-hidden transition-[max-height] duration-700 ease-impulse sm:grid-cols-2 xl:grid-cols-3"
          style={{ maxHeight: collapsible && !expanded ? collapsedHeight : '400rem' }}
        >
          {group.entries.map((entry) => (
            <Entry key={entry.name} entry={entry} revealTaglineOnHover={revealTaglineOnHover} />
          ))}
        </div>
        {collapsible && (
          <button
            type="button"
            className="mt-6 flex items-center justify-center rounded-full border border-alt-gray-e2 bg-transparent px-8 py-2 text-gray-a1 transition-all duration-200 ease-impulse hover:cursor-pointer hover:bg-gray-a8"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * A directory of apps under one pinned heading: several groups, each with its
 * own lead-in and a grid that starts clipped to two rows and opens on demand.
 * The heading stays with its groups while they scroll, the same way the job
 * board's team headings do.
 */
export default function AppDirectory({
  heading,
  groups,
  collapsedHeight = '20rem',
  revealTaglineOnHover = true,
  className = '',
}: AppDirectoryProps) {
  return (
    <section className={`relative grid items-start text-gray-a1 ${className}`}>
      <div className="layout-px-large pointer-events-none pb-5 text-b1 lg:sticky lg:col-start-1 lg:row-start-1 lg:pb-0 lg:top-[calc(var(--header-height)+var(--nav-height)+1.5rem)]">
        <h2 className="pointer-events-auto md:max-w-[11em] lg:max-w-[8em] xl:max-w-[20em]">{heading}</h2>
      </div>
      <div className="flex flex-col gap-y-20 lg:col-start-1 lg:row-start-1 lg:gap-y-40">
        {groups.map((group, index) => (
          <Group
            key={group.intro ?? index}
            group={group}
            collapsedHeight={collapsedHeight}
            revealTaglineOnHover={revealTaglineOnHover}
          />
        ))}
      </div>
    </section>
  )
}
