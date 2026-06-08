import { useState } from 'react'
import {
  useHelpArticles,
  useCategories,
  useLocales,
  resolveHelpArticleCategoryId,
  type HelpArticleRecord,
  type HelpArticleStatus,
} from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'
import LocaleSwitcher from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'
import MediaPicker from '../MediaPicker'

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

function stripRefsForEditing(article: HelpArticleRecord): HelpArticleRecord {
  return {
    ...article,
    coverImage: mediaIdString(article.coverImage) || null,
    category: resolveHelpArticleCategoryId(article) || null,
  }
}

function emptyArticle(): HelpArticleRecord {
  return {
    slug: '',
    title: '',
    summary: '',
    content: '',
    category: null,
    icon: '',
    coverImage: null,
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
  content: string
  category: string | null
  icon: string
  coverImage: string | null
  tags: string[]
  featured: boolean
  status: HelpArticleStatus
  publishedAt: string
  order: number
}

function toPayload(article: HelpArticleRecord): SavePayload {
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    content: article.content,
    category: resolveHelpArticleCategoryId(article) || null,
    icon: article.icon ?? '',
    coverImage: mediaIdString(article.coverImage) || null,
    tags: article.tags,
    featured: article.featured,
    status: article.status,
    publishedAt: article.publishedAt,
    order: article.order,
  }
}

function toDateInputValue(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default function HelpAdmin() {
  const { data, refetch } = useHelpArticles({ limit: 50, status: 'published' })
  const { data: draftData, refetch: refetchDrafts } = useHelpArticles({ limit: 50, status: 'draft' })
  const { data: locales } = useLocales()
  const { data: categoriesData } = useCategories('generic')
  const categories = categoriesData ?? []
  const [editing, setEditing] = useState<HelpArticleRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeLocale, setActiveLocale] = useState('')
  const [translating, setTranslating] = useState<HelpArticleRecord | null>(null)

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const articles = [...(data?.articles ?? []), ...(draftData?.articles ?? [])]
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
        await apiFetch(`/help/${editing.slug}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/help', { method: 'POST', body: JSON.stringify(payload) })
      }
      await refresh()
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save help article')
    } finally {
      setSaving(false)
    }
  }

  const deleteAction = useConfirmAction<HelpArticleRecord>({
    onConfirm: async (article) => {
      await apiFetch(`/help/${article.slug}`, { method: 'DELETE' })
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
          {isNew ? 'New help article' : `Edit: ${editing.title}`}
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

          <Field
            label="Summary"
            value={editing.summary}
            onChange={(v) => setEditing({ ...editing, summary: v })}
            textarea
            rows={3}
          />

          <Field
            label="Content (Markdown)"
            value={editing.content}
            onChange={(v) => setEditing({ ...editing, content: v })}
            textarea
            rows={14}
          />

          <MediaPicker
            value={mediaIdString(editing.coverImage) || undefined}
            onChange={(id) => setEditing({ ...editing, coverImage: id ?? null })}
            label="Cover image (optional)"
            folder="help"
            accept="image/*"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <select
                value={typeof editing.category === 'string' ? editing.category : ''}
                onChange={(e) => setEditing({ ...editing, category: e.target.value || null })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">— Select a category —</option>
                {categories.map((c) => (
                  <option key={c._id ?? c.slug} value={c._id ?? ''}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <Input
                value={editing.icon ?? ''}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                placeholder="rocket"
              />
              <p className="text-xs text-muted-foreground">Lucide icon name in kebab-case (e.g. <span className="font-mono">rocket</span>, <span className="font-mono">credit-card</span>).</p>
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

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tags (comma-separated)"
              value={editing.tags.join(', ')}
              onChange={(v) => setEditing({ ...editing, tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Published at</Label>
              <Input
                type="date"
                value={toDateInputValue(editing.publishedAt)}
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) return
                  setEditing({ ...editing, publishedAt: new Date(value).toISOString() })
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
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
            collection="help"
            documentId={translating._id ?? ''}
            locale={activeLocale}
            originalFields={translating}
            translatableFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'summary', label: 'Summary', type: 'textarea' },
              { key: 'content', label: 'Content (Markdown)', type: 'textarea' },
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
          <h2 className="text-xl font-semibold text-foreground">Help Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">{articles.length} articles</p>
        </div>
        {isDefault && (
          <PrimaryButton onPress={() => setEditing(emptyArticle())}>New article</PrimaryButton>
        )}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {articles.map((article) => {
          const categoryLabel = typeof article.category === 'object' && article.category?.label
            ? article.category.label
            : ''
          return (
            <div
              key={article._id ?? article.slug}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{article.title}</span>
                  {article.featured && <Badge color="primary">Featured</Badge>}
                  {article.status === 'draft' && <Badge color="warning">Draft</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {categoryLabel && <span>{categoryLabel} &middot; </span>}
                  <span className="font-mono">{article.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDefault ? (
                  <>
                    <Button variant="ghost" size="small" onPress={() => setEditing(stripRefsForEditing(article))}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => deleteAction.request(article)}>Delete</Button>
                  </>
                ) : (
                  <Button variant="ghost" size="small" onPress={() => setTranslating(article)}>Translate</Button>
                )}
              </div>
            </div>
          )
        })}
        {articles.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No help articles yet.</p>
        )}
      </div>

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete “${deleteAction.target.title || deleteAction.target.slug}”?` : 'Delete help article?'}
        description="This permanently removes the help article. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
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
