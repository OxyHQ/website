import { useState, useEffect } from 'react'
import { useFooter } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function FooterAdmin() {
  const { data, refetch } = useFooter()
  const [form, setForm] = useState<any>({ columns: [], socialLinks: [], copyright: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setForm(JSON.parse(JSON.stringify(data)))
  }, [data])

  const save = async () => {
    setSaving(true)
    await apiFetch('/footer', { method: 'PUT', body: JSON.stringify(form) })
    await refetch()
    setSaving(false)
  }

  const updateLink = (colIdx: number, linkIdx: number, field: string, value: string | boolean) => {
    const next = { ...form, columns: [...form.columns] }
    next.columns[colIdx] = { ...next.columns[colIdx], links: [...next.columns[colIdx].links] }
    next.columns[colIdx].links[linkIdx] = { ...next.columns[colIdx].links[linkIdx], [field]: value }
    setForm(next)
  }

  const addLink = (colIdx: number) => {
    const next = { ...form, columns: [...form.columns] }
    next.columns[colIdx] = { ...next.columns[colIdx], links: [...next.columns[colIdx].links, { label: '', href: '/' }] }
    setForm(next)
  }

  const removeLink = (colIdx: number, linkIdx: number) => {
    const next = { ...form, columns: [...form.columns] }
    next.columns[colIdx] = { ...next.columns[colIdx], links: next.columns[colIdx].links.filter((_: any, i: number) => i !== linkIdx) }
    setForm(next)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Footer</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit footer columns and links.</p>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Copyright text</span>
          <input value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
        </label>

        {form.columns.map((col: any, ci: number) => (
          <div key={ci} className="rounded-xl border border-border p-4">
            <input value={col.title} onChange={(e) => { const next = { ...form, columns: [...form.columns] }; next.columns[ci] = { ...col, title: e.target.value }; setForm(next) }} className="text-sm font-medium text-foreground bg-transparent border-none outline-none w-full" />
            <div className="mt-2 flex flex-col gap-2">
              {col.links.map((link: any, li: number) => (
                <div key={li} className="flex items-center gap-2">
                  <input value={link.label} onChange={(e) => updateLink(ci, li, 'label', e.target.value)} placeholder="Label" className="flex-1 bg-transparent border-none text-sm text-foreground outline-none" />
                  <input value={link.href} onChange={(e) => updateLink(ci, li, 'href', e.target.value)} placeholder="/path" className="flex-1 bg-transparent border-none text-xs text-muted-foreground outline-none font-mono" />
                  <button onClick={() => removeLink(ci, li)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                </div>
              ))}
              <button onClick={() => addLink(ci)} className="self-start text-sm text-primary hover:underline">+ Add link</button>
            </div>
          </div>
        ))}

        <button onClick={save} disabled={saving} className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
