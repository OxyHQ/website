import { useState } from 'react'
import { useJobs } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'

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
    if (editing._id) {
      await apiFetch(`/jobs/${editing._id}`, { method: 'PUT', body: JSON.stringify(editing) })
    } else {
      await apiFetch('/jobs', { method: 'POST', body: JSON.stringify(editing) })
    }
    await refetch()
    setSaving(false)
    setEditing(null)
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back</Button></div>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Job' : 'New Job'}</h2>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Department</Label><Input value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Location</Label><Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Type</Label><Input value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} /></div>
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
              { key: 'department', label: 'Department', type: 'text' },
              { key: 'location', label: 'Location', type: 'text' },
              { key: 'type', label: 'Type', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
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
        {isDefault && (
          <PrimaryButton onPress={() => setEditing({ title: '', department: '', location: 'Remote', type: 'Full-time', description: '', active: true })}>New job</PrimaryButton>
        )}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {jobs.map((j: any) => (
          <button
            key={j._id}
            onClick={() => isDefault ? setEditing({ ...j }) : setTranslatingJob(j)}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div><span className="text-sm font-medium text-foreground">{j.title}</span><span className="ml-2 text-xs text-muted-foreground">{j.department} &middot; {j.location}</span></div>
            <div className="flex items-center gap-2">
              {!isDefault && <span className="text-xs text-muted-foreground">Translate</span>}
              <Badge color={j.active ? 'success' : 'default'}>{j.active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </button>
        ))}
        {jobs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet.</p>}
      </div>
    </div>
  )
}
