import { useState, useMemo } from 'react'
import { cn } from '../../../lib/utils'
import { Input } from './input'
import * as LucideIcons from 'lucide-react'

// Get all icon names (filter out non-component exports)
const ALL_ICONS = Object.entries(LucideIcons).filter(
  ([name, val]) => typeof val === 'function' && name !== 'createLucideIcon' && name !== 'default' && /^[A-Z]/.test(name)
) as [string, LucideIcons.LucideIcon][]

// Convert PascalCase to kebab-case for storage
function toKebab(name: string) {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function fromKebab(kebab: string) {
  return kebab.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())
}

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return ALL_ICONS.slice(0, 60)
    const q = search.toLowerCase()
    return ALL_ICONS.filter(([name]) => name.toLowerCase().includes(q)).slice(0, 60)
  }, [search])

  const SelectedIcon = value ? (LucideIcons as Record<string, LucideIcons.LucideIcon>)[fromKebab(value)] : null

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted"
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="size-4 text-foreground" />
            <span className="text-foreground">{value}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select icon...</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-background p-3 shadow-lg">
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="mt-2 grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
              {filtered.map(([name, Icon]) => {
                const kebab = toKebab(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { onChange(kebab); setOpen(false); setSearch('') }}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md transition-colors',
                      value === kebab ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                    )}
                    title={kebab}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="col-span-8 py-4 text-center text-xs text-muted-foreground">No icons found</p>
              )}
            </div>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="mt-2 w-full rounded-md py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Clear selection
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
