/**
 * Escape JSON for a `<script>` raw-text element so CMS content cannot close
 * the element or alter the surrounding document.
 */
export function serializeStructuredData(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}
