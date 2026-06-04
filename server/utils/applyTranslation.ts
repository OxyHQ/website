import type { ITranslation } from '../models/Translation.js'

type Unknown = Record<string, unknown>

function isPlainObject(value: unknown): value is Unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep-merges translation fields over a document's JSON.
 * Only overwrites fields present in the translation; missing fields
 * fall back to the original (default locale) value.
 */
export function applyTranslation<T extends Unknown>(
  doc: T,
  translation: ITranslation | null,
): T {
  if (!translation) return doc
  return deepMerge(doc, translation.fields)
}

/**
 * Applies translations to an array of documents, matching by _id.
 */
export function applyTranslations<T extends Unknown>(
  docs: T[],
  translations: ITranslation[],
): T[] {
  if (!translations.length) return docs
  const map = new Map<string, ITranslation>()
  for (const t of translations) {
    map.set(t.documentId, t)
  }
  return docs.map(doc => {
    const idRaw = doc._id ?? doc.id
    const id =
      idRaw != null && typeof (idRaw as { toString?: () => string }).toString === 'function'
        ? (idRaw as { toString: () => string }).toString()
        : undefined
    const t = id ? map.get(id) : null
    return t ? deepMerge(doc, t.fields) : doc
  })
}

function deepMerge<T extends Unknown>(
  target: T,
  source: Unknown,
): T {
  const result: Unknown = { ...target }
  for (const key of Object.keys(source)) {
    const srcVal = source[key]
    const tgtVal = target[key]
    if (srcVal === null || srcVal === undefined) continue
    if (Array.isArray(srcVal) && Array.isArray(tgtVal)) {
      // Merge arrays element-by-element for nested structures (e.g. nav items)
      const merged = tgtVal.map((item: unknown, i: number) => {
        if (i < srcVal.length && srcVal[i] != null && isPlainObject(srcVal[i]) && isPlainObject(item)) {
          return deepMerge(item, srcVal[i] as Unknown)
        }
        return i < srcVal.length && srcVal[i] != null ? srcVal[i] : item
      })
      // If source array is longer, append extra elements
      if (srcVal.length > tgtVal.length) {
        merged.push(...srcVal.slice(tgtVal.length))
      }
      result[key] = merged
    } else if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      result[key] = deepMerge(tgtVal, srcVal)
    } else {
      result[key] = srcVal
    }
  }
  return result as T
}
