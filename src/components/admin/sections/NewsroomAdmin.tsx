import { useState } from 'react'
import { useNewsroomPosts, useCreateNewsroomPost } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'

export default function NewsroomAdmin() {
  const { data, refetch } = useNewsroomPosts({ limit: 50 })
  const { data: locales } = useLocales()
  const createPost = useCreateNewsroomPost()
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')
  const [translatingPost, setTranslatingPost] = useState<any | null>(null)

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const posts = data?.posts ?? []
  const isDefault = !activeLocale || activeLocale === defaultLocale

  const emptyPost = () => ({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: [] as string[],
    category: 'General',
    featured: false,
    status: 'published' as const,
    coverImage: '',
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
  })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing._id) {
      await apiFetch(`/newsroom/${editing.slug}`, { method: 'PUT', body: JSON.stringify(editing) })
    } else {
      await createPost.mutateAsync(editing)
    }
    await refetch()
    setSaving(false)
    setEditing(null)
  }

  const deletePost = async (slug: string) => {
    if (!confirm('Delete this post?')) return
    await apiFetch(`/newsroom/${slug}`, { method: 'DELETE' })
    await refetch()
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button></div>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Post' : 'New Post'}</h2>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v, ...(!editing._id ? { slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') } : {}) })} />
          <Field label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
          <Field label="Excerpt" value={editing.excerpt} onChange={(v) => setEditing({ ...editing, excerpt: v })} textarea />
          <Field label="Content (Markdown)" value={editing.content} onChange={(v) => setEditing({ ...editing, content: v })} textarea rows={12} />
          <Field label="Cover Image URL" value={editing.coverImage ?? ''} onChange={(v) => setEditing({ ...editing, coverImage: v })} />
          <Field label="Category" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
          <Field label="Tags (comma-separated)" value={(editing.tags ?? []).join(', ')} onChange={(v) => setEditing({ ...editing, tags: v.split(',').map((t: string) => t.trim()).filter(Boolean) })} />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Switch value={editing.featured} onValueChange={(val) => setEditing({ ...editing, featured: val })} /><Label>Featured</Label></div>
            <div className="flex items-center gap-2"><Switch value={editing.status === 'published'} onValueChange={(val) => setEditing({ ...editing, status: val ? 'published' : 'draft' })} /><Label>{editing.status === 'published' ? 'Published' : 'Draft'}</Label></div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">SEO</h3>
            <div className="flex flex-col gap-4">
              <Field label="Meta Title (optional)" value={editing.metaTitle ?? ''} onChange={(v) => setEditing({ ...editing, metaTitle: v })} />
              <Field label="Meta Description (optional)" value={editing.metaDescription ?? ''} onChange={(v) => setEditing({ ...editing, metaDescription: v })} textarea />
              <Field label="OG Image URL (optional)" value={editing.ogImage ?? ''} onChange={(v) => setEditing({ ...editing, ogImage: v })} />
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving...' : editing._id ? 'Update' : 'Publish'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  if (translatingPost && !isDefault) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setTranslatingPost(null)}>&larr; Back</Button></div>
        <h2 className="text-xl font-semibold text-foreground">Translate: {translatingPost.title}</h2>
        <div className="mt-4">
          <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
        </div>
        <div className="mt-6">
          <TranslationFields
            collection="newsroom"
            documentId={translatingPost._id}
            locale={activeLocale}
            originalFields={translatingPost}
            translatableFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
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
          <h2 className="text-xl font-semibold text-foreground">Newsroom</h2>
          <p className="mt-1 text-sm text-muted-foreground">{posts.length} posts</p>
        </div>
        {isDefault && (
          <PrimaryButton onPress={() => setEditing(emptyPost())}>
            New post
          </PrimaryButton>
        )}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {posts.map((post: any) => (
          <div key={post._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{post.title}</span>
                {post.featured && <Badge color="primary">Featured</Badge>}
                {post.status === 'draft' && <Badge color="warning">Draft</Badge>}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDefault ? (
                <>
                  <Button variant="ghost" size="small" onPress={() => setEditing({ ...post })}>Edit</Button>
                  <Button variant="ghost" size="small" onPress={() => deletePost(post.slug)}>Delete</Button>
                </>
              ) : (
                <Button variant="ghost" size="small" onPress={() => setTranslatingPost(post)}>Translate</Button>
              )}
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No posts yet.</p>}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea, rows }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {textarea ? <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 3} /> : <Input value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  )
}
