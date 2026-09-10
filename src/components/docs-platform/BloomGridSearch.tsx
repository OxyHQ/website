import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SecondaryButton } from '@oxy.so/bloom/button'
import { Command, type CommandItem } from '@oxy.so/bloom/command'
import { Kbd } from '@oxy.so/bloom/kbd'
import type { BloomSurfaceEntry } from '../../content/bloom-catalog'
import type { BloomDemo } from '../../content/bloom-demos/registry'

/**
 * One card's worth of the Bloom catalog: the surface as generated, where its
 * page lives, and the demo that previews it (absent for the surfaces that have
 * none yet). Built by `BloomComponentsHub`; declared here because this is the
 * shape the palette is handed.
 */
export interface BloomGridEntry {
  surface: BloomSurfaceEntry
  /** Route of the surface's component page. */
  href: string
  demo?: BloomDemo
}

/**
 * `⌘K` on Apple platforms, `Ctrl K` everywhere else. Read once at import:
 * the platform cannot change under a running tab, and the prerender (which
 * has no `navigator`) falls back to the label the majority of visitors see.
 */
const shortcutLabel =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
    ? '⌘K'
    : 'Ctrl K'

/**
 * ⌘K search over the Bloom component grid.
 *
 * Bloom's own `Command` is the palette — it owns the input, the grouped
 * results list and the Escape/backdrop dismiss, so the only things left here
 * are the shortcut binding and turning catalog entries into items. `Command`'s
 * default filter matches an item's `label`, `description` and `keywords`, which
 * is why the component names go into `keywords` and the category into both
 * `group` and `keywords`: typing `avatar`, `text-field` or `overlays` all hit.
 *
 * Two things `Command` promises on web do not work in Bloom 1.0.2, and are
 * deliberately NOT worked around here — the fix belongs upstream:
 *
 *  - Up/Down/Enter do nothing. `Command` puts its key handler on the `View`
 *    wrapping the input, and `react-native-web`'s `TextInput` calls
 *    `stopPropagation()` on every keydown, so the handler never sees one.
 *    Selecting with the mouse works.
 *  - Opening does not focus the input, so you must click before typing.
 *
 * Until both land, ⌘K opens, you click the field, type, and click a result.
 */
export function BloomGridSearch({ entries }: { entries: readonly BloomGridEntry[] }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k') return
      if (!event.metaKey && !event.ctrlKey) return
      event.preventDefault()
      setOpen((previous) => !previous)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const items = useMemo<CommandItem[]>(
    () =>
      entries.map(({ surface, href }) => {
        const names = surface.components.map((component) => component.name)
        return {
          id: surface.subpath,
          label: surface.subpath,
          description: names.join(' · ') || surface.importPath,
          keywords: [...names, surface.category, surface.importPath],
          group: surface.category,
          onSelect: () => navigate(href),
        }
      }),
    [entries, navigate],
  )

  return (
    <>
      <SecondaryButton
        size="small"
        onPress={() => setOpen(true)}
        icon={<Kbd size="sm">{shortcutLabel}</Kbd>}
        iconPosition="right"
        accessibilityLabel={`Search Bloom components (${shortcutLabel})`}
      >
        Search components
      </SecondaryButton>
      <Command
        visible={open}
        onClose={() => setOpen(false)}
        items={items}
        placeholder="Search Bloom components…"
        emptyText="No component matches that."
      />
    </>
  )
}
