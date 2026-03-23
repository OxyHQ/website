import { useState, useEffect } from 'react'
import { useTestimonials } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function TestimonialsAdmin() {
  const { data, refetch } = useTestimonials()
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setItems(JSON.parse(JSON.stringify(data))) }, [data])

  const save = async () => {
    setSaving(true)
    await apiFetch('/testimonials', { method: 'PUT', body: JSON.stringify(items) })
    await refetch()
    setSaving(false)
  }

  const update = (idx: number, field: string, value: string) => {
    const next = [...items]; next[idx] = { ...next[idx], [field]: value }; setItems(next)
  }

  const add = () => setItems([...items, { quote: '', author: '', role: '', company: '', order: items.length }])
  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Testimonials</h2>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} testimonials</p>
        </div>
        <button onClick={add} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Add</button>
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {items.map((t, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <textarea value={t.quote} onChange={(e) => update(i, 'quote', e.target.value)} placeholder="Quote" className="w-full bg-transparent border-none text-sm text-foreground outline-none" rows={3} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input value={t.author} onChange={(e) => update(i, 'author', e.target.value)} placeholder="Name" className="bg-transparent border-none text-sm text-foreground outline-none" />
              <input value={t.role} onChange={(e) => update(i, 'role', e.target.value)} placeholder="Role" className="bg-transparent border-none text-sm text-muted-foreground outline-none" />
              <input value={t.company} onChange={(e) => update(i, 'company', e.target.value)} placeholder="Company" className="bg-transparent border-none text-sm text-muted-foreground outline-none" />
            </div>
            <button onClick={() => remove(i)} className="mt-2 text-xs text-destructive hover:underline">Remove</button>
          </div>
        ))}
        <button onClick={save} disabled={saving} className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
