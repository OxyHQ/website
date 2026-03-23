import { useState, useEffect } from 'react'
import { useSiteSettings } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'

export default function SiteSettingsAdmin() {
  const { data, refetch } = useSiteSettings()
  const { data: locales } = useLocales()
  const [form, setForm] = useState({ siteTitle: '', siteDescription: '', ogImage: '', banner: { text: '', href: '', visible: false } })
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'

  useEffect(() => {
    if (data) setForm(data as any)
  }, [data])

  useEffect(() => {
    if (defaultLocale && !activeLocale) setActiveLocale(defaultLocale)
  }, [defaultLocale, activeLocale])

  const save = async () => {
    setSaving(true)
    await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(form) })
    await refetch()
    setSaving(false)
  }

  const isDefault = !activeLocale || activeLocale === defaultLocale

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Site Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Global site metadata and banner configuration.</p>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      {isDefault ? (
        <div className="mt-6 flex flex-col gap-4">
          <Field label="Site Title" value={form.siteTitle} onChange={(v) => setForm({ ...form, siteTitle: v })} />
          <Field label="Site Description" value={form.siteDescription} onChange={(v) => setForm({ ...form, siteDescription: v })} textarea />
          <Field label="OG Image URL" value={form.ogImage} onChange={(v) => setForm({ ...form, ogImage: v })} />

          <div className="mt-4 rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-foreground">Banner</h3>
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Text" value={form.banner?.text ?? ''} onChange={(v) => setForm({ ...form, banner: { ...form.banner, text: v } })} />
              <Field label="Link" value={form.banner?.href ?? ''} onChange={(v) => setForm({ ...form, banner: { ...form.banner, href: v } })} />
              <div className="flex items-center gap-2"><Switch value={form.banner?.visible ?? false} onValueChange={(val) => setForm({ ...form, banner: { ...form.banner, visible: val } })} /><Label>Visible</Label></div>
            </div>
          </div>

          <div className="mt-4 self-start">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <TranslationFields
            collection="settings"
            documentId={(data as any)?._id ?? ''}
            locale={activeLocale}
            originalFields={data as any ?? {}}
            translatableFields={[
              { key: 'siteTitle', label: 'Site Title', type: 'text' },
              { key: 'siteDescription', label: 'Site Description', type: 'textarea' },
              { key: 'banner.text', label: 'Banner Text', type: 'text' },
            ]}
          />
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}
