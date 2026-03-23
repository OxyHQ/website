import { useState } from 'react'
import { useJobs } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'

type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }

const emptyJob = () => ({
  title: '',
  slug: '',
  subtitle: '',
  department: '',
  location: 'Remote',
  type: 'Full-time',
  compensation: '',
  description: [] as DescriptionBlock[],
  active: true,
  order: 0,
})

export default function JobsAdmin() {
  const { data, refetch } = useJobs()
  const { data: locales } = useLocales()
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')
  const [translatingJob, setTranslatingJob] = useState<any | null>(null)

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const jobs = data ?? []
  const isDefault = !activeLocale || activeLocale === defaultLocale

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      if (editing._id) {
        await apiFetch(`/jobs/${editing._id}`, { method: 'PUT', body: JSON.stringify(editing) })
      } else {
        await apiFetch('/jobs', { method: 'POST', body: JSON.stringify(editing) })
      }
      await refetch()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job?')) return
    await apiFetch(`/jobs/${id}`, { method: 'DELETE' })
    await refetch()
  }

  const autoSlug = (title: string, location: string) => {
    return `${title} ${location}`
      .toLowerCase()
      .replace(/[\[\]()]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const addBlock = (blockType: 'paragraph' | 'heading' | 'list') => {
    const desc = [...(Array.isArray(editing.description) ? editing.description : [])]
    if (blockType === 'list') {
      desc.push({ type: 'list', items: [''] })
    } else {
      desc.push({ type: blockType, text: '' })
    }
    setEditing({ ...editing, description: desc })
  }

  const updateBlock = (idx: number, value: any) => {
    const desc = [...(Array.isArray(editing.description) ? editing.description : [])]
    desc[idx] = { ...desc[idx], ...value }
    setEditing({ ...editing, description: desc })
  }

  const removeBlock = (idx: number) => {
    const desc = (editing.description ?? []).filter((_: any, i: number) => i !== idx)
    setEditing({ ...editing, description: desc })
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back</Button></div>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Job' : 'New Job'}</h2>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input
              value={editing.title}
              onChange={(e) => {
                const title = e.target.value
                const updates: any = { title }
                if (!editing._id) updates.slug = autoSlug(title, editing.location)
                setEditing({ ...editing, ...updates })
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Slug</Label>
            <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="font-mono" />
            <p className="text-xs text-muted-foreground">Auto-generated from title + location. Must be unique.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Subtitle</Label>
            <Input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="Short tagline for the role" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Department</Label>
              <Input value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <Input
                value={editing.location}
                onChange={(e) => {
                  const location = e.target.value
                  const updates: any = { location }
                  if (!editing._id) updates.slug = autoSlug(editing.title, location)
                  setEditing({ ...editing, ...updates })
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><Label>Type</Label><Input value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} /></div>
            <div className="flex flex-col gap-1.5"><Label>Compensation</Label><Input value={editing.compensation} onChange={(e) => setEditing({ ...editing, compensation: e.target.value })} placeholder="e.g. $80K – $120K · Offers Equity" /></div>
          </div>

          {/* Description blocks editor */}
          <div className="mt-2">
            <Label>Description</Label>
            <p className="mb-3 text-xs text-muted-foreground">Build the job description using content blocks.</p>
            <div className="flex flex-col gap-3">
              {(Array.isArray(editing.description) ? editing.description : []).map((block: DescriptionBlock, idx: number) => (
                <div key={idx} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{block.type}</span>
                    <Button variant="ghost" size="small" onPress={() => removeBlock(idx)}>Remove</Button>
                  </div>
                  {block.type === 'list' ? (
                    <Textarea
                      value={block.items.join('\n')}
                      onChange={(e) => updateBlock(idx, { items: e.target.value.split('\n') })}
                      placeholder="One item per line"
                      rows={4}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <Textarea
                      value={block.text}
                      onChange={(e) => updateBlock(idx, { text: e.target.value })}
                      placeholder={block.type === 'heading' ? 'Section heading' : 'Paragraph text (HTML allowed)'}
                      rows={block.type === 'heading' ? 1 : 3}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="ghost" size="small" onPress={() => addBlock('paragraph')}>+ Paragraph</Button>
                <Button variant="ghost" size="small" onPress={() => addBlock('heading')}>+ Heading</Button>
                <Button variant="ghost" size="small" onPress={() => addBlock('list')}>+ List</Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2"><Switch value={editing.active} onValueChange={(val) => setEditing({ ...editing, active: val })} /><Label>Active</Label></div>
          <div className="flex gap-3">
            <PrimaryButton onPress={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  if (translatingJob && !isDefault) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setTranslatingJob(null)}>&larr; Back</Button></div>
        <h2 className="text-xl font-semibold text-foreground">Translate: {translatingJob.title}</h2>
        <div className="mt-4">
          <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
        </div>
        <div className="mt-6">
          <TranslationFields
            collection="jobs"
            documentId={translatingJob._id}
            locale={activeLocale}
            originalFields={translatingJob}
            translatableFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'subtitle', label: 'Subtitle', type: 'text' },
              { key: 'department', label: 'Department', type: 'text' },
              { key: 'location', label: 'Location', type: 'text' },
              { key: 'type', label: 'Type', type: 'text' },
              { key: 'compensation', label: 'Compensation', type: 'text' },
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Jobs</h2>
        <div className="flex items-center gap-2">
          {isDefault && (
            <PrimaryButton onPress={() => setEditing(emptyJob())}>New job</PrimaryButton>
          )}
        </div>
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {jobs.map((j: any) => (
          <div
            key={j._id}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div>
              <span className="text-sm font-medium text-foreground">{j.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{j.department} &middot; {j.location}</span>
              {j.slug && <span className="ml-2 font-mono text-xs text-muted-foreground">/{j.slug}</span>}
            </div>
            <div className="flex items-center gap-2">
              {j.slug && (
                <a href={`/careers/${j.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">View</a>
              )}
              {isDefault ? (
                <>
                  <Button variant="ghost" size="small" onPress={() => setEditing({ ...j, description: Array.isArray(j.description) ? j.description : [] })}>Edit</Button>
                  <Button variant="ghost" size="small" onPress={() => deleteJob(j._id)}>Delete</Button>
                </>
              ) : (
                <Button variant="ghost" size="small" onPress={() => setTranslatingJob(j)}>Translate</Button>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${j.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>{j.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet.</p>}
      </div>
    </div>
  )
}
