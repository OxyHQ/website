import { useState, useEffect } from 'react'
import { usePricing } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { type PricingPlan } from '../../../data/pricing'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { BatchTranslationEditor } from '../TranslationEditor'

export default function PricingAdmin() {
  const { data, refetch } = usePricing()
  const { data: locales } = useLocales()
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'

  useEffect(() => { if (data) setPlans(JSON.parse(JSON.stringify(data))) }, [data])

  useEffect(() => {
    if (defaultLocale && !activeLocale) setActiveLocale(defaultLocale)
  }, [defaultLocale, activeLocale])

  const save = async () => {
    setSaving(true)
    await apiFetch('/pricing', { method: 'PUT', body: JSON.stringify(plans) })
    await refetch()
    setSaving(false)
  }

  const update = (idx: number, field: string, value: unknown) => {
    const next = [...plans]
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      const planRecord = next[idx] as unknown as Record<string, unknown>
      next[idx] = { ...next[idx], [parent]: { ...(planRecord[parent] as Record<string, unknown>), [child]: value } } as PricingPlan
    } else {
      next[idx] = { ...next[idx], [field]: value } as PricingPlan
    }
    setPlans(next)
  }

  const isDefault = !activeLocale || activeLocale === defaultLocale

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pricing</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit pricing plans.</p>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      {!isDefault ? (
        <div className="mt-6">
          <BatchTranslationEditor
            collection="pricing"
            locale={activeLocale}
            documents={plans.filter((p): p is PricingPlan & { _id: string } => !!p._id)}
            renderItem={({ doc, fields, updateField }) => (
              <div className="rounded-xl border border-border p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Plan: {doc.name}</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Name</Label>
                    <Input value={fields.name ?? ''} onChange={(e) => updateField('name', e.target.value)} placeholder={doc.name} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Description</Label>
                    <Textarea value={fields.description ?? ''} onChange={(e) => updateField('description', e.target.value)} placeholder={doc.description} rows={2} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>CTA</Label>
                    <Input value={fields.cta ?? ''} onChange={(e) => updateField('cta', e.target.value)} placeholder={doc.cta} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={(fields.features ?? []).join('\n')}
                      onChange={(e) => updateField('features', e.target.value.split('\n'))}
                      placeholder={(doc.features ?? []).join('\n')}
                      rows={4}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {plans.map((plan, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Input value={plan.name} onChange={(e) => update(i, 'name', e.target.value)} className="text-lg font-medium text-foreground bg-transparent border-none outline-none shadow-none" />
                <div className="flex items-center gap-2"><Switch value={plan.highlighted ?? false} onValueChange={(val) => update(i, 'highlighted', val)} /><Label>Highlighted</Label></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><Label className="text-xs text-muted-foreground">Monthly ($)</Label><Input type="number" value={plan.price?.monthly ?? 0} onChange={(e) => update(i, 'price.monthly', +e.target.value)} /></div>
                <div className="flex flex-col gap-1"><Label className="text-xs text-muted-foreground">Annual ($)</Label><Input type="number" value={plan.price?.annual ?? 0} onChange={(e) => update(i, 'price.annual', +e.target.value)} /></div>
              </div>
              <Textarea value={plan.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Description" className="mt-3" rows={2} />
              <Textarea value={(plan.features ?? []).join('\n')} onChange={(e) => update(i, 'features', e.target.value.split('\n'))} placeholder="Features (one per line)" className="mt-2 font-mono" rows={4} />
            </div>
          ))}
          <div className="self-start">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
