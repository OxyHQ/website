import { useState } from 'react'
import { useCategories, type CategoryRecord, type CategoryScope } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function emptyCategory(): CategoryRecord {
  return { slug: '', label: '', description: '', scope: 'apps', order: 0 }
}

const SCOPE_LABEL: Record<CategoryScope, string> = {
  apps: 'Apps sections (/technologies, /status, navbar)',
  nav: 'Navbar dropdown headings',
  generic: 'Generic / shared across everything',
}

export default function CategoriesAdmin() {
  const { data, refetch } = useCategories()
  const [editing, setEditing] = useState<CategoryRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = data ?? []
  const scopes: CategoryScope[] = ['apps', 'nav', 'generic']
  const grouped = scopes.map((scope) => ({
    scope,
    items: categories.filter((c) => c.scope === scope),
  }))

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload: Partial<CategoryRecord> = { ...editing }
      if (!payload.description) delete payload.description
      if (editing._id) {
        await apiFetch(`/categories/${editing.slug}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/categories', { method: 'POST', body: JSON.stringify(payload) })
      }
      await refetch()
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const deleteAction = useConfirmAction<CategoryRecord>({
    onConfirm: async (category) => {
      await apiFetch(`/categories/${category.slug}`, { method: 'DELETE' })
      await refetch()
    },
  })

  if (editing) {
    const isNew = !editing._id
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isNew ? 'New category' : `Edit: ${editing.label}`}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Label</Label>
              <Input
                value={editing.label}
                onChange={(e) => {
                  const label = e.target.value
                  setEditing({
                    ...editing,
                    label,
                    ...(isNew && !editing.slug ? { slug: slugify(label) } : {}),
                  })
                }}
                placeholder="Social & Communication"
              />
              <p className="text-xs text-muted-foreground">Human-readable label shown on /technologies, /status, and navbar headings.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                disabled={!isNew}
                className="font-mono"
              />
              {!isNew && <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Scope</Label>
              <select
                value={editing.scope}
                onChange={(e) => setEditing({ ...editing, scope: e.target.value as CategoryScope })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                {(['apps', 'nav', 'generic'] as CategoryScope[]).map((scope) => (
                  <option key={scope} value={scope}>{SCOPE_LABEL[scope]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Order</Label>
              <Input
                type="number"
                value={editing.order}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center gap-2">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable labels used to group products on /technologies, /status, and the Ecosystem navbar dropdown.
            Identified by slug, rendered as <span className="font-mono">label</span>.
          </p>
        </div>
        <PrimaryButton onPress={() => setEditing(emptyCategory())}>Add category</PrimaryButton>
      </div>

      {grouped.map(({ scope, items }) => (
        <section key={scope} className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{SCOPE_LABEL[scope]}</h3>
          {items.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing in this scope yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {items.map((category) => (
                <div key={category.slug} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{category.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{category.slug}</span>
                      {category.description ? ` · ${category.description}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">#{category.order}</div>
                  <div className="shrink-0">
                    <Button variant="ghost" size="small" onPress={() => setEditing(category)}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => deleteAction.request(category)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete “${deleteAction.target.label || deleteAction.target.slug}”?` : 'Delete category?'}
        description="Any products or nav items still pointing at this category will need to be re-assigned. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
