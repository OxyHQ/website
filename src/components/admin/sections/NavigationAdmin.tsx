import { useState, useEffect } from 'react'
import { useNavigation } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function NavigationAdmin() {
  const { data, refetch } = useNavigation()
  const [dropdowns, setDropdowns] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    const normalized = (data as any[]).map((dd: any) => ({
      label: dd.label ?? '',
      order: dd.order ?? 0,
      items: dd.items ?? dd.sections?.flatMap((s: any) =>
        (s.items ?? []).map((item: any) => ({ ...item, section: item.section || s.heading || '' }))
      ) ?? [],
      sidePanel: dd.sidePanel ?? null,
    }))
    setDropdowns(normalized)
  }, [data])

  const save = async () => {
    setSaving(true)
    await apiFetch('/navigation', { method: 'PUT', body: JSON.stringify(dropdowns) })
    await refetch()
    setSaving(false)
  }

  const addDropdown = () => {
    setDropdowns([...dropdowns, { label: 'New Menu', order: dropdowns.length, items: [], sidePanel: null }])
  }

  const removeDropdown = (idx: number) => {
    setDropdowns(dropdowns.filter((_, i) => i !== idx))
  }

  const updateDropdown = (idx: number, field: string, value: any) => {
    const next = [...dropdowns]
    next[idx] = { ...next[idx], [field]: value }
    setDropdowns(next)
  }

  const updateItem = (di: number, ii: number, field: string, value: string) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], items: [...next[di].items] }
    next[di].items[ii] = { ...next[di].items[ii], [field]: value }
    setDropdowns(next)
  }

  const addItem = (di: number) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], items: [...next[di].items, { title: '', description: '', href: '/', icon: '', section: '' }] }
    setDropdowns(next)
  }

  const removeItem = (di: number, ii: number) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], items: next[di].items.filter((_: any, i: number) => i !== ii) }
    setDropdowns(next)
  }

  const addSidePanel = (di: number) => {
    updateDropdown(di, 'sidePanel', { heading: '', links: [] })
  }

  const removeSidePanel = (di: number) => {
    updateDropdown(di, 'sidePanel', null)
  }

  const updateSidePanelHeading = (di: number, value: string) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], sidePanel: { ...next[di].sidePanel, heading: value } }
    setDropdowns(next)
  }

  const addSidePanelLink = (di: number) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], sidePanel: { ...next[di].sidePanel, links: [...(next[di].sidePanel?.links ?? []), { label: '', href: '/' }] } }
    setDropdowns(next)
  }

  const updateSidePanelLink = (di: number, li: number, field: string, value: string) => {
    const next = [...dropdowns]
    const links = [...next[di].sidePanel.links]
    links[li] = { ...links[li], [field]: value }
    next[di] = { ...next[di], sidePanel: { ...next[di].sidePanel, links } }
    setDropdowns(next)
  }

  const removeSidePanelLink = (di: number, li: number) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], sidePanel: { ...next[di].sidePanel, links: next[di].sidePanel.links.filter((_: any, i: number) => i !== li) } }
    setDropdowns(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Navigation</h2>
          <p className="mt-1 text-sm text-muted-foreground">Edit dropdown menus in the main navbar.</p>
        </div>
        <button onClick={addDropdown} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Add menu
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {dropdowns.map((dropdown, di) => (
          <div key={di} className="rounded-xl border border-border p-5">
            {/* Dropdown header */}
            <div className="flex items-center justify-between">
              <input
                value={dropdown.label}
                onChange={(e) => updateDropdown(di, 'label', e.target.value)}
                className="text-lg font-semibold text-foreground bg-transparent border-none outline-none"
                placeholder="Menu label"
              />
              <button onClick={() => removeDropdown(di)} className="text-xs text-destructive hover:underline">Remove menu</button>
            </div>

            {/* Items */}
            <div className="mt-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
              <div className="flex flex-col gap-2">
                {(dropdown.items ?? []).map((item: any, ii: number) => (
                  <div key={ii} className="rounded-lg border border-border p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Title</span>
                        <input value={item.title} onChange={(e) => updateItem(di, ii, 'title', e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Path</span>
                        <input value={item.href} onChange={(e) => updateItem(di, ii, 'href', e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm font-mono outline-none focus:border-primary" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Description</span>
                        <input value={item.description} onChange={(e) => updateItem(di, ii, 'description', e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Icon key</span>
                        <input value={item.icon ?? ''} onChange={(e) => updateItem(di, ii, 'icon', e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm font-mono outline-none focus:border-primary" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Section heading</span>
                        <input value={item.section ?? ''} onChange={(e) => updateItem(di, ii, 'section', e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
                      </label>
                    </div>
                    <button onClick={() => removeItem(di, ii)} className="mt-2 text-xs text-destructive hover:underline">Remove</button>
                  </div>
                ))}
                <button onClick={() => addItem(di)} className="self-start text-sm text-primary hover:underline">+ Add item</button>
              </div>
            </div>

            {/* Side panel */}
            <div className="mt-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Side Panel</h4>
              {dropdown.sidePanel ? (
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <label className="flex flex-col gap-1 flex-1">
                      <span className="text-xs text-muted-foreground">Heading</span>
                      <input value={dropdown.sidePanel.heading} onChange={(e) => updateSidePanelHeading(di, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
                    </label>
                    <button onClick={() => removeSidePanel(di)} className="ml-3 text-xs text-destructive hover:underline">Remove</button>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {(dropdown.sidePanel.links ?? []).map((link: any, li: number) => (
                      <div key={li} className="flex items-center gap-2">
                        <input value={link.label} onChange={(e) => updateSidePanelLink(di, li, 'label', e.target.value)} placeholder="Label" className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
                        <input value={link.href} onChange={(e) => updateSidePanelLink(di, li, 'href', e.target.value)} placeholder="/path" className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm font-mono outline-none focus:border-primary" />
                        <button onClick={() => removeSidePanelLink(di, li)} className="text-xs text-destructive hover:underline">x</button>
                      </div>
                    ))}
                    <button onClick={() => addSidePanelLink(di)} className="self-start text-sm text-primary hover:underline">+ Add link</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => addSidePanel(di)} className="text-sm text-primary hover:underline">+ Add side panel</button>
              )}
            </div>
          </div>
        ))}

        <button onClick={save} disabled={saving} className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
