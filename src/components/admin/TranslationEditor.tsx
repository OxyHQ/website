import { useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/client'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Input } from '../ui/shadcn/input'
import { Textarea } from '../ui/shadcn/textarea'
import { Label } from '../ui/shadcn/label'

/**
 * Locale override values keyed by field path. Translations mirror the shape of
 * the source document (which varies per collection: jobs, navigation, footer,
 * pricing, testimonials…), so the map is a tree of primitives, arrays, and
 * nested maps. Editors navigate it dynamically (`fields.items?.[i]?.title`)
 * without knowing the concrete document type, so each node is freely indexable.
 */
export interface TranslationFieldMap {
  [key: string]: TranslationFieldValue
}
export type TranslationFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TranslationFieldValue[]
  | TranslationFieldMap

/**
 * A translation is a partial, recursively-optional override of a source
 * document: editors fill in only the fields they want localized, mirroring the
 * source shape. `DeepPartial` lets the editor callbacks expose `fields` typed
 * against the concrete document so call sites get real autocompletion and type
 * checking (`fields.items?.[i]?.title`) instead of an untyped bag.
 */
export type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

// ── Simple field-based translation editor ──

interface TranslatableField {
  key: string
  label: string
  type: 'text' | 'textarea'
}

export function TranslationFields<O extends object>({
  collection,
  documentId,
  locale,
  originalFields,
  translatableFields,
}: {
  collection: string
  documentId: string
  locale: string
  originalFields: O
  translatableFields: TranslatableField[]
}) {
  const qc = useQueryClient()
  const { data: existing } = useQuery({
    queryKey: ['translation', collection, documentId, locale],
    queryFn: () => apiFetch<{ fields: TranslationFieldMap }>(`/translations/${collection}/${documentId}?locale=${locale}`).catch(() => null),
    enabled: !!documentId && !!locale,
  })

  const [fields, setFields] = useState<TranslationFieldMap>(() => existing?.fields ?? {})
  const [lastSyncedExisting, setLastSyncedExisting] = useState(existing)
  const [saving, setSaving] = useState(false)

  // Reset local edits when server data changes (i.e., when switching locale/document).
  if (existing !== lastSyncedExisting) {
    setLastSyncedExisting(existing)
    setFields(existing?.fields ?? {})
  }

  // Resolve a dotted path against an arbitrary document. The shape varies per
  // collection and is walked at runtime, so the source is read as `unknown`
  // and narrowed at the leaf by the caller.
  const getVal = (obj: unknown, path: string): unknown =>
    path.split('.').reduce<unknown>(
      (acc, p) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[p] : undefined),
      obj,
    )

  const setVal = (obj: TranslationFieldMap, path: string, value: TranslationFieldValue): TranslationFieldMap => {
    const parts = path.split('.')
    const result: TranslationFieldMap = { ...obj }
    let current: TranslationFieldMap = result
    for (let i = 0; i < parts.length - 1; i++) {
      const existingChild = current[parts[i]]
      const nextChild: TranslationFieldMap =
        existingChild && typeof existingChild === 'object' && !Array.isArray(existingChild) ? { ...existingChild } : {}
      current[parts[i]] = nextChild
      current = nextChild
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
            {typeof originalValue === 'string' && originalValue.length > 0 && (
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

export function TranslationJsonEditor<T = TranslationFieldMap>({
  collection,
  documentId,
  locale,
  children,
}: {
  collection: string
  documentId: string
  locale: string
  children: (props: {
    fields: DeepPartial<T>
    setFields: (fields: DeepPartial<T>) => void
    save: () => Promise<void>
    saving: boolean
  }) => ReactNode
}) {
  const qc = useQueryClient()
  const { data: existing } = useQuery({
    queryKey: ['translation', collection, documentId, locale],
    queryFn: () => apiFetch<{ fields: TranslationFieldMap }>(`/translations/${collection}/${documentId}?locale=${locale}`).catch(() => null),
    enabled: !!documentId && !!locale,
  })

  const [fields, setFields] = useState<TranslationFieldMap>(() => existing?.fields ?? {})
  const [lastSyncedExisting, setLastSyncedExisting] = useState(existing)
  const [saving, setSaving] = useState(false)

  if (existing !== lastSyncedExisting) {
    setLastSyncedExisting(existing)
    setFields(existing?.fields ?? {})
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

  // Storage is the raw JSON map; the callback works against `DeepPartial<T>`
  // (a partial override of the document shape). Bridge the two at the boundary.
  const setTypedFields = (next: DeepPartial<T>) => setFields(next as TranslationFieldMap)

  return <>{children({ fields: fields as DeepPartial<T>, setFields: setTypedFields, save, saving })}</>
}

// ── Batch translation editor for array collections (navigation, pricing, testimonials) ──

function useBatchTranslations(collection: string, locale: string) {
  return useQuery({
    queryKey: ['translations', collection, locale],
    queryFn: () => apiFetch<Array<{ documentId: string; fields: TranslationFieldMap }>>(`/translations/${collection}?locale=${locale}`),
    enabled: !!locale,
  })
}

export function BatchTranslationEditor<D extends { _id: string }>({
  collection,
  locale,
  documents,
  renderItem,
}: {
  collection: string
  locale: string
  documents: D[]
  renderItem: (props: {
    doc: D
    fields: DeepPartial<D>
    updateField: (key: string, value: TranslationFieldValue) => void
  }) => ReactNode
}) {
  const qc = useQueryClient()
  const { data: existing } = useBatchTranslations(collection, locale)

  function buildMap(rows: typeof existing): Record<string, TranslationFieldMap> {
    if (!rows) return {}
    const map: Record<string, TranslationFieldMap> = {}
    for (const t of rows) {
      map[t.documentId] = t.fields
    }
    return map
  }

  const [translationsMap, setTranslationsMap] = useState<Record<string, TranslationFieldMap>>(() => buildMap(existing))
  const [lastSyncedExisting, setLastSyncedExisting] = useState(existing)
  const [saving, setSaving] = useState(false)

  if (existing !== lastSyncedExisting) {
    setLastSyncedExisting(existing)
    if (existing) setTranslationsMap(buildMap(existing))
  }

  const updateField = (docId: string, key: string, value: TranslationFieldValue) => {
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
            // Stored translations are a partial override of the document shape;
            // expose them typed against `D` for the render callback.
            fields: (translationsMap[doc._id] ?? {}) as DeepPartial<D>,
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
