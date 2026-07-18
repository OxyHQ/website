import { useState } from 'react'
import {
  useResources,
  useCategories,
  useLocales,
  resolveResourceCategoryId,
  type ResourceRecord,
  type ResourceType,
  type ResourceStatus,
} from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'
import MediaPicker from '../MediaPicker'

const RESOURCE_TYPES: ResourceType[] = ['guide', 'paper', 'video', 'tool', 'template', 'link']

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function mediaIdString(cover: unknown): string {
  if (!cover) return ''
  if (typeof cover === 'string') return cover
  if (typeof cover === 'object' && cover !== null && '_id' in cover) {
    const id = (cover as { _id?: unknown })._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function stripRefsForEditing(resource: ResourceRecord): ResourceRecord {
  return {
    ...resource,
    coverImage: mediaIdString(resource.coverImage) || null,
    category: resolveResourceCategoryId(resource) || null,
  }
}

function emptyResource(): ResourceRecord {
  return {
    slug: '',
    title: '',
    summary: '',
    type: 'guide',
    coverImage: null,
    category: null,
    href: '',
    external: false,
    tags: [],
    featured: false,
    status: 'published',
    publishedAt: new Date().toISOString(),
    order: 0,
  }
}

interface SavePayload {
  slug: string
  title: string
  summary: string
  type: ResourceType
  coverImage: string | null
  category: string | null
  href: string
  external: boolean
  tags: string[]
  featured: boolean
  status: ResourceStatus
  publishedAt: string
  order: number
}

function toPayload(resource: ResourceRecord): SavePayload {
  return {
    slug: resource.slug,
    title: resource.title,
    summary: resource.summary,
    type: resource.type,
    coverImage: mediaIdString(resource.coverImage) || null,
    category: resolveResourceCategoryId(resource) || null,
    href: resource.href,
    external: resource.external,
    tags: resource.tags,
    featured: resource.featured,
    status: resource.status,
    publishedAt: resource.publishedAt,
    order: resource.order,
  }
}

export default function ResourcesAdmin() {
  const { data, refetch } = useResources({ limit: 50, status: 'published' })
  const { data: draftData, refetch: refetchDrafts } = useResources({ limit: 50, status: 'draft' })
  const { data: locales } = useLocales()
  const { data: categoriesData } = useCategories('generic')
  const categories = categoriesData ?? []
  const [editing, setEditing] = useState<ResourceRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeLocale, setActiveLocale] = useState('')
  const [translating, setTranslating] = useState<ResourceRecord | null>(null)

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const resources = [...(data?.resources ?? []), ...(draftData?.resources ?? [])]
  const isDefault = !activeLocale || activeLocale === defaultLocale

  const refresh = async () => {
    await Promise.all([refetch(), refetchDrafts()])
  }

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload = toPayload(editing)
      if (editing._id) {
        await apiFetch(`/resources/${editing.slug}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/resources', { method: 'POST', body: JSON.stringify(payload) })
      }
      await refresh()
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save resource')
    } finally {
      setSaving(false)
    }
  }

  const deleteAction = useConfirmAction<ResourceRecord>({
    onConfirm: async (resource) => {
      await apiFetch(`/resources/${resource.slug}`, { method: 'DELETE' })
      await refresh()
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
          {isNew ? 'New resource' : `Edit: ${editing.title}`}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Title"
              value={editing.title}
              onChange={(v) => setEditing({
                ...editing,
                title: v,
                ...(isNew && !editing.slug ? { slug: slugify(v) } : {}),
              })}
            />
            <Field
              label="Slug"
              value={editing.slug}
              onChange={(v) => setEditing({ ...editing, slug: slugify(v) })}
            />
          </div>

          <Field
            label="Summary"
            value={editing.summary}
            onChange={(v) => setEditing({ ...editing, summary: v })}
            textarea
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as ResourceType })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <select
                value={typeof editing.category === 'string' ? editing.category : ''}
                onChange={(e) => setEditing({ ...editing, category: e.target.value || null })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id ?? c.slug} value={c._id ?? ''}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>URL</Label>
            <Input
              value={editing.href}
              onChange={(e) => setEditing({ ...editing, href: e.target.value })}
              placeholder="/academy/… or https://…"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Canonical destination: local path or external URL.</p>
          </div>

          <MediaPicker
            value={mediaIdString(editing.coverImage) || undefined}
            onChange={(id) => setEditing({ ...editing, coverImage: id ?? null })}
            label="Cover image"
            folder="academy"
            accept="image/*"
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tags (comma-separated)"
              value={editing.tags.join(', ')}
              onChange={(v) => setEditing({ ...editing, tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Order</Label>
              <Input
                type="number"
                value={editing.order}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch value={editing.external} onValueChange={(val) => setEditing({ ...editing, external: val })} />
              <Label>External link</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch value={editing.featured} onValueChange={(val) => setEditing({ ...editing, featured: val })} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                value={editing.status === 'published'}
                onValueChange={(val) => setEditing({ ...editing, status: val ? 'published' : 'draft' })}
              />
              <Label>{editing.status === 'published' ? 'Published' : 'Draft'}</Label>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="mt-2 flex gap-3">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Publish' : 'Update'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  if (translating && !isDefault) {
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setTranslating(null)}>&larr; Back</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Translate: {translating.title}</h2>
        <div className="mt-4">
          <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
        </div>
        <div className="mt-6">
          <TranslationFields
            collection="resources"
            documentId={translating._id ?? ''}
            locale={activeLocale}
            originalFields={translating}
            translatableFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'summary', label: 'Summary', type: 'textarea' },
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Resources</h2>
          <p className="mt-1 text-sm text-muted-foreground">{resources.length} resources</p>
        </div>
        {isDefault && (
          <PrimaryButton onPress={() => setEditing(emptyResource())}>New resource</PrimaryButton>
        )}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {resources.map((resource) => {
          const categoryLabel = typeof resource.category === 'object' && resource.category?.label
            ? resource.category.label
            : ''
          return (
            <div
              key={resource._id ?? resource.slug}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{resource.title}</span>
                  {resource.featured && <Badge color="primary">Featured</Badge>}
                  {resource.status === 'draft' && <Badge color="warning">Draft</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <span className="capitalize">{resource.type}</span>
                  {categoryLabel && <span> &middot; {categoryLabel}</span>}
                  {resource.external && <span> &middot; external</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDefault ? (
                  <>
                    <Button variant="ghost" size="small" onPress={() => setEditing(stripRefsForEditing(resource))}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => deleteAction.request(resource)}>Delete</Button>
                  </>
                ) : (
                  <Button variant="ghost" size="small" onPress={() => setTranslating(resource)}>Translate</Button>
                )}
              </div>
            </div>
          )
        })}
        {resources.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No resources yet.</p>
        )}
      </div>

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete “${deleteAction.target.title || deleteAction.target.slug}”?` : 'Delete resource?'}
        description="This permanently removes the resource. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}

function Field({ label, value, onChange, textarea, rows }: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {textarea
        ? <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 3} />
        : <Input value={value} onChange={(e) => onChange(e.target.value)} />
      }
    </div>
  )
}
