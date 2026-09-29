import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../api/client'
import { useLocales, type Locale } from '../../../api/hooks'
import { Badge } from '@oxy.so/bloom/badge'
import { Button } from '@oxy.so/bloom/button'
import { LabeledTextField } from '../LabeledTextField'
import { Switch } from '@oxy.so/bloom/switch'
import { RiDeleteBinLine } from '@oxy.so/bloom/icons/RiDeleteBinLine'
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'

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

  const deleteAction = useConfirmAction<Locale>({
    onConfirm: async (locale) => {
      await apiFetch(`/locales/${locale.code}`, { method: 'DELETE' })
      await refetch()
    },
  })

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
              {locale.isDefault && <Badge content="Default" tone="accent" appearance="subtle" />}
              {!locale.enabled && <Badge content="Disabled" tone="warning" appearance="subtle" />}
            </div>
            <div className="flex items-center gap-2">
              <Button appearance="plain" tone="neutral" onPress={() => startEdit(locale)}>
                Edit
              </Button>
              {!locale.isDefault && (
                <Button
                  appearance="plain"
                  tone="neutral"
                  iconOnly
                  leadingIcon={RiDeleteBinLine}
                  accessibilityLabel={`Delete ${locale.name}`}
                  onPress={() => deleteAction.request(locale)}
                />
              )}
            </div>
          </div>
        ))}

        {!adding && (
          <Button
            appearance="outline"
            tone="neutral"
            leadingIcon={RiAddLine}
            onPress={() => { setAdding(true); setEditingCode(null); setForm(emptyForm) }}
            style={{ alignSelf: 'flex-start' }}
          >
            Add locale
          </Button>
        )}

        {adding && (
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">{editingCode ? 'Edit' : 'New'} Locale</h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <LabeledTextField
                    label="Code"
                    value={form.code}
                    onValueChange={(v) => setForm({ ...form, code: v.toLowerCase() })}
                    placeholder="es"
                    disabled={!!editingCode}
                  />
                </div>
                <div className="flex-1">
                  <LabeledTextField label="Name" value={form.name} onValueChange={(v) => setForm({ ...form, name: v })} placeholder="Spanish" />
                </div>
                <div className="flex-1">
                  <LabeledTextField label="Native Name" value={form.nativeName} onValueChange={(v) => setForm({ ...form, nativeName: v })} placeholder="Espanol" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} /><span className="text-sm font-medium text-foreground">Enabled</span></div>
                <div className="flex items-center gap-2"><Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} /><span className="text-sm font-medium text-foreground">Default</span></div>
              </div>
              <div className="flex gap-2">
                <Button appearance="solid" tone="accent" onPress={save} disabled={saving || !form.code || !form.name}>
                  {saving ? 'Saving...' : editingCode ? 'Update' : 'Add'}
                </Button>
                <Button appearance="plain" tone="neutral" onPress={() => { setAdding(false); setEditingCode(null); setForm(emptyForm) }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete locale “${deleteAction.target.code}”?` : 'Delete locale?'}
        description="This removes the locale and all of its translations. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
