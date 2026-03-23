import { useState } from 'react'
import { useJobs } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function JobsAdmin() {
  const { data, refetch } = useJobs()
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const jobs = data ?? []

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
        <button onClick={() => setEditing(null)} className="mb-4 text-sm text-muted-foreground hover:text-foreground">&larr; Back</button>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Job' : 'New Job'}</h2>
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Title</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Department</span><input value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Location</span><input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Type</span><input value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Description</span><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="size-4 rounded border-border" /> Active</label>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Jobs</h2>
        <button onClick={() => setEditing({ title: '', department: '', location: 'Remote', type: 'Full-time', description: '', active: true })} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">New job</button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {jobs.map((j: any) => (
          <button key={j._id} onClick={() => setEditing({ ...j })} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50">
            <div><span className="text-sm font-medium text-foreground">{j.title}</span><span className="ml-2 text-xs text-muted-foreground">{j.department} &middot; {j.location}</span></div>
            <span className={`text-xs ${j.active ? 'text-primary' : 'text-muted-foreground'}`}>{j.active ? 'Active' : 'Inactive'}</span>
          </button>
        ))}
        {jobs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet.</p>}
      </div>
    </div>
  )
}
