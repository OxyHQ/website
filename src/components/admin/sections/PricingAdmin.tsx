import { useState } from 'react'
import { usePricing, useLocales } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { type PricingPlan } from '../../../data/pricing'
import { PrimaryButton } from '@oxy.so/bloom/button'
import { Switch } from '@oxy.so/bloom/switch'
import { LabeledTextField } from '../LabeledTextField'
import { Textarea } from '@oxy.so/bloom/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher from '../LocaleSwitcher'
import { BatchTranslationEditor } from '../TranslationEditor'

function cloneData<T>(data: T[] | undefined): T[] {
  return data ? (JSON.parse(JSON.stringify(data)) as T[]) : []
}

export default function PricingAdmin() {
  const { data, refetch } = usePricing()
  const { data: locales } = useLocales()
  const [plans, setPlans] = useState<PricingPlan[]>(() => cloneData(data))
  const [lastSyncedData, setLastSyncedData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const resolvedActiveLocale = activeLocale || defaultLocale

  if (data !== lastSyncedData) {
    setLastSyncedData(data)
    if (data) setPlans(cloneData(data))
  }

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

  const isDefault = resolvedActiveLocale === defaultLocale

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pricing</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit pricing plans.</p>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={resolvedActiveLocale} onLocaleChange={setActiveLocale} />
      </div>

      {!isDefault ? (
        <div className="mt-6">
          <BatchTranslationEditor
            collection="pricing"
            locale={resolvedActiveLocale}
            documents={plans.filter((p): p is PricingPlan & { _id: string } => !!p._id)}
            renderItem={({ doc, fields, updateField }) => (
              <div className="rounded-xl border border-border p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Plan: {doc.name}</h3>
                <div className="flex flex-col gap-3">
                  <LabeledTextField label="Name" value={fields.name ?? ''} onValueChange={(value) => updateField('name', value)} placeholder={doc.name} />
                  <Textarea label="Description" value={fields.description ?? ''} onValueChange={(value) => updateField('description', value)} placeholder={doc.description} rows={2} />
                  <LabeledTextField label="CTA" value={fields.cta ?? ''} onValueChange={(value) => updateField('cta', value)} placeholder={doc.cta} />
                  <Textarea
                    label="Features (one per line)"
                    value={(fields.features ?? []).join('\n')}
                    onValueChange={(value) => updateField('features', value.split('\n'))}
                    placeholder={(doc.features ?? []).join('\n')}
                    rows={4}
                  />
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
                <LabeledTextField label="Plan name" value={plan.name} onValueChange={(name) => update(i, 'name', name)} />
                <div className="flex items-center gap-2"><Switch value={plan.highlighted ?? false} onValueChange={(val) => update(i, 'highlighted', val)} /><Label>Highlighted</Label></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <LabeledTextField label="Monthly ($)" inputMode="numeric" value={String(plan.price?.monthly ?? 0)} onValueChange={(value) => update(i, 'price.monthly', +value)} />
                <LabeledTextField label="Annual ($)" inputMode="numeric" value={String(plan.price?.annual ?? 0)} onValueChange={(value) => update(i, 'price.annual', +value)} />
              </div>
              <div className="mt-3">
                <Textarea label="Description" value={plan.description} onValueChange={(description) => update(i, 'description', description)} placeholder="Description" rows={2} />
              </div>
              <div className="mt-2">
                <Textarea label="Features (one per line)" value={(plan.features ?? []).join('\n')} onValueChange={(value) => update(i, 'features', value.split('\n'))} placeholder="Features (one per line)" rows={4} />
              </div>
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
