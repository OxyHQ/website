import { useId, useMemo, useState, type AriaAttributes, type MouseEvent, type ReactNode } from 'react'
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
} from '@oxy.so/bloom/select'
import { Link } from '../../lib/navigation'
import SliceIcon from './SliceIcon'

export interface JobListing {
  title: string
  team: string
  location: string
  href: string
}

interface JobBoardProps {
  jobs: JobListing[]
  /** Shown while the listings are still loading. */
  isPending?: boolean
  emptyMessage?: string
}

const ALL = 'all'

/**
 * What `SelectTrigger asChild` hands its child: Bloom's trigger contract, in
 * React Native's spelling (`onPress`, `accessibilityLabel`, `nativeID`).
 */
interface CellTriggerProps {
  children: ReactNode
  valueId: string
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  accessibilityLabel?: string
  nativeID?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: AriaAttributes['aria-haspopup']
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

/**
 * The band cell as a real `<button>`: the filter reads as a cell of the
 * coloured band, not as Bloom's pill field, so the trigger is ours and Bloom
 * owns the rest — the list, its keyboard and focus return (it finds this
 * button again by its `aria-haspopup`).
 *
 * The accessible name is the filter's label, as it was on the native select;
 * the chosen value is its description, so "All Teams, collapsed, Engineering"
 * is what a screen reader hears.
 */
function CellTrigger({
  children,
  valueId,
  onPress,
  disabled,
  accessibilityLabel,
  nativeID,
  'aria-expanded': expanded,
  'aria-haspopup': hasPopup,
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
}: CellTriggerProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-haspopup={hasPopup}
      aria-invalid={invalid}
      id={nativeID}
      disabled={disabled}
      aria-label={accessibilityLabel}
      aria-describedby={[valueId, describedBy].filter(Boolean).join(' ')}
      onClick={onPress}
      className="group relative flex h-full w-full items-center py-3 pe-10 ps-[var(--filter-ps,1.5rem)] text-start outline-none hover:cursor-pointer focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-a1"
    >
      {children}
    </button>
  )
}

function Filter({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  className: string
}) {
  const valueId = useId()
  const items = useMemo(
    () => [
      { value: ALL, label: `${label} (${options.length})` },
      ...options.map((option) => ({ value: option, label: option })),
    ],
    [label, options],
  )
  const display = items.find((item) => item.value === value)?.label ?? items[0].label

  return (
    <div className={`flex text-b1 text-gray-a1 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger asChild label={label} style={{ flexGrow: 1, flexBasis: 0, minWidth: 0 }}>
          <CellTrigger valueId={valueId}>
            <span id={valueId} className="truncate">
              {display}
            </span>
            <span className="pointer-events-none absolute end-5 flex transition-transform duration-150 group-aria-expanded:rotate-180 motion-reduce:transition-none">
              <RiArrowDownSLine size="lg" fill="currentColor" />
            </span>
          </CellTrigger>
        </SelectTrigger>
        <SelectContent
          label={label}
          items={items}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
              <SelectItemIndicator />
            </SelectItem>
          )}
        />
      </Select>
    </div>
  )
}

function JobRow({ job }: { job: JobListing }) {
  return (
    <div className="relative layout-px-bleed grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 group lg:items-center gap-y-1.5 md:gap-y-3 lg:gap-y-0 py-6 md:py-8 lg:py-5 bg-gray-a10 lg:hover:bg-gray-a8">
      <p className="col-span-7 col-start-1 text-b3 text-gray-a1 sm:col-span-11 md:col-span-6 lg:col-span-3 lg:col-start-5">{job.title}</p>
      <p className="col-span-7 col-start-1 text-b3 text-alt-gray-e1 sm:col-span-11 md:col-span-6 lg:col-span-3 lg:col-start-9">
        {job.location}
      </p>
      <Link
        className="col-span-1 col-start-8 max-md:row-start-1 sm:col-start-12 md:col-span-full md:col-start-11 lg:col-span-1 lg:col-start-12 lg:row-start-1 self-end justify-self-end whitespace-nowrap lowercase underline underline-offset-4 before:absolute before:inset-0 group-hover:opacity-100 lg:opacity-0 text-b3 transition-opacity duration-300 flex h-full items-end"
        to={job.href}
      >
        <SliceIcon name="arrow-right" className="size-4 md:hidden" />
        <span className="max-md:hidden md:flex">Apply Now</span>
      </Link>
    </div>
  )
}

/**
 * Filterable list of open roles, grouped by team. The filter bar and each team
 * heading pin under the site header while their section scrolls, so you always
 * know which team you are reading.
 */
export default function JobBoard({ jobs, isPending, emptyMessage = 'No open roles match these filters.' }: JobBoardProps) {
  const [team, setTeam] = useState(ALL)
  const [location, setLocation] = useState(ALL)

  const teams = useMemo(() => Array.from(new Set(jobs.map((job) => job.team))).sort(), [jobs])
  const locations = useMemo(() => Array.from(new Set(jobs.map((job) => job.location))).sort(), [jobs])

  const grouped = useMemo(() => {
    const visible = jobs.filter((job) => (team === ALL || job.team === team) && (location === ALL || job.location === location))
    const byTeam = new Map<string, JobListing[]>()
    for (const job of visible) {
      const bucket = byTeam.get(job.team)
      if (bucket) bucket.push(job)
      else byTeam.set(job.team, [job])
    }
    return Array.from(byTeam.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [jobs, team, location])

  return (
    <div className="relative">
      {/* Full-bleed band: the colour runs edge to edge while the first cell's
       * label still starts on the page gutter, so it lines up with the rows. */}
      <div className="sticky top-[var(--header-height)] z-40 grid h-[var(--nav-height)] w-full grid-cols-2 lg:grid-cols-3">
        {/* The first cell's label has to land on the page frame, not on its own
            cell edge, so it lines up with the team names in the rows below.
            Past the 110rem cap the frame is inset further than the gutter: the
            cell is a third of the band, so `300%` is the band's own width and
            the same offset falls out of it without measuring anything. */}
        <Filter
          label="All Teams"
          value={team}
          options={teams}
          onChange={setTeam}
          className="bg-gray-a8 [--filter-ps:max(var(--layout-gutter),calc((300%-var(--layout-max-width))/2+var(--layout-gutter)))]"
        />
        <div className="hidden items-center bg-gray-a7 px-6 text-b1 lg:grid">Role</div>
        <Filter label="All Locations" value={location} options={locations} onChange={setLocation} className="bg-gray-a6" />
      </div>

      {isPending && <p className="layout-px-bleed text-b1 text-alt-gray-e1 py-20">Loading open roles…</p>}

      {!isPending && grouped.length === 0 && <p className="layout-px-bleed text-b1 text-alt-gray-e1 py-20">{emptyMessage}</p>}

      {grouped.map(([teamName, teamJobs]) => (
        <section key={teamName} className="relative grid items-start text-gray-a1 bg-gray-a10 py-20">
          <div className="layout-px-bleed pointer-events-none pb-5 lg:sticky lg:col-start-1 lg:row-start-1 lg:pb-0 lg:top-[calc(var(--header-height)+var(--nav-height)+1.5rem)] text-b1 z-30">
            <h2 className="md:max-w-[11em] lg:max-w-[8em] xl:max-w-[20em] pointer-events-auto">{teamName}</h2>
          </div>
          <div className="lg:col-start-1 lg:row-start-1">
            {teamJobs.map((job) => (
              <JobRow key={job.href} job={job} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
