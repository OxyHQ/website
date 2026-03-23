import { useState, useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/client'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Input } from '../ui/shadcn/input'
import { Textarea } from '../ui/shadcn/textarea'
import { Label } from '../ui/shadcn/label'

// ── Simple field-based translation editor ──

interface TranslatableField {
  key: string
  label: string
  type: 'text' | 'textarea'
}

export function TranslationFields({
  collection,
  documentId,
  locale,
  originalFields,
  translatableFields,
}: {
  collection: string
  documentId: string
  locale: string
  originalFields: Record<string, any>
  translatableFields: TranslatableField[]
}) {
  const qc = useQueryClient()
  const { data: existing } = useQuery({
    queryKey: ['translation', collection, documentId, locale],
    queryFn: () => apiFetch<{ fields: Record<string, any> }>(`/translations/${collection}/${documentId}?locale=${locale}`).catch(() => null),
    enabled: !!documentId && !!locale,
  })

  const [fields, setFields] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFields(existing?.fields ?? {})
  }, [existing])

  const getVal = (obj: Record<string, any>, path: string) =>
    path.split('.').reduce((acc, p) => acc?.[p], obj)

  const setVal = (obj: Record<string, any>, path: string, value: any) => {
    const parts = path.split('.')
    const result = { ...obj }
    let current: any = result
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...(current[parts[i]] ?? {}) }
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
    return result
  }

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch(`/translations/${collection}/${documentId}?locale=${locale}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      })
      qc.invalidateQueries({ queryKey: ['translation', collection, documentId, locale] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Editing <span className="font-medium text-foreground">{locale.toUpperCase()}</span> translation. Original values shown as placeholders.
        </p>
      </div>

      {translatableFields.map((field) => {
        const originalValue = getVal(originalFields, field.key)
        const translatedValue = String(getVal(fields, field.key) ?? '')

        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label>{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea
                value={translatedValue}
                onChange={(e) => setFields(setVal(fields, field.key, e.target.value))}
                placeholder={typeof originalValue === 'string' ? originalValue : ''}
                rows={3}
              />
            ) : (
              <Input
                value={translatedValue}
                onChange={(e) => setFields(setVal(fields, field.key, e.target.value))}
                placeholder={typeof originalValue === 'string' ? originalValue : ''}
              />
            )}
            {originalValue && typeof originalValue === 'string' && (
              <p className="text-xs text-muted-foreground">Original: {originalValue}</p>
            )}
          </div>
        )
      })}

      <div className="mt-2 self-start">
        <PrimaryButton onPress={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save translation'}
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── Generic translation editor using raw JSON fields ──

export function TranslationJsonEditor({
  collection,
  documentId,
  locale,
  children,
}: {
  collection: string
  documentId: string
  locale: string
  children: (props: {
    fields: Record<string, any>
    setFields: (fields: Record<string, any>) => void
    save: () => Promise<void>
    saving: boolean
  }) => ReactNode
}) {
  const qc = useQueryClient()
  const { data: existing } = useQuery({
    queryKey: ['translation', collection, documentId, locale],
    queryFn: () => apiFetch<{ fields: Record<string, any> }>(`/translations/${collection}/${documentId}?locale=${locale}`).catch(() => null),
    enabled: !!documentId && !!locale,
  })

  const [fields, setFields] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFields(existing?.fields ?? {})
  }, [existing])

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch(`/translations/${collection}/${documentId}?locale=${locale}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      })
      qc.invalidateQueries({ queryKey: ['translation', collection, documentId, locale] })
    } finally {
      setSaving(false)
    }
  }

  return <>{children({ fields, setFields, save, saving })}</>
}

// ── Batch translation editor for array collections (navigation, pricing, testimonials) ──

export function useBatchTranslations(collection: string, locale: string) {
  return useQuery({
    queryKey: ['translations', collection, locale],
    queryFn: () => apiFetch<Array<{ documentId: string; fields: Record<string, any> }>>(`/translations/${collection}?locale=${locale}`),
    enabled: !!locale,
  })
}

export function BatchTranslationEditor({
  collection,
  locale,
  documents,
  renderItem,
}: {
  collection: string
  locale: string
  documents: Array<{ _id: string; [key: string]: any }>
  renderItem: (props: {
    doc: any
    fields: Record<string, any>
    updateField: (key: string, value: any) => void
  }) => ReactNode
}) {
  const qc = useQueryClient()
  const { data: existing } = useBatchTranslations(collection, locale)
  const [translationsMap, setTranslationsMap] = useState<Record<string, Record<string, any>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!existing) return
    const map: Record<string, Record<string, any>> = {}
    for (const t of existing) {
      map[t.documentId] = t.fields
    }
    setTranslationsMap(map)
  }, [existing])

  const updateField = (docId: string, key: string, value: any) => {
    setTranslationsMap(prev => ({
      ...prev,
      [docId]: { ...(prev[docId] ?? {}), [key]: value },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(translationsMap)
          .filter(([, fields]) => Object.keys(fields).length > 0)
          .map(([docId, fields]) =>
            apiFetch(`/translations/${collection}/${docId}?locale=${locale}`, {
              method: 'PUT',
              body: JSON.stringify({ fields }),
            })
          )
      )
      qc.invalidateQueries({ queryKey: ['translations', collection, locale] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Editing <span className="font-medium text-foreground">{locale.toUpperCase()}</span> translations. Original values shown as placeholders.
        </p>
      </div>

      {documents.map((doc) => (
        <div key={doc._id}>
          {renderItem({
            doc,
            fields: translationsMap[doc._id] ?? {},
            updateField: (key, value) => updateField(doc._id, key, value),
          })}
        </div>
      ))}

      <div className="mt-2 self-start">
        <PrimaryButton onPress={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save all translations'}
        </PrimaryButton>
      </div>
    </div>
  )
}
