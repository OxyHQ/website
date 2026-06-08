import { useState } from 'react'
import { useNavigation, useLocales } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton } from '@oxyhq/bloom/button'
import { Divider } from '@oxyhq/bloom/divider'
import { Input } from '../../ui/shadcn/input'
import { Label } from '../../ui/shadcn/label'
import { IconPicker } from '../../ui/shadcn/icon-picker'
import MediaPicker from '../MediaPicker'
import LocaleSwitcher from '../LocaleSwitcher'
import { BatchTranslationEditor } from '../TranslationEditor'
import { type NavItem, type NavDropdownSection, type NavDropdownItem, type NavSidePanel } from '../../../data/content'

function mediaId(image: unknown): string {
  if (!image) return ''
  if (typeof image === 'string') return image
  if (typeof image === 'object' && image !== null && '_id' in image) {
    const id = (image as { _id?: unknown })._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

interface AdminNavItem {
  title: string
  description: string
  href: string
  icon?: string
  image?: string
  section?: string
}

type AdminNavKind = 'manual' | 'apps'

interface AdminNavDropdown {
  _id?: string
  label: string
  kind: AdminNavKind
  order: number
  items: AdminNavItem[]
  sidePanel: NavSidePanel | null
}

function normalizeDropdowns(data: ReturnType<typeof useNavigation>['data']): AdminNavDropdown[] {
  return (data ?? []).map((dd) => {
    const raw = dd as unknown as { kind?: unknown }
    const kind: AdminNavKind = raw.kind === 'apps' ? 'apps' : 'manual'
    return {
      ...dd,
      label: dd.label ?? '',
      kind,
      order: dd.order ?? 0,
      items: (dd.sections ?? []).flatMap((s: NavDropdownSection) =>
        (s.items ?? []).map((item: NavDropdownItem) => ({
          ...item,
          image: mediaId(item.image),
          section: s.heading || '',
        }))
      ),
      sidePanel: dd.sidePanel ?? null,
    }
  })
}

export default function NavigationAdmin() {
  const { data, refetch } = useNavigation()
  const { data: locales } = useLocales()
  const [dropdowns, setDropdowns] = useState<AdminNavDropdown[]>(() => normalizeDropdowns(data))
  const [lastSyncedData, setLastSyncedData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const resolvedActiveLocale = activeLocale || defaultLocale

  // Reset local form state when the server data changes — documented React pattern
  // for deriving state from props without useEffect.
  if (data !== lastSyncedData) {
    setLastSyncedData(data)
    setDropdowns(normalizeDropdowns(data))
  }

  const save = async () => {
    setSaving(true)
    await apiFetch('/navigation', { method: 'PUT', body: JSON.stringify(dropdowns) })
    await refetch()
    setSaving(false)
  }

  const addDropdown = () => {
    setDropdowns([...dropdowns, { label: 'New Menu', kind: 'manual', order: dropdowns.length, items: [], sidePanel: null }])
  }

  const removeDropdown = (idx: number) => {
    setDropdowns(dropdowns.filter((_, i) => i !== idx))
  }

  const updateDropdown = <K extends keyof AdminNavDropdown>(idx: number, field: K, value: AdminNavDropdown[K]) => {
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
    next[di] = { ...next[di], items: [...next[di].items, { title: '', description: '', href: '/', icon: '', image: '', section: '' }] }
    setDropdowns(next)
  }

  const removeItem = (di: number, ii: number) => {
    const next = [...dropdowns]
    next[di] = { ...next[di], items: next[di].items.filter((_, i) => i !== ii) }
    setDropdowns(next)
  }

  const addSidePanel = (di: number) => updateDropdown(di, 'sidePanel', { heading: '', links: [] })
  const removeSidePanel = (di: number) => updateDropdown(di, 'sidePanel', null)

  const updateSidePanelHeading = (di: number, value: string) => {
    const next = [...dropdowns]
    const sp = next[di].sidePanel!
    next[di] = { ...next[di], sidePanel: { ...sp, heading: value } }
    setDropdowns(next)
  }

  const addSidePanelLink = (di: number) => {
    const next = [...dropdowns]
    const sp = next[di].sidePanel!
    next[di] = { ...next[di], sidePanel: { ...sp, links: [...sp.links, { label: '', href: '/' }] } }
    setDropdowns(next)
  }

  const updateSidePanelLink = (di: number, li: number, field: string, value: string) => {
    const next = [...dropdowns]
    const sp = next[di].sidePanel!
    const links = [...sp.links]
    links[li] = { ...links[li], [field]: value }
    next[di] = { ...next[di], sidePanel: { ...sp, links } }
    setDropdowns(next)
  }

  const removeSidePanelLink = (di: number, li: number) => {
    const next = [...dropdowns]
    const sp = next[di].sidePanel!
    next[di] = { ...next[di], sidePanel: { ...sp, links: sp.links.filter((_, i) => i !== li) } }
    setDropdowns(next)
  }

  const isDefault = resolvedActiveLocale === defaultLocale

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Navigation</h2>
          <p className="mt-1 text-sm text-muted-foreground">Edit dropdown menus in the main navbar.</p>
        </div>
        {isDefault && <PrimaryButton onPress={addDropdown}>Add menu</PrimaryButton>}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={resolvedActiveLocale} onLocaleChange={setActiveLocale} />
      </div>

      {!isDefault ? (
        <div className="mt-6">
          <BatchTranslationEditor
            collection="navigation"
            locale={resolvedActiveLocale}
            documents={dropdowns.filter((d): d is AdminNavDropdown & { _id: string } => !!d._id)}
            renderItem={({ doc, fields, updateField }) => (
              <div className="rounded-xl border border-border p-5">
                <h3 className="mb-3 text-sm font-medium text-foreground">Menu: {doc.label}</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Label</Label>
                    <Input value={fields.label ?? ''} onChange={(e) => updateField('label', e.target.value)} placeholder={doc.label} />
                  </div>
                  {(doc.items ?? []).map((item: AdminNavItem, ii: number) => (
                    <div key={ii} className="rounded-lg border border-border/50 p-3">
                      <p className="mb-2 text-xs text-muted-foreground">Item: {item.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={(fields.items?.[ii]?.title) ?? ''}
                            onChange={(e) => {
                              const items = [...(fields.items ?? [])]
                              while (items.length <= ii) items.push({})
                              items[ii] = { ...items[ii], title: e.target.value }
                              updateField('items', items)
                            }}
                            placeholder={item.title}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={(fields.items?.[ii]?.description) ?? ''}
                            onChange={(e) => {
                              const items = [...(fields.items ?? [])]
                              while (items.length <= ii) items.push({})
                              items[ii] = { ...items[ii], description: e.target.value }
                              updateField('items', items)
                            }}
                            placeholder={item.description}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {doc.sidePanel && (
                    <div className="rounded-lg border border-border/50 p-3">
                      <p className="mb-2 text-xs text-muted-foreground">Side Panel</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Heading</Label>
                          <Input
                            value={fields.sidePanel?.heading ?? ''}
                            onChange={(e) => updateField('sidePanel', { ...fields.sidePanel, heading: e.target.value })}
                            placeholder={doc.sidePanel.heading}
                          />
                        </div>
                        {(doc.sidePanel.links ?? []).map((link: NavItem, li: number) => (
                          <div key={li} className="flex flex-col gap-1">
                            <Label className="text-xs">Link: {link.label}</Label>
                            <Input
                              value={(fields.sidePanel?.links?.[li]?.label) ?? ''}
                              onChange={(e) => {
                                const links = [...(fields.sidePanel?.links ?? [])]
                                while (links.length <= li) links.push({})
                                links[li] = { ...links[li], label: e.target.value }
                                updateField('sidePanel', { ...fields.sidePanel, links })
                              }}
                              placeholder={link.label}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {dropdowns.map((dropdown, di) => (
            <div key={di} className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between gap-4">
                <Input
                  value={dropdown.label}
                  onChange={(e) => updateDropdown(di, 'label', e.target.value)}
                  className="max-w-xs text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
                  placeholder="Menu label"
                />
                <div className="flex items-center gap-2">
                  {dropdown.kind === 'apps' && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      From Products CMS
                    </span>
                  )}
                  <Button variant="ghost" size="small" onPress={() => removeDropdown(di)}>Remove menu</Button>
                </div>
              </div>

              <Divider />

              {dropdown.kind === 'apps' ? (
                /* Apps-mode — no item management; items come from Product.find({ showInNav: true }) */
                <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Items for this dropdown are generated automatically from the Products CMS.
                  Every product with <span className="font-mono">showInNav</span> enabled appears here,
                  grouped by its category. To add or reorder items, edit the product directly.
                </div>
              ) : (
              /* Manual items */
              <div className="mt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Items</h4>
                <div className="flex flex-col gap-3">
                  {(dropdown.items ?? []).map((item, ii) => (
                    <div key={ii} className="rounded-lg border border-border p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label>Title</Label>
                          <Input value={item.title} onChange={(e) => updateItem(di, ii, 'title', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Path</Label>
                          <Input value={item.href} onChange={(e) => updateItem(di, ii, 'href', e.target.value)} className="font-mono" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Description</Label>
                          <Input value={item.description} onChange={(e) => updateItem(di, ii, 'description', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Section heading</Label>
                          <Input value={item.section ?? ''} onChange={(e) => updateItem(di, ii, 'section', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <Label>Icon</Label>
                          <IconPicker value={item.icon ?? ''} onChange={(v) => updateItem(di, ii, 'icon', v)} />
                          <p className="text-xs text-muted-foreground">Used when no image is set below.</p>
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <Label>Image / logo</Label>
                          <MediaPicker
                            value={item.image ?? ''}
                            onChange={(id) => updateItem(di, ii, 'image', id ?? '')}
                            folder="navigation"
                            accept="image/*"
                          />
                          <p className="text-xs text-muted-foreground">Pick or upload a logo. When set, it replaces the icon in the navbar.</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button variant="ghost" size="small" onPress={() => removeItem(di, ii)}>Remove item</Button>
                      </div>
                    </div>
                  ))}
                  <div className="self-start">
                    <Button variant="ghost" size="small" onPress={() => addItem(di)}>+ Add item</Button>
                  </div>
                </div>
              </div>
              )}

              <Divider />

              {/* Side panel */}
              <div className="mt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Side Panel</h4>
                {dropdown.sidePanel ? (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-end gap-3">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <Label>Heading</Label>
                        <Input value={dropdown.sidePanel.heading} onChange={(e) => updateSidePanelHeading(di, e.target.value)} />
                      </div>
                      <Button variant="ghost" size="small" onPress={() => removeSidePanel(di)}>Remove</Button>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {(dropdown.sidePanel.links ?? []).map((link, li) => (
                        <div key={li} className="flex items-center gap-2">
                          <Input value={link.label} onChange={(e) => updateSidePanelLink(di, li, 'label', e.target.value)} placeholder="Label" className="flex-1" />
                          <Input value={link.href} onChange={(e) => updateSidePanelLink(di, li, 'href', e.target.value)} placeholder="/path" className="flex-1 font-mono" />
                          <Button variant="ghost" size="small" onPress={() => removeSidePanelLink(di, li)}>x</Button>
                        </div>
                      ))}
                      <div className="self-start">
                        <Button variant="ghost" size="small" onPress={() => addSidePanelLink(di)}>+ Add link</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="small" onPress={() => addSidePanel(di)}>+ Add side panel</Button>
                )}
              </div>
            </div>
          ))}

          <div className="self-start">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
