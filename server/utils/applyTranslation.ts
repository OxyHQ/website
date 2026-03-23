import type { ITranslation } from '../models/Translation.js'

/**
 * Deep-merges translation fields over a document's JSON.
 * Only overwrites fields present in the translation; missing fields
 * fall back to the original (default locale) value.
 */
export function applyTranslation<T extends Record<string, any>>(
  doc: T,
  translation: ITranslation | null,
): T {
  if (!translation) return doc
  return deepMerge(doc, translation.fields)
}

/**
 * Applies translations to an array of documents, matching by _id.
 */
export function applyTranslations<T extends Record<string, any>>(
  docs: T[],
  translations: ITranslation[],
): T[] {
  if (!translations.length) return docs
  const map = new Map<string, ITranslation>()
  for (const t of translations) {
    map.set(t.documentId, t)
  }
  return docs.map(doc => {
    const id = (doc._id ?? doc.id)?.toString()
    const t = id ? map.get(id) : null
    return t ? deepMerge(doc, t.fields) : doc
  })
}

function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Record<string, any>,
): T {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const srcVal = source[key]
    const tgtVal = (target as any)[key]
    if (srcVal === null || srcVal === undefined) continue
    if (Array.isArray(srcVal) && Array.isArray(tgtVal)) {
      // Merge arrays element-by-element for nested structures (e.g. nav items)
      result[key as keyof T] = tgtVal.map((item: any, i: number) => {
        if (i < srcVal.length && srcVal[i] != null && typeof srcVal[i] === 'object' && typeof item === 'object' && !Array.isArray(item)) {
          return deepMerge(item, srcVal[i])
        }
        return i < srcVal.length && srcVal[i] != null ? srcVal[i] : item
      }) as any
      // If source array is longer, append extra elements
      if (srcVal.length > tgtVal.length) {
        ;(result[key as keyof T] as any[]).push(...srcVal.slice(tgtVal.length))
      }
    } else if (typeof srcVal === 'object' && typeof tgtVal === 'object' && !Array.isArray(srcVal)) {
      result[key as keyof T] = deepMerge(tgtVal, srcVal)
    } else {
      result[key as keyof T] = srcVal
    }
  }
  return result
}
