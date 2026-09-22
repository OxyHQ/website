import { useState } from 'react'
import { useTestimonials, useLocales } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton } from '@oxy.so/bloom/button'
import { LabeledTextField } from '../LabeledTextField'
import { Textarea } from '@oxy.so/bloom/textarea'
import LocaleSwitcher from '../LocaleSwitcher'
import { BatchTranslationEditor } from '../TranslationEditor'

interface AdminTestimonial {
  _id?: string
  quote: string
  author: string
  role: string
  company: string
  order: number
}

function cloneTestimonials(data: unknown): AdminTestimonial[] {
  if (!data) return []
  return JSON.parse(JSON.stringify(data)) as AdminTestimonial[]
}

export default function TestimonialsAdmin() {
  const { data, refetch } = useTestimonials()
  const { data: locales } = useLocales()
  const [items, setItems] = useState<AdminTestimonial[]>(() => cloneTestimonials(data))
  const [lastSyncedData, setLastSyncedData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const resolvedActiveLocale = activeLocale || defaultLocale

  if (data !== lastSyncedData) {
    setLastSyncedData(data)
    if (data) setItems(cloneTestimonials(data))
  }

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

  const isDefault = resolvedActiveLocale === defaultLocale

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Testimonials</h2>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} testimonials</p>
        </div>
        {isDefault && <PrimaryButton onPress={add}>Add</PrimaryButton>}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={resolvedActiveLocale} onLocaleChange={setActiveLocale} />
      </div>

      {!isDefault ? (
        <div className="mt-6">
          <BatchTranslationEditor
            collection="testimonials"
            locale={resolvedActiveLocale}
            documents={items.filter((t): t is AdminTestimonial & { _id: string } => !!t._id)}
            renderItem={({ doc, fields, updateField }) => (
              <div className="rounded-xl border border-border p-4">
                <p className="mb-2 text-xs text-muted-foreground">By: {doc.author}</p>
                <div className="flex flex-col gap-3">
                  <Textarea label="Quote" value={fields.quote ?? ''} onValueChange={(value) => updateField('quote', value)} placeholder={doc.quote} rows={3} />
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledTextField label="Role" value={fields.role ?? ''} onValueChange={(value) => updateField('role', value)} placeholder={doc.role} />
                    <LabeledTextField label="Company" value={fields.company ?? ''} onValueChange={(value) => updateField('company', value)} placeholder={doc.company} />
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {items.map((t, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <Textarea label="Quote" value={t.quote} onValueChange={(value) => update(i, 'quote', value)} placeholder="Quote" rows={3} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <LabeledTextField label="Name" value={t.author} onValueChange={(value) => update(i, 'author', value)} placeholder="Name" />
                <LabeledTextField label="Role" value={t.role} onValueChange={(value) => update(i, 'role', value)} placeholder="Role" />
                <LabeledTextField label="Company" value={t.company} onValueChange={(value) => update(i, 'company', value)} placeholder="Company" />
              </div>
              <div className="mt-2"><Button variant="ghost" size="small" onPress={() => remove(i)}>Remove</Button></div>
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
