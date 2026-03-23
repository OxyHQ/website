import { useState } from 'react'
import { usePage, useUpdatePage } from '../../../api/hooks'

const PAGE_SLUGS = ['home', 'pricing', 'partners', 'help']

export default function PagesAdmin() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  if (activeSlug) {
    return (
      <div>
        <button onClick={() => setActiveSlug(null)} className="mb-4 text-sm text-muted-foreground hover:text-foreground">&larr; Back to pages</button>
        <PageEditor slug={activeSlug} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pages</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit page content and sections.</p>
      <div className="mt-6 flex flex-col gap-2">
        {PAGE_SLUGS.map((slug) => (
          <button key={slug} onClick={() => setActiveSlug(slug)} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50">
            <span className="text-sm font-medium text-foreground capitalize">{slug}</span>
            <span className="text-xs text-muted-foreground">/{slug === 'home' ? '' : slug}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PageEditor({ slug }: { slug: string }) {
  const { data, refetch } = usePage(slug)
  const updatePage = useUpdatePage(slug)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  if (data && !form) setForm(JSON.parse(JSON.stringify(data)))
  if (!form) return <p className="text-sm text-muted-foreground">Loading page...</p>

  const save = async () => {
    setSaving(true)
    await updatePage.mutateAsync(form)
    await refetch()
    setSaving(false)
  }

  const updateSection = (idx: number, field: string, value: any) => {
    const next = { ...form, sections: [...form.sections] }
    next.sections[idx] = { ...next.sections[idx], [field]: value }
    setForm(next)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground capitalize">{slug} page</h2>
      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Title</span><input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
        <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Description</span><textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>

        <h3 className="mt-4 text-sm font-semibold text-foreground">Sections</h3>
        {(form.sections ?? []).map((section: any, i: number) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{section.type}</span>
              <span className="text-xs text-muted-foreground">order: {section.order}</span>
            </div>
            <input value={section.heading ?? ''} onChange={(e) => updateSection(i, 'heading', e.target.value)} placeholder="Heading" className="mt-2 w-full bg-transparent border-none text-sm font-medium text-foreground outline-none" />
            <input value={section.subheading ?? ''} onChange={(e) => updateSection(i, 'subheading', e.target.value)} placeholder="Subheading" className="mt-1 w-full bg-transparent border-none text-sm text-muted-foreground outline-none" />
            <textarea value={section.content ?? ''} onChange={(e) => updateSection(i, 'content', e.target.value)} placeholder="Content" rows={3} className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none" />
          </div>
        ))}

        <button onClick={save} disabled={saving} className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
