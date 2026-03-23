import { useState, useEffect } from 'react'
import { useSiteSettings } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function SiteSettingsAdmin() {
  const { data, refetch } = useSiteSettings()
  const [form, setForm] = useState({ siteTitle: '', siteDescription: '', ogImage: '', banner: { text: '', href: '', visible: false } })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setForm(data as any)
  }, [data])

  const save = async () => {
    setSaving(true)
    await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(form) })
    await refetch()
    setSaving(false)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Site Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Global site metadata and banner configuration.</p>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Site Title" value={form.siteTitle} onChange={(v) => setForm({ ...form, siteTitle: v })} />
        <Field label="Site Description" value={form.siteDescription} onChange={(v) => setForm({ ...form, siteDescription: v })} textarea />
        <Field label="OG Image URL" value={form.ogImage} onChange={(v) => setForm({ ...form, ogImage: v })} />

        <div className="mt-4 rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Banner</h3>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Text" value={form.banner?.text ?? ''} onChange={(v) => setForm({ ...form, banner: { ...form.banner, text: v } })} />
            <Field label="Link" value={form.banner?.href ?? ''} onChange={(v) => setForm({ ...form, banner: { ...form.banner, href: v } })} />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.banner?.visible ?? false} onChange={(e) => setForm({ ...form, banner: { ...form.banner, visible: e.target.checked } })} className="size-4 rounded border-border" />
              Visible
            </label>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="mt-4 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-ring"
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  )
}
