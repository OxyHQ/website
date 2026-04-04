import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../api/client'
import { useLocales, type Locale } from '../LocaleSwitcher'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Label } from '../../ui/shadcn/label'
import { Switch } from '@oxyhq/bloom/switch'
import { Trash2, Plus } from 'lucide-react'

interface LocaleForm {
  code: string
  name: string
  nativeName: string
  isDefault: boolean
  enabled: boolean
}

const emptyForm: LocaleForm = { code: '', name: '', nativeName: '', isDefault: false, enabled: true }

export default function LocalesAdmin() {
  const { data: locales, refetch } = useLocales()
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<LocaleForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    try {
      if (editingCode) {
        await apiFetch(`/locales/${editingCode}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await apiFetch('/locales', { method: 'POST', body: JSON.stringify(form) })
      }
      await refetch()
      qc.invalidateQueries({ queryKey: ['locales-all'] })
      setAdding(false)
      setEditingCode(null)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  const deleteLocale = async (code: string) => {
    if (!confirm(`Delete locale "${code}" and all its translations?`)) return
    await apiFetch(`/locales/${code}`, { method: 'DELETE' })
    await refetch()
  }

  const startEdit = (locale: Locale) => {
    setForm({ code: locale.code, name: locale.name, nativeName: locale.nativeName, isDefault: locale.isDefault, enabled: locale.enabled })
    setEditingCode(locale.code)
    setAdding(true)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Locales</h2>
      <p className="mt-1 text-sm text-muted-foreground">Manage supported languages for the site.</p>

      <div className="mt-6 flex flex-col gap-3">
        {locales?.map((locale) => (
          <div key={locale.code} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-sm">{locale.code}</span>
              <span className="font-medium text-foreground">{locale.name}</span>
              {locale.nativeName !== locale.name && (
                <span className="text-sm text-muted-foreground">({locale.nativeName})</span>
              )}
              {locale.isDefault && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Default</span>
              )}
              {!locale.enabled && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Disabled</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(locale)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground">
                Edit
              </button>
              {!locale.isDefault && (
                <button onClick={() => deleteLocale(locale.code)} className="rounded-md p-1.5 text-muted-foreground hover:text-red-500">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditingCode(null); setForm(emptyForm) }}
            className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="size-4" /> Add locale
          </button>
        )}

        {adding && (
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">{editingCode ? 'Edit' : 'New'} Locale</h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
                    placeholder="es"
                    disabled={!!editingCode}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Spanish" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Native Name</Label>
                  <Input value={form.nativeName} onChange={(e) => setForm({ ...form, nativeName: e.target.value })} placeholder="Espanol" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch value={form.enabled} onValueChange={(v) => setForm({ ...form, enabled: v })} /><Label>Enabled</Label></div>
                <div className="flex items-center gap-2"><Switch value={form.isDefault} onValueChange={(v) => setForm({ ...form, isDefault: v })} /><Label>Default</Label></div>
              </div>
              <div className="flex gap-2">
                <PrimaryButton onPress={save} disabled={saving || !form.code || !form.name}>
                  {saving ? 'Saving...' : editingCode ? 'Update' : 'Add'}
                </PrimaryButton>
                <button onClick={() => { setAdding(false); setEditingCode(null); setForm(emptyForm) }} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
