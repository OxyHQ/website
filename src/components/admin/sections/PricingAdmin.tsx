import { useState, useEffect } from 'react'
import { usePricing } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'

export default function PricingAdmin() {
  const { data, refetch } = usePricing()
  const [plans, setPlans] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setPlans(JSON.parse(JSON.stringify(data))) }, [data])

  const save = async () => {
    setSaving(true)
    await apiFetch('/pricing', { method: 'PUT', body: JSON.stringify(plans) })
    await refetch()
    setSaving(false)
  }

  const update = (idx: number, field: string, value: any) => {
    const next = [...plans]
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      next[idx] = { ...next[idx], [parent]: { ...next[idx][parent], [child]: value } }
    } else {
      next[idx] = { ...next[idx], [field]: value }
    }
    setPlans(next)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pricing</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit pricing plans.</p>

      <div className="mt-6 flex flex-col gap-4">
        {plans.map((plan, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <input value={plan.name} onChange={(e) => update(i, 'name', e.target.value)} className="text-lg font-medium text-foreground bg-transparent border-none outline-none" />
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input type="checkbox" checked={plan.highlighted} onChange={(e) => update(i, 'highlighted', e.target.checked)} /> Highlighted
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1"><span className="text-xs text-muted-foreground">Monthly ($)</span><input type="number" value={plan.price?.monthly ?? 0} onChange={(e) => update(i, 'price.monthly', +e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm outline-none" /></label>
              <label className="flex flex-col gap-1"><span className="text-xs text-muted-foreground">Annual ($)</span><input type="number" value={plan.price?.annual ?? 0} onChange={(e) => update(i, 'price.annual', +e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm outline-none" /></label>
            </div>
            <textarea value={plan.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Description" className="mt-3 w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none" rows={2} />
            <textarea value={(plan.features ?? []).join('\n')} onChange={(e) => update(i, 'features', e.target.value.split('\n'))} placeholder="Features (one per line)" className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none font-mono" rows={4} />
          </div>
        ))}
        <button onClick={save} disabled={saving} className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
