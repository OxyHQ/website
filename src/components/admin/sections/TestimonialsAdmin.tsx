import { useState, useEffect } from 'react'
import { useTestimonials } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { BatchTranslationEditor } from '../TranslationEditor'
import { Label } from '../../ui/shadcn/label'

export default function TestimonialsAdmin() {
  const { data, refetch } = useTestimonials()
  const { data: locales } = useLocales()
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'

  useEffect(() => { if (data) setItems(JSON.parse(JSON.stringify(data))) }, [data])

  useEffect(() => {
    if (defaultLocale && !activeLocale) setActiveLocale(defaultLocale)
  }, [defaultLocale, activeLocale])

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

  const isDefault = !activeLocale || activeLocale === defaultLocale

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
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      {!isDefault ? (
        <div className="mt-6">
          <BatchTranslationEditor
            collection="testimonials"
            locale={activeLocale}
            documents={items.filter(t => t._id)}
            renderItem={({ doc, fields, updateField }) => (
              <div className="rounded-xl border border-border p-4">
                <p className="mb-2 text-xs text-muted-foreground">By: {doc.author}</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Quote</Label>
                    <Textarea value={fields.quote ?? ''} onChange={(e) => updateField('quote', e.target.value)} placeholder={doc.quote} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Role</Label>
                      <Input value={fields.role ?? ''} onChange={(e) => updateField('role', e.target.value)} placeholder={doc.role} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Company</Label>
                      <Input value={fields.company ?? ''} onChange={(e) => updateField('company', e.target.value)} placeholder={doc.company} />
                    </div>
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
              <Textarea value={t.quote} onChange={(e) => update(i, 'quote', e.target.value)} placeholder="Quote" className="bg-transparent border-none text-sm text-foreground shadow-none" rows={3} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Input value={t.author} onChange={(e) => update(i, 'author', e.target.value)} placeholder="Name" className="bg-transparent border-none text-sm text-foreground shadow-none" />
                <Input value={t.role} onChange={(e) => update(i, 'role', e.target.value)} placeholder="Role" className="bg-transparent border-none text-sm text-muted-foreground shadow-none" />
                <Input value={t.company} onChange={(e) => update(i, 'company', e.target.value)} placeholder="Company" className="bg-transparent border-none text-sm text-muted-foreground shadow-none" />
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
