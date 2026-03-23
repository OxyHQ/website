import { useState } from 'react'
import { useNewsroomPosts, useCreateNewsroomPost } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function NewsroomAdmin() {
  const { data, refetch } = useNewsroomPosts({ limit: 50 })
  const createPost = useCreateNewsroomPost()
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const posts = data?.posts ?? []

  const emptyPost = () => ({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: [] as string[],
    category: 'General',
    featured: false,
    coverImage: '',
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
        <button onClick={() => setEditing(null)} className="mb-4 text-sm text-muted-foreground hover:text-foreground">&larr; Back to list</button>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Post' : 'New Post'}</h2>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v, ...(!editing._id ? { slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') } : {}) })} />
          <Field label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
          <Field label="Excerpt" value={editing.excerpt} onChange={(v) => setEditing({ ...editing, excerpt: v })} textarea />
          <Field label="Content (Markdown)" value={editing.content} onChange={(v) => setEditing({ ...editing, content: v })} textarea rows={12} />
          <Field label="Cover Image URL" value={editing.coverImage ?? ''} onChange={(v) => setEditing({ ...editing, coverImage: v })} />
          <Field label="Category" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
          <Field label="Tags (comma-separated)" value={(editing.tags ?? []).join(', ')} onChange={(v) => setEditing({ ...editing, tags: v.split(',').map((t: string) => t.trim()).filter(Boolean) })} />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="size-4 rounded border-border" />
            Featured
          </label>

          <div className="mt-2 flex gap-3">
            <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : editing._id ? 'Update' : 'Publish'}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted">Cancel</button>
          </div>
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
        <button onClick={() => setEditing(emptyPost())} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
          New post
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {posts.map((post: any) => (
          <div key={post._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{post.title}</span>
                {post.featured && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Featured</span>}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                @{post.authorUsername} &middot; {new Date(post.publishedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...post })} className="text-sm text-primary hover:underline">Edit</button>
              <button onClick={() => deletePost(post.slug)} className="text-sm text-destructive hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No posts yet.</p>}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea, rows }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  const cls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 3} className={cls} /> : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </label>
  )
}
